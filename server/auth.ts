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

  // Password protection for the entire site
  const SITE_PASSWORD = "Leadboost198$";

  // Password check endpoint
  app.post("/api/site-auth", (req, res) => {
    const { password } = req.body;
    
    if (password === SITE_PASSWORD) {
      (req.session as any).siteAccess = true;
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid password" });
    }
  });

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

// Site-wide password protection middleware
export const requireSitePassword: RequestHandler = (req, res, next) => {
  const session = req.session as any;
  
  // Check if this is the password auth endpoint
  if (req.path === '/api/site-auth') {
    return next();
  }
  
  // Check if user has already entered the correct password
  if (session && session.siteAccess) {
    return next();
  }
  
  // Serve password protection page for all other requests
  const passwordPage = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LeadBoost - Access Required</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          min-height: -webkit-fill-available;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 16px;
          box-sizing: border-box;
        }
        .container {
          background: white;
          padding: 2rem;
          border-radius: 10px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          width: 100%;
          max-width: 400px;
          text-align: center;
          margin: 0 auto;
        }
        @media (max-width: 480px) {
          .container {
            padding: 1.5rem;
            margin: 0;
            border-radius: 8px;
          }
        }
        .logo {
          font-size: 2rem;
          font-weight: bold;
          color: #667eea;
          margin-bottom: 1rem;
        }
        input {
          width: 100%;
          padding: 16px 12px;
          border: 2px solid #e1e5e9;
          border-radius: 6px;
          font-size: 16px;
          margin-bottom: 1rem;
          box-sizing: border-box;
          -webkit-appearance: none;
          -webkit-border-radius: 6px;
        }
        @media (max-width: 480px) {
          input {
            font-size: 16px;
            padding: 14px 12px;
          }
        }
        input:focus {
          outline: none;
          border-color: #667eea;
        }
        button {
          width: 100%;
          padding: 16px 12px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.2s;
          -webkit-appearance: none;
          touch-action: manipulation;
        }
        @media (max-width: 480px) {
          button {
            padding: 14px 12px;
            font-size: 16px;
          }
        }
        button:hover {
          background: #5a6fd8;
        }
        .error {
          color: #e74c3c;
          margin-top: 1rem;
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">LeadBoost</div>
        <h2>Access Required</h2>
        <p>Please enter the password to access this application.</p>
        <form id="passwordForm">
          <input type="password" id="password" placeholder="Enter password" required>
          <button type="submit">Access Site</button>
        </form>
        <div id="error" class="error">Invalid password. Please try again.</div>
      </div>
      
      <script>
        document.getElementById('passwordForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const password = document.getElementById('password').value;
          
          try {
            const response = await fetch('/api/site-auth', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ password }),
            });
            
            const result = await response.json();
            
            if (result.success) {
              window.location.reload();
            } else {
              document.getElementById('error').style.display = 'block';
            }
          } catch (error) {
            document.getElementById('error').style.display = 'block';
          }
        });
      </script>
    </body>
    </html>
  `;
  
  res.send(passwordPage);
};

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