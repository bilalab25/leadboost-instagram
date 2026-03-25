import { Request, Response, NextFunction, RequestHandler } from "express";
import { storage } from "./storage";
import { SelectBrandMembership } from "@shared/schema";

// --- RATE LIMITING ---
// Simple in-memory rate limiter (no extra dependencies)
// For production with multiple instances, replace with Redis-backed solution

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  rateLimitStore.forEach((entry, key) => {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  });
}, 5 * 60 * 1000);

/**
 * Rate limit middleware factory.
 * @param maxAttempts - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function rateLimit(maxAttempts: number, windowMs: number): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetAt) {
      // New window
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxAttempts) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfterSec));
      return res.status(429).json({
        message: "Too many attempts. Please try again later.",
        retryAfterSeconds: retryAfterSec,
      });
    }

    entry.count++;
    return next();
  };
}

// Pre-configured rate limiters
export const authRateLimit = rateLimit(10, 15 * 60 * 1000); // 10 attempts per 15 minutes
export const signupRateLimit = rateLimit(5, 60 * 60 * 1000); // 5 signups per hour per IP

// Define permission levels (higher number = more permissions)
const ROLE_PERMISSIONS = {
  viewer: 1,
  editor: 2,
  admin: 3,
  owner: 4,
} as const;

type Role = keyof typeof ROLE_PERMISSIONS;

// Extend Express Request to include brand membership
declare global {
  namespace Express {
    interface Request {
      brandMembership?: SelectBrandMembership;
      brandId?: string;
    }
  }
}

/**
 * Middleware to validate that the authenticated user has access to a specific brand.
 * Extracts brandId from req.params, req.query, or req.body and verifies membership.
 * Attaches the membership object to req.brandMembership for downstream use.
 *
 * Usage:
 * app.get('/api/brands/:brandId/data', isAuthenticated, requireBrand, handler)
 * app.post('/api/campaigns', isAuthenticated, requireBrand, handler) // brandId in body
 *
 * @returns 401 if not authenticated
 * @returns 400 if brandId is missing
 * @returns 403 if user doesn't have access or membership is inactive
 */
export const requireBrand = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user as any;
    if (!user || !user.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Extract brandId from params, query, or body
    const brandId =
      (req.params as any).brandId ||
      (req.query as any).brandId ||
      (req.body as any).brandId;

    if (!brandId) {
      return res.status(400).json({ error: "Brand ID is required" });
    }

    // Get all user's memberships and find the one for this brand
    const memberships = await storage.getBrandMemberships(user.id as string);
    const membership = memberships.find((m) => m.brandId === brandId);

    if (!membership) {
      return res
        .status(403)
        .json({ error: "You do not have access to this brand" });
    }

    // Check if membership is active
    if (membership.status !== "active") {
      return res
        .status(403)
        .json({ error: "Your brand membership is not active" });
    }

    // Attach membership and brandId to request for downstream use
    req.brandMembership = membership;
    (req as any).brandId = brandId;

    next();
  } catch (error) {
    console.error("Error in requireBrand middleware:", error);
    return res.status(500).json({ error: "Failed to validate brand access" });
  }
};

export const requireRole =
  (minimumRole: Role) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const membership = req.brandMembership;

      if (!membership) {
        return res.status(403).json({
          error:
            "Brand membership not found. Use requireBrand middleware first.",
        });
      }

      const userRole = membership.role as Role;
      const userPermissionLevel = ROLE_PERMISSIONS[userRole] || 0;
      const requiredPermissionLevel = ROLE_PERMISSIONS[minimumRole];

      if (userPermissionLevel < requiredPermissionLevel) {
        return res.status(403).json({
          error: `Insufficient permissions. Required role: ${minimumRole}, your role: ${userRole}`,
        });
      }

      next();
    } catch (error) {
      console.error("Error in requireRole middleware:", error);
      return res.status(500).json({ error: "Failed to validate role" });
    }
  };

export const requireOwner = requireRole("owner");
export const requireAdmin = requireRole("admin");
export const requireEditor = requireRole("editor");
