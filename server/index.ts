import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { logStartup } from "./diagnostic";

// 🔍 --- DEBUG SETTINGS FOR LARGE LOGS ---
import util from "util";
import fs from "fs";

// Muestra objetos completos (sin truncar) en los logs
util.inspect.defaultOptions = {
  depth: null, // muestra todos los niveles
  maxArrayLength: null, // muestra todos los elementos
  breakLength: 120, // menos saltos de línea
  compact: false,
};

// 🧾 Sobrescribe console.log para guardar logs muy grandes en archivo también
const originalLog = console.log;
console.log = (...args) => {
  const text = args
    .map((a) =>
      typeof a === "object" ? util.inspect(a, { colors: false }) : String(a),
    )
    .join(" ");

  // Si el texto supera cierto tamaño, guarda en un archivo
  if (text.length > 2000) {
    const fileName = `logs_${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
    fs.writeFileSync(fileName, text);
    originalLog(`📄 Log guardado en archivo: ${fileName}`);
  } else {
    originalLog(...args);
  }
};

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      //if (logLine.length > 80) {
      //logLine = logLine.slice(0, 79) + "…";
      //}

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
      logStartup();
    },
  );
})();
