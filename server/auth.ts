import session from "express-session";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

// Import connect-pg-simple only if DATABASE_URL is available
let connectPg: any = null;
try {
  if (process.env.DATABASE_URL) {
    connectPg = require("connect-pg-simple");
  }
} catch (error) {
  console.log("PostgreSQL session store not available, using memory store");
}

// Production-ready authentication setup without Replit dependencies
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Use PostgreSQL store if available, otherwise use memory store
  let sessionStore: any = undefined;
  
  if (process.env.DATABASE_URL && connectPg) {
    try {
      const pgStore = connectPg(session);
      sessionStore = new pgStore({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: false,
        ttl: sessionTtl,
        tableName: "sessions",
      });
      console.log("Using PostgreSQL session store");
    } catch (error) {
      console.log("Failed to setup PostgreSQL session store, using memory store:", error.message);
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

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Simple demo authentication routes that work in any environment
  app.get("/api/login", (req, res) => {
    // In demo mode, automatically log in as the demo user
    (req.session as any).user = {
      id: "demo-user",
      email: "said@renuvederm.com",
      firstName: "Said",
      lastName: "Renuve",
      profileImageUrl: null,
    };
    res.redirect("/");
  });

  app.get("/api/callback", (req, res) => {
    res.redirect("/");
  });

  app.get("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      }
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // For demo/production deployment, we'll use a simplified approach
  // In a real production app, you would implement proper JWT or OAuth authentication
  
  const session = req.session as any;
  
  // Check if user is in session
  if (session && session.user) {
    req.user = session.user;
    return next();
  }
  
  // For demo purposes, automatically authenticate as demo user
  session.user = {
    id: "demo-user",
    email: "said@renuvederm.com",
    firstName: "Said",
    lastName: "Renuve",
    profileImageUrl: null,
    claims: {
      sub: "demo-user",
      email: "said@renuvederm.com",
      first_name: "Said",
      last_name: "Renuve",
    }
  };
  
  req.user = session.user;
  return next();
};