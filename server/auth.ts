import session from "express-session";
import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import passport from "passport";
import admin from "firebase-admin";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { authRateLimit, signupRateLimit } from "./middleware";

const BCRYPT_SALT_ROUNDS = 12;

// --- FIREBASE ADMIN SDK INITIALIZATION ---
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

const isProduction = process.env.NODE_ENV === "production";
const hasFirebaseCredentials =
  firebaseConfig.projectId &&
  firebaseConfig.privateKey &&
  firebaseConfig.clientEmail;

if (!hasFirebaseCredentials) {
  if (isProduction) {
    console.error(
      "FATAL: Firebase Admin SDK credentials are missing in production. " +
      "Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.",
    );
    process.exit(1);
  }
  console.warn(
    "[Auth] Firebase Admin SDK credentials not set. Firebase auth (Google/Apple/Microsoft) will not work. " +
    "Local email/password auth is still available.",
  );
} else {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig),
      });
      console.log("[Auth] Firebase Admin SDK initialized successfully.");
    }
  } catch (error) {
    if (isProduction) {
      console.error("[Auth] FATAL: Firebase Admin SDK initialization failed:", error);
      process.exit(1);
    }
    console.error("[Auth] Firebase Admin SDK initialization failed:", error);
  }
}
// --- END FIREBASE ADMIN SDK INITIALIZATION ---


// Función para configurar la sesión de Express
export async function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const isProduction = process.env.NODE_ENV === "production";

  console.log(`[Session] Initializing session store, isProduction=${isProduction}`);
  console.log(`[Session] DATABASE_URL available: ${!!process.env.DATABASE_URL}`);

  let sessionStore: any = undefined;

  if (process.env.DATABASE_URL) {
    try {
      // Import connect-pg-simple at runtime using dynamic import
      const connectPgModule = await import("connect-pg-simple");
      const connectPg = connectPgModule.default;
      const pgStore = connectPg(session);
      sessionStore = new pgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true, // Auto-create sessions table if it doesn't exist
        ttl: sessionTtl,
        tableName: "sessions",
        pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 minutes
      });
      console.log("Using PostgreSQL session store");
    } catch (error) {
      console.log(
        "Failed to setup PostgreSQL session store:",
        (error as Error).message,
      );
      if (isProduction) {
        console.error("FATAL: PostgreSQL session store is required in production for Autoscale");
        throw new Error("PostgreSQL session store required in production");
      }
    }
  } else {
    if (isProduction) {
      console.error("FATAL: DATABASE_URL is required in production for session persistence");
      console.error("MemoryStore is not compatible with Autoscale's multi-instance architecture");
      throw new Error("DATABASE_URL required in production");
    }
    console.log("Using memory session store (not recommended for production)");
  }

  return session({
    secret:
      process.env.SESSION_SECRET ||
      (isProduction ? (() => { throw new Error("SESSION_SECRET required in production"); })() : "demo-secret-" + Math.random().toString(36).substring(7)),
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      maxAge: sessionTtl,
      sameSite: isProduction ? "lax" : undefined,
    },
  });
}

