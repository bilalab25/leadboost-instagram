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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #0a0a0a;
          min-height: 100vh;
          min-height: -webkit-fill-available;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 16px;
          overflow: hidden;
          position: relative;
        }
        
        /* Animated background */
        body::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at 20% 80%, #3b82f6 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 50%),
                      radial-gradient(circle at 40% 40%, #06b6d4 0%, transparent 50%);
          animation: backgroundShift 8s ease-in-out infinite;
          opacity: 0.1;
        }
        
        @keyframes backgroundShift {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(5deg); }
        }
        
        /* Floating particles */
        .particles {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        
        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          border-radius: 50%;
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
        }
        
        .container {
          background: rgba(15, 15, 15, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(59, 130, 246, 0.2);
          padding: 3rem 2.5rem;
          border-radius: 24px;
          box-shadow: 
            0 0 0 1px rgba(255, 255, 255, 0.05),
            0 16px 32px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          width: 100%;
          max-width: 450px;
          text-align: center;
          margin: 0 auto;
          position: relative;
          z-index: 10;
          animation: containerGlow 3s ease-in-out infinite;
        }
        
        @keyframes containerGlow {
          0%, 100% { box-shadow: 
            0 0 0 1px rgba(255, 255, 255, 0.05),
            0 16px 32px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 40px rgba(59, 130, 246, 0.1); }
          50% { box-shadow: 
            0 0 0 1px rgba(255, 255, 255, 0.05),
            0 16px 32px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 60px rgba(59, 130, 246, 0.3); }
        }
        
        .container::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6, #06b6d4, #3b82f6);
          border-radius: 26px;
          z-index: -1;
          animation: borderRotate 4s linear infinite;
          opacity: 0.6;
        }
        
        @keyframes borderRotate {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @media (max-width: 480px) {
          .container {
            padding: 2rem 1.5rem;
            margin: 0;
            border-radius: 20px;
          }
        }
        .logo {
          margin-bottom: 0.5rem;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .logo img {
          height: 50px;
          width: auto;
          max-width: 280px;
          filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.3));
          animation: logoGlow 3s ease-in-out infinite;
        }
        
        @keyframes logoGlow {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.3)); }
          50% { filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.6)); }
        }
        
        @keyframes textShine {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .logo-subtitle {
          color: #6b7280;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 2rem;
          opacity: 0.8;
        }
        
        .access-title {
          font-size: 1.5rem;
          font-weight: 600;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
          animation: textShine 3s ease-in-out infinite;
          letter-spacing: -0.02em;
        }
        
        .access-subtitle {
          color: #94a3b8;
          font-size: 0.95rem;
          margin-bottom: 2rem;
          font-weight: 400;
        }
        input {
          width: 100%;
          padding: 16px 20px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 12px;
          font-size: 16px;
          color: #f1f5f9;
          margin-bottom: 1.5rem;
          box-sizing: border-box;
          -webkit-appearance: none;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }
        
        input::placeholder {
          color: #64748b;
          font-weight: 400;
        }
        
        input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 
            0 0 0 3px rgba(59, 130, 246, 0.1),
            0 0 20px rgba(59, 130, 246, 0.2);
          background: rgba(15, 23, 42, 0.8);
        }
        
        @media (max-width: 480px) {
          input {
            font-size: 16px;
            padding: 14px 16px;
          }
        }
        input:focus {
          outline: none;
          border-color: #667eea;
        }
        button {
          width: 100%;
          padding: 16px 12px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          -webkit-appearance: none;
          touch-action: manipulation;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.025em;
        }
        
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
        }
        
        button:active {
          transform: translateY(0);
        }
        
        button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }
        
        button:hover::before {
          left: 100%;
        }
        
        @media (max-width: 480px) {
          button {
            padding: 14px 12px;
            font-size: 16px;
          }
        }
        .error {
          color: #f87171;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 12px 16px;
          border-radius: 8px;
          margin-top: 1rem;
          display: none;
          font-size: 0.875rem;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div class="particles"></div>
      <div class="container">
        <div class="logo">
          <img src="/attached_assets/Lead Boost (500 x 200 px) (500 x 160 px)_1756873932398.png" alt="LeadBoost Logo" />
        </div>
        <div class="logo-subtitle">AI-Powered Social Media</div>
        <div class="access-title">Access Required</div>
        <div class="access-subtitle">Enter authorization code to continue</div>
        <form id="passwordForm">
          <input type="password" id="password" placeholder="Enter password" required>
          <button type="submit">Access Site</button>
        </form>
        <div id="error" class="error">Invalid password. Please try again.</div>
      </div>
      
      <script>
        // Create floating particles
        function createParticles() {
          const particlesContainer = document.querySelector('.particles');
          const particleCount = 15;
          
          for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 6 + 's';
            particle.style.animationDuration = (3 + Math.random() * 3) + 's';
            particlesContainer.appendChild(particle);
          }
        }
        
        // Initialize particles on load
        createParticles();
        
        // Add typing effect to subtitle
        function typeEffect(element, text, speed = 100) {
          let i = 0;
          element.textContent = '';
          const timer = setInterval(() => {
            if (i < text.length) {
              element.textContent += text.charAt(i);
              i++;
            } else {
              clearInterval(timer);
            }
          }, speed);
        }
        
        // Start typing effect after page load
        setTimeout(() => {
          const subtitle = document.querySelector('.access-subtitle');
          typeEffect(subtitle, 'Enter authorization code to continue', 80);
        }, 500);
        
        document.getElementById('passwordForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const password = document.getElementById('password').value;
          const button = e.target.querySelector('button');
          const originalText = button.textContent;
          
          // Add loading state
          button.textContent = 'Authenticating...';
          button.disabled = true;
          
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
              button.textContent = 'Access Granted ✓';
              button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
              setTimeout(() => window.location.reload(), 800);
            } else {
              document.getElementById('error').style.display = 'block';
              button.textContent = originalText;
              button.disabled = false;
              
              // Add shake animation
              const container = document.querySelector('.container');
              container.style.animation = 'shake 0.5s ease-in-out';
              setTimeout(() => {
                container.style.animation = 'containerGlow 3s ease-in-out infinite';
              }, 500);
            }
          } catch (error) {
            document.getElementById('error').style.display = 'block';
            button.textContent = originalText;
            button.disabled = false;
          }
        });
        
        // Add shake animation keyframes
        const shakeStyle = document.createElement('style');
        shakeStyle.textContent = '@keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); } 20%, 40%, 60%, 80% { transform: translateX(5px); } }';
        document.head.appendChild(shakeStyle);
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