import session from "express-session";
import type { Express, Request, Response, NextFunction } from "express"; // Importar Request, Response, NextFunction
import passport from "passport";
import admin from 'firebase-admin'; // Importación corregida para firebase-admin
import { storage } from "./storage"; // Asumiendo que storage maneja la persistencia de usuarios

// --- INICIALIZACIÓN DE FIREBASE ADMIN SDK ---
// Cargar credenciales de Firebase desde variables de entorno
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  // Reemplazar '\n' literales con saltos de línea reales para la clave privada
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// Verificar que las credenciales estén presentes
if (!firebaseConfig.projectId || !firebaseConfig.privateKey || !firebaseConfig.clientEmail) {
  console.error("FATAL: Firebase Admin SDK credentials are not fully set in environment variables.");
  // En un entorno de producción, podrías considerar terminar el proceso aquí:
  // process.exit(1);
} else {
  try {
    // Solo inicializar si no ha sido inicializado ya
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig),
      });
      console.log("Firebase Admin SDK initialized successfully.");
    }
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
    // En un entorno de producción, podrías considerar terminar el proceso aquí:
    // process.exit(1);
  }
}
// --- FIN INICIALIZACIÓN FIREBASE ADMIN SDK ---


// Import connect-pg-simple only if DATABASE_URL is available
let connectPg: any = null;
if (process.env.DATABASE_URL) {
  try {
    connectPg = require("connect-pg-simple");
  } catch (error) {
    console.log("PostgreSQL session store not available, using memory store");
  }
}

// --- INICIO DE CÓDIGO RELACIONADO CON LA CONTRASEÑA DEL SITIO (A ELIMINAR/COMENTAR) ---
// // Site password protection - require environment variable
// const SITE_PASSWORD = process.env.WEBSITE_PASSWORD;
// if (!SITE_PASSWORD) {
//   console.error("FATAL: WEBSITE_PASSWORD environment variable is required for site protection");
//   // process.exit(1); // Descomentar en producción
// }
// --- FIN DE CÓDIGO RELACIONADO CON LA CONTRASEÑA DEL SITIO ---

// Función para configurar la sesión de Express
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

  let sessionStore: any = undefined;

  if (process.env.DATABASE_URL && connectPg) {
    try {
      const pgStore = connectPg(session);
      sessionStore = new pgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: false, // Asegúrate de que tu tabla de sesiones exista o se cree por migración
        ttl: sessionTtl,
        tableName: "sessions",
      });
      console.log("Using PostgreSQL session store");
    } catch (error) {
      console.log("Failed to setup PostgreSQL session store, using memory store:", (error as Error).message);
    }
  } else {
    console.log("Using memory session store (not recommended for production)");
  }

  return session({
    secret: process.env.SESSION_SECRET || 'demo-secret-' + Math.random().toString(36).substring(7),
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

// --- INICIO DE CÓDIGO RELACIONADO CON LA CONTRASEÑA DEL SITIO (A ELIMINAR/COMENTAR) ---
// // Middleware para verificar el acceso al sitio (si tienes una contraseña general)
// export const checkSiteAccess: RequestHandler = (req, res, next) => {
//   const session = req.session as any;
//   if (session.siteAccess) {
//     return next();
//   }
//   return res.status(401).json({ message: "Site access required" });
// };
// --- FIN DE CÓDIGO RELACIONADO CON LA CONTRASEÑA DEL SITIO ---

// Configuración principal de autenticación
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

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
      console.error("Passport deserializeUser: Error during deserialization for ID:", id, error);
      done(error, null);
    }
  });

  // --- FUNCIÓN CENTRALIZADA PARA VERIFICAR TOKEN DE FIREBASE Y ESTABLECER SESIÓN ---
  // Esta función es un middleware que se puede usar en múltiples rutas
  const verifyFirebaseTokenAndLogin = async (req: Request, res: Response) => {
    const { idToken } = req.body;

    if (!idToken) {
      console.error("verifyFirebaseTokenAndLogin: ID Token is missing in request body.");
      return res.status(400).json({ message: "ID Token is required" });
    }

    try {
      // 1. Verificar el ID Token con Firebase Admin SDK
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const firebaseUid = decodedToken.uid;
      const email = decodedToken.email || null;
      // Los campos 'name' y 'picture' pueden no estar siempre presentes o ser completos
      const firstName = decodedToken.name?.split(' ')[0] || null;
      const lastName = decodedToken.name?.split(' ').slice(1).join(' ') || null;
      const profileImageUrl = decodedToken.picture || null;

      console.log(`verifyFirebaseTokenAndLogin: Verifying Firebase Token for UID: ${firebaseUid}, Email: ${email}`);

      // 2. Intentar encontrar al usuario en tu base de datos
      let user = await storage.getUserByFirebaseUid(firebaseUid);

      if (!user) {
        console.log(`verifyFirebaseTokenAndLogin: User with firebaseUid ${firebaseUid} not found. Checking by email.`);
        // Si no se encuentra por firebaseUid, intentar encontrarlo por email (para vincular cuentas)
        if (email) {
          user = await storage.getUserByEmail(email);
          if (user) {
            console.log(`verifyFirebaseTokenAndLogin: User with email ${email} found. Linking Firebase UID.`);
            // Si se encuentra por email, actualizarlo para vincular el firebaseUid
            // También actualizamos otros campos que Firebase pueda proporcionar
            const updates: any = { firebaseUid: firebaseUid };
            if (profileImageUrl) updates.profileImageUrl = profileImageUrl;
            if (firstName && !user.firstName) updates.firstName = firstName; // Solo si no tiene ya un nombre
            if (lastName && !user.lastName) updates.lastName = lastName; // Solo si no tiene ya un apellido

                // --- AÑADE ESTOS CONSOLE.LOGS AQUÍ ---
                console.log("DEBUG: Tipo de 'storage':", typeof storage);
                console.log("DEBUG: Objeto 'storage':", storage);
                console.log("DEBUG: ¿'storage' tiene el método 'updateUser'?", typeof (storage as any).updateUser);
                // --- FIN CONSOLE.LOGS ---

                await storage.updateUser(user.id, updates); // Esta es la línea que falla
                user = { ...user, ...updates};
          }
        }
      }

      if (!user) {
        console.log(`verifyFirebaseTokenAndLogin: User not found by firebaseUid or email. Creating new user for ${email || firebaseUid}.`);
        // Si aún no se encuentra, crear un nuevo usuario
        user = await storage.createUser({
          id: firebaseUid, // Usar firebaseUid como ID de la base de datos si es un nuevo usuario de Firebase
          firebaseUid: firebaseUid,
          email: email,
          firstName: firstName,
          lastName: lastName,
          profileImageUrl: profileImageUrl,
          // password: null, // El campo password ya es nullable en el esquema
          // Asegúrate de que otros campos requeridos por tu esquema tengan valores predeterminados
          // o se proporcionen aquí (ej. role, hierarchyLevel, canApprove)
          // role: "agency_owner", // Ejemplo
        });
        console.log(`verifyFirebaseTokenAndLogin: New user created with ID: ${user.id}, Firebase UID: ${user.firebaseUid}`);
      } else {
          console.log(`verifyFirebaseTokenAndLogin: User found/updated: ID ${user.id}, Firebase UID: ${user.firebaseUid}`);
          // Si el usuario ya existía (encontrado por firebaseUid o actualizado por email),
          // podemos asegurarnos de que la información de perfil esté actualizada.
          const updates: any = {};
          if (email && user.email !== email) updates.email = email;
          if (profileImageUrl && user.profileImageUrl !== profileImageUrl) updates.profileImageUrl = profileImageUrl;
          if (firstName && user.firstName !== firstName) updates.firstName = firstName;
          if (lastName && user.lastName !== lastName) updates.lastName = lastName;
        console.log("DEBUG (Existing User): Tipo de 'storage':", typeof storage);
        console.log("DEBUG (Existing User): Objeto 'storage':", storage);
        console.log("DEBUG (Existing User): ¿'storage' tiene el método 'updateUser'?", typeof (storage as any).updateUser);
          if (Object.keys(updates).length > 0) {
              await storage.updateUser(user.id, updates);
              user = { ...user, ...updates }; // Actualiza el objeto user en memoria
          }
      }

      // Validar que el objeto user sea válido antes de pasarlo a Passport
      // Esto previene el error "Cannot read properties of undefined (reading 'id')" en serializeUser
      if (!user || !user.id) {
        console.error("verifyFirebaseTokenAndLogin: User object is invalid or missing ID after storage operations:", user);
        return res.status(500).json({ message: "Failed to retrieve or create user in database." });
      }

      // 4. Establecer la sesión en Express usando Passport
      req.login(user, (err) => {
        if (err) {
          console.error("verifyFirebaseTokenAndLogin: Error during Passport login after Firebase auth:", err);
          return res.status(500).json({ message: "Failed to establish session" });
        }
        const { password: _, ...userWithoutPassword } = user; // Excluir la contraseña antes de enviar al frontend
        res.status(200).json({ user: userWithoutPassword });
      });

    } catch (error) {
      console.error("verifyFirebaseTokenAndLogin: Firebase ID Token verification failed:", error);
      res.status(401).json({ message: "Unauthorized: Invalid or expired ID Token" });
    }
  };
  // --- FIN FUNCIÓN CENTRALIZADA ---

  // --- RUTAS DE AUTENTICACIÓN ---
  // Ambas rutas (signup y login) ahora usan la función centralizada
  app.post("/api/signup", verifyFirebaseTokenAndLogin);
  app.post("/api/login", verifyFirebaseTokenAndLogin);

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
  app.get('/api/auth/user', (req, res) => {
    if (req.isAuthenticated() && req.user) {
      const user = req.user as any;
      const { password: _, ...userWithoutPassword } = user; // Asegúrate de que la contraseña no se envíe
      res.json({ user: userWithoutPassword });
    } else {
      res.status(401).json({ user: null });
    }
  });
} // FIN DE setupAuth

// --- MIDDLEWARE DE PROTECCIÓN DE SITIO Y AUTENTICACIÓN ---
// ESTOS MIDDLEWARES DEBEN ESTAR FUERA DE `setupAuth` PARA SER EXPORTADOS CORRECTAMENTE

// --- INICIO DE CÓDIGO RELACIONADO CON LA CONTRASEÑA DEL SITIO (A ELIMINAR/COMENTAR) ---
// // Middleware de protección de contraseña para todo el sitio
// export const requireSitePassword: RequestHandler = (req, res, next) => {
//   const session = req.session as any;

//   // Si la ruta es para autenticar la contraseña del sitio, permite el paso
//   if (req.path === '/api/site-auth') {
//     return next();
//   }

//   // Si el usuario ya ha introducido la contraseña correcta del sitio
//   if (session && session.siteAccess) {
//     return next();
//   }

//   // Si no, muestra la página de protección de contraseña
//   const passwordPage = `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//       <meta charset="UTF-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <title>LeadBoost - Access Required</title>
//       <style>
//         @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

//         * {
//           margin: 0;
//           padding: 0;
//           box-sizing: border-box;
//         }

//         body {
//           font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
//           background: #F8F8FA;
//           min-height: 100vh;
//           min-height: -webkit-fill-available;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           margin: 0;
//           padding: 16px;
//           overflow: hidden;
//           position: relative;
//         }

//         /* Tech pattern background */
//         body::before {
//           content: '';
//           position: absolute;
//           top: 0;
//           left: 0;
//           width: 100%;
//           height: 100%;
//           background-image: radial-gradient(circle at 25px 25px, #3b82f6 1px, transparent 1px);
//           background-size: 50px 50px;
//           opacity: 0.05;
//         }