// Main authentication setup
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(await getSession());

  // Configuración de Passport para manejar sesiones
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport serialize y deserialize user
  passport.serializeUser((user: any, done) => {
    // console.log("Passport serializeUser: Serializing user ID:", user.id); // Depuración
    done(null, user.id); // Almacena el ID del usuario en la sesión
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      // console.log("Passport deserializeUser: Deserializing user ID:", id); // Depuración
      const user = await storage.getUser(id); // Recupera el objeto completo del usuario
      if (!user) {
        console.warn("Passport deserializeUser: User not found for ID:", id);
      }
      done(null, user); // Adjunta el objeto de usuario a req.user
    } catch (error) {
      console.error(
        "Passport deserializeUser: Error during deserialization for ID:",
        id,
        error,
      );
      done(error, null);
    }
  });

  // --- CENTRALIZED FIREBASE TOKEN VERIFICATION AND SESSION CREATION ---
  const verifyFirebaseTokenAndLogin = async (req: Request, res: Response) => {
    // Guard: Firebase must be initialized for this route
    if (!hasFirebaseCredentials || !admin.apps.length) {
      return res.status(503).json({
        message: "Firebase authentication is not configured. Use email/password login instead.",
      });
    }

    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "ID Token is required" });
    }

    try {
      // 1️⃣ Verificar el ID Token con Firebase Admin SDK
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const firebaseUid = decodedToken.uid;
      const email = decodedToken.email || null;
      const firstName = decodedToken.name?.split(" ")[0] || null;
      const lastName = decodedToken.name?.split(" ").slice(1).join(" ") || null;
      const profileImageUrl = decodedToken.picture || null;

      // ✅ NUEVO: detectar el proveedor de inicio de sesión
      const provider = decodedToken.firebase?.sign_in_provider || "password";
      console.log(
        `verifyFirebaseTokenAndLogin: Provider detected -> ${provider}`,
      );

      console.log(
        `verifyFirebaseTokenAndLogin: Verifying Firebase Token for UID: ${firebaseUid}, Email: ${email}`,
      );

      // 2️⃣ Intentar encontrar al usuario en tu base de datos
      let user = await storage.getUserByFirebaseUid(firebaseUid);

      if (!user) {
        console.log(
          `verifyFirebaseTokenAndLogin: User with firebaseUid ${firebaseUid} not found. Checking by email.`,
        );

        // Si no se encuentra por firebaseUid, intentar encontrarlo por email (para vincular cuentas)
        if (email) {
          user = await storage.getUserByEmail(email);
          if (user) {
            console.log(
              `verifyFirebaseTokenAndLogin: User with email ${email} found. Linking Firebase UID.`,
            );

            const updates: any = { firebaseUid, provider }; // ✅ incluye provider aquí
            if (profileImageUrl) updates.profileImageUrl = profileImageUrl;
            if (firstName && !user.firstName) updates.firstName = firstName;
            if (lastName && !user.lastName) updates.lastName = lastName;

            await storage.updateUser(user.id, updates);
            user = { ...user, ...updates };
          }
        }
      }

      // 3️⃣ Crear usuario si no existe
      if (!user) {
        console.log(
          `verifyFirebaseTokenAndLogin: User not found by firebaseUid or email. Creating new user for ${email || firebaseUid}.`,
        );

        user = await storage.createUser({
          id: firebaseUid,
          firebaseUid,
          email,
          firstName,
          lastName,
          profileImageUrl,
          provider, // ✅ se guarda al crear
          // otros campos opcionales:
          // role: "agency_owner",
          // hierarchyLevel: 1,
          // canApprove: false,
        });

        console.log(
          `verifyFirebaseTokenAndLogin: New user created with ID: ${user.id}, Firebase UID: ${user.firebaseUid}`,
        );
      } else {
        // 4️⃣ Usuario existente → actualizar info si cambió
        console.log(
          `verifyFirebaseTokenAndLogin: User found/updated: ID ${user.id}, Firebase UID: ${user.firebaseUid}`,
        );

        const updates: any = {};
        if (email && user.email !== email) updates.email = email;
        if (profileImageUrl && user.profileImageUrl !== profileImageUrl)
          updates.profileImageUrl = profileImageUrl;
        if (firstName && user.firstName !== firstName)
          updates.firstName = firstName;
        if (lastName && user.lastName !== lastName) updates.lastName = lastName;
        if (user.provider !== provider) updates.provider = provider; // ✅ se actualiza si cambió

        if (Object.keys(updates).length > 0) {
          await storage.updateUser(user.id, updates);
          user = { ...user, ...updates };
        }
      }

      // 5️⃣ Validar usuario antes de serializar
      if (!user || !user.id) {
        console.error(
          "verifyFirebaseTokenAndLogin: User object is invalid or missing ID after storage operations:",
          user,
        );
        return res
          .status(500)
          .json({ message: "Failed to retrieve or create user in database." });
      }

      // 6️⃣ Establecer la sesión con Passport
      req.login(user, (err) => {
        if (err) {
          console.error(
            "verifyFirebaseTokenAndLogin: Error during Passport login after Firebase auth:",
            err,
          );
          return res
            .status(500)
            .json({ message: "Failed to establish session" });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json({ user: userWithoutPassword });
      });
    } catch (error) {
      console.error(
        "verifyFirebaseTokenAndLogin: Firebase ID Token verification failed:",
        error,
      );
      res
        .status(401)
        .json({ message: "Unauthorized: Invalid or expired ID Token" });
    }
  };

  // --- FIN FUNCIÓN CENTRALIZADA ---

  // --- AUTHENTICATION ROUTES ---

  // Email/password signup
  app.post("/api/local-signup", signupRateLimit, async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      // Check if user already exists
      let user = await storage.getUserByEmail(email);
      if (user) {
        return res.status(409).json({ message: "User with this email already exists. Try logging in." });
      }

      // Hash password with bcrypt
      const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

      const { nanoid } = await import("nanoid");
      const userId = nanoid();
      user = await storage.createUser({
        id: userId,
        firebaseUid: `local_${userId}`,
        email,
        password: hashedPassword,
        firstName: firstName || "",
        lastName: lastName || "",
        provider: "local",
      });

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to establish session" });
        }
        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json({ user: userWithoutPassword });
      });
    } catch (error: any) {
      console.error("Local signup error:", error.message, error.stack);
      res.status(500).json({ message: error.message || "Signup failed" });
    }
  });

  // Email/password login
  app.post("/api/local-login", authRateLimit, async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Use generic message to prevent email enumeration
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if user signed up with a social provider (no local password)
      if (!user.password) {
        const provider = user.provider || "social login";
        return res.status(401).json({
          message: `This account uses ${provider}. Please sign in with ${provider} instead.`,
        });
      }

      // Validate password against stored hash
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to establish session" });
        }
        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json({ user: userWithoutPassword });
      });
    } catch (error: any) {
      console.error("Local login error:", error);
      res.status(500).json({ message: error.message || "Login failed" });
    }
  });

  // Firebase-based auth routes
  app.post("/api/signup", signupRateLimit, verifyFirebaseTokenAndLogin);
  app.post("/api/login", authRateLimit, verifyFirebaseTokenAndLogin);

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return next(err);
      }
      req.session.destroy((err2) => {
        if (err2) {
          console.error("Error destroying session:", err2);
          return res.status(500).json({ message: "Logout failed" });
        }
        // Redirigir o enviar una respuesta de éxito después de destruir la sesión
        res.json({ message: "Logged out successfully" });
      });
    });
  });

  // Endpoint para verificar el estado del usuario actual
  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated() && req.user) {
      const user = req.user as any;
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } else {
      res.status(200).json({ user: null });
    }
  });
} // FIN DE setupAuth

// --- AUTHENTICATION MIDDLEWARE (exported separately from setupAuth) ---

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// Express Request types are extended by @types/passport (user, isAuthenticated, login, logout)