//         /* Floating particles */
//         .particles {
//           position: absolute;
//           width: 100%;
//           height: 100%;
//           pointer-events: none;
//         }

//         .particle {
//           position: absolute;
//           width: 2px;
//           height: 2px;
//           background: linear-gradient(45deg, #3b82f6, #8b5cf6);
//           border-radius: 50%;
//           animation: float 6s ease-in-out infinite;
//         }
//         @keyframes float {
//           0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
//           50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
//         }

//         .container {
//           background: rgba(248, 248, 250, 0.95);
//           backdrop-filter: blur(20px);
//           border: 1px solid rgba(59, 130, 246, 0.1);
//           padding: 3rem 2.5rem;
//           border-radius: 24px;
//           box-shadow:
//             0 0 0 1px rgba(255, 255, 255, 0.1),
//             0 16px 32px rgba(0, 0, 0, 0.05),
//             inset 0 1px 0 rgba(255, 255, 255, 0.2);
//           width: 100%;
//           max-width: 450px;
//           text-align: center;
//           margin: 0 auto;
//           position: relative;
//           z-index: 10;
//         }

//         /* Floating social media cards */
//         .social-cards {
//           position: absolute;
//           width: 100%;
//           height: 100%;
//           pointer-events: none;
//           opacity: 0.04;
//           z-index: 1;
//         }

//         .social-card {
//           position: absolute;
//           border-radius: 12px;
//           box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           animation: floatCard 8s ease-in-out infinite;
//         }

//         .instagram { background: linear-gradient(135deg, #e91e63, #9c27b0); width: 80px; height: 80px; }
//         .linkedin { background: linear-gradient(135deg, #1976d2, #1565c0); width: 100px; height: 50px; }
//         .tiktok { background: linear-gradient(135deg, #000000, #424242); width: 50px; height: 90px; }
//         .facebook { background: linear-gradient(135deg, #1976d2, #1565c0); width: 100px; height: 50px; }
//         .twitter { background: linear-gradient(135deg, #000000, #424242); width: 90px; height: 50px; }
//         .youtube { background: linear-gradient(135deg, #d32f2f, #c62828); width: 110px; height: 60px; }

//         @keyframes floatCard {
//           0%, 100% { transform: translateY(0) rotate(0deg); }
//           50% { transform: translateY(-20px) rotate(2deg); }
//         }

//         @media (max-width: 480px) {
//           .container {
//             padding: 2rem 1.5rem;
//             margin: 0;
//             border-radius: 20px;
//           }
//         }
//         .logo {
//           margin-bottom: 0.5rem;
//           display: flex;
//           justify-content: center;
//           align-items: center;
//           gap: 8px;
//         }

//         .logo-text {
//           font-size: 2.5rem;
//           font-weight: 700;
//           background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
//           background-size: 200% 200%;
//           -webkit-background-clip: text;
//           -webkit-text-fill-color: transparent;
//           background-clip: text;
//           animation: textShine 3s ease-in-out infinite;
//           letter-spacing: -0.02em;
//         }

//         .logo-arrows {
//           font-size: 2.5rem;
//           font-weight: 700;
//           background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
//           background-size: 200% 200%;
//           -webkit-background-clip: text;
//           -webkit-text-fill-color: transparent;
//           background-clip: text;
//           animation: textShine 3s ease-in-out infinite;
//           letter-spacing: -0.02em;
//         }

//         @keyframes textShine {
//           0%, 100% { background-position: 0% 50%; }
//           50% { background-position: 100% 50%; }
//         }

//         .logo-subtitle {
//           color: #6b7280;
//           font-size: 0.875rem;
//           font-weight: 500;
//           margin-bottom: 2rem;
//           opacity: 0.8;
//         }

//         .access-title {
//           font-size: 1.5rem;
//           font-weight: 600;
//           background: linear-gradient(135deg, #1f2937 0%, #374151 50%, #4b5563 100%);
//           background-size: 200% 200%;
//           -webkit-background-clip: text;
//           -webkit-text-fill-color: transparent;
//           background-clip: text;
//           margin-bottom: 0.5rem;
//           animation: textShine 3s ease-in-out infinite;
//           letter-spacing: -0.02em;
//         }

//         .access-subtitle {
//           color: #6b7280;
//           font-size: 0.95rem;
//           margin-bottom: 2rem;
//           font-weight: 400;
//         }
//         input {
//           width: 100%;
//           padding: 16px 20px;
//           background: rgba(255, 255, 255, 0.8);
//           border: 1px solid rgba(59, 130, 246, 0.2);
//           border-radius: 12px;
//           font-size: 16px;
//           color: #1f2937;
//           margin-bottom: 1.5rem;
//           box-sizing: border-box;
//           -webkit-appearance: none;
//           font-family: 'Inter', sans-serif;
//           font-weight: 500;
//           transition: all 0.3s ease;
//           backdrop-filter: blur(10px);
//         }

//         input::placeholder {
//           color: #64748b;
//           font-weight: 400;
//         }

//         input:focus {
//           outline: none;
//           border-color: #3b82f6;
//           box-shadow:
//             0 0 0 3px rgba(59, 130, 246, 0.1),
//             0 0 20px rgba(59, 130, 246, 0.2);
//           background: rgba(15, 23, 42, 0.8);
//         }

//         @media (max-width: 480px) {
//           input {
//             font-size: 16px;
//             padding: 14px 16px;
//           }
//         }
//         input:focus {
//           outline: none;
//           border-color: #667eea;
//         }
//         button {
//           width: 100%;
//           padding: 16px 12px;
//           background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
//           color: white;
//           border: none;
//           border-radius: 12px;
//           font-size: 16px;
//           font-weight: 600;
//           cursor: pointer;
//           transition: all 0.3s ease;
//           -webkit-appearance: none;
//           touch-action: manipulation;
//           position: relative;
//           overflow: hidden;
//           font-family: 'Inter', sans-serif;
//           box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
//           letter-spacing: 0.025em;
//         }

//         button:hover {
//           transform: translateY(-2px);
//           box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
//         }

//         button:active {
//           transform: translateY(0);
//         }

//         button::before {
//           content: '';
//           position: absolute;
//           top: 0;
//           left: -100%;
//           width: 100%;
//           height: 100%;
//           background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
//           transition: left 0.5s;
//         }

//         button:hover::before {
//           left: 100%;
//         }

//         @media (max-width: 480px) {
//           button {
//             padding: 14px 12px;
//             font-size: 16px;
//           }
//         }
//         .error {
//           color: #f87171;
//           background: rgba(239, 68, 68, 0.1);
//           border: 1px solid rgba(239, 68, 68, 0.3);
//           padding: 12px 16px;
//           border-radius: 8px;
//           margin-top: 1rem;
//           display: none;
//           font-size: 0.875rem;
//           font-weight: 500;
//         }
//       </style>
//     </head>
//     <body>
//       <!-- Floating Social Media Cards -->
//       <div class="social-cards">
//         <div class="social-card instagram" style="left: 8%; top: 20%; animation-delay: 0s;"></div>
//         <div class="social-card tiktok" style="right: 12%; top: 25%; animation-delay: 1s;"></div>
//         <div class="social-card linkedin" style="left: 6%; top: 65%; animation-delay: 2s;"></div>
//         <div class="social-card facebook" style="right: 10%; top: 70%; animation-delay: 0.5s;"></div>
//         <div class="social-card twitter" style="left: 15%; top: 40%; animation-delay: 3s;"></div>
//         <div class="social-card youtube" style="right: 22%; top: 50%; animation-delay: 2.5s;"></div>
//       </div>

//       <div class="particles"></div>
//       <div class="container">
//         <div class="logo">
//           <div class="logo-text">Lead</div>
//           <div class="logo-arrows">››</div>
//           <div class="logo-text">Boost</div>
//         </div>
//         <div class="logo-subtitle">AI-Powered Marketing</div>
//         <div class="access-title">Access Required</div>
//         <div class="access-subtitle">Enter site password to continue</div>
//         <form id="passwordForm">
//           <input type="password" id="password" placeholder="Enter password" required>
//           <button type="submit">Access Site</button>
//         </form>
//         <div id="error" class="error">Invalid password. Please try again.</div>
//       </div>

//       <script>
//         // Create floating particles
//         function createParticles() {
//           const particlesContainer = document.querySelector('.particles');
//           const particleCount = 15;

//           for (let i = 0; i < particleCount; i++) {
//             const particle = document.createElement('div');
//             particle.className = 'particle';
//             particle.style.left = Math.random() * 100 + '%';
//             particle.style.top = Math.random() * 100 + '%';
//             particle.style.animationDelay = Math.random() * 6 + 's';
//             particle.style.animationDuration = (3 + Math.random() * 3) + 's';
//             particlesContainer.appendChild(particle);
//           }
//         }

//         // Initialize particles on load
//         createParticles();

//         // Add typing effect to subtitle
//         function typeEffect(element, text, speed = 100) {
//           let i = 0;
//           element.textContent = '';
//           const timer = setInterval(() => {
//             if (i < text.length) {
//               element.textContent += text.charAt(i);
//               i++;
//             } else {
//               clearInterval(timer);
//             }
//           }, speed);
//         }

//         // Start typing effect after page load
//         setTimeout(() => {
//           const subtitle = document.querySelector('.access-subtitle');
//           typeEffect(subtitle, 'Enter site password to continue', 80);
//         }, 500);

//         document.getElementById('passwordForm').addEventListener('submit', async (e) => {
//           e.preventDefault();
//           const password = document.getElementById('password').value;
//           const button = e.target.querySelector('button');
//           const originalText = button.textContent;

//           // Add loading state
//           button.textContent = 'Authenticating...';
//           button.disabled = true;

//           try {
//             const response = await fetch('/api/site-auth', {
//               method: 'POST',
//               headers: {
//                 'Content-Type': 'application/json',
//               },
//               body: JSON.stringify({ password }),
//             });

//             const result = await response.json();

//             if (result.success) {
//               button.textContent = 'Access Granted ✓';
//               button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
//               setTimeout(() => window.location.href = window.location.href, 800);
//             } else {
//               document.getElementById('error').style.display = 'block';
//               button.textContent = originalText;
//               button.disabled = false;

//               // Add shake animation
//               const container = document.querySelector('.container');
//               container.style.animation = 'shake 0.5s ease-in-out';
//               setTimeout(() => {
//                 container.style.animation = 'containerGlow 3s ease-in-out infinite';
//               }, 500);
//             }
//           } catch (error) {
//             document.getElementById('error').style.display = 'block';
//             button.textContent = originalText;
//             button.disabled = false;
//           }
//         });

//         // Add shake animation keyframes
//         const shakeStyle = document.createElement('style');
//         shakeStyle.textContent = '@keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); } 20%, 40%, 60%, 80% { transform: translateX(5px); } }';
//         document.head.appendChild(shakeStyle);
//       </script>
//     </body>
//     </html>
//   `;

//   res.send(passwordPage);
// };
// --- FIN DE CÓDIGO RELACIONADO CON LA CONTRASEÑA DEL SITIO ---

// Middleware para verificar si el usuario está autenticado
// ESTA DECLARACIÓN DEBE ESTAR FUERA DE `setupAuth`
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// Extender el tipo Request de Express para incluir user e isAuthenticated de Passport
// Esto asegura que TypeScript reconozca las propiedades añadidas por Passport
declare global {
  namespace Express {
    interface Request {
      user?: any; // Define la propiedad user (Passport la añade)
      isAuthenticated(): boolean; // Define el método isAuthenticated (Passport lo añade)
      login(user: any, done: (err: any) => void): void; // Define el método login (Passport lo añade)
      logout(done: (err: any) => void): void; // Define el método logout (Passport lo añade)
    }
  }
}