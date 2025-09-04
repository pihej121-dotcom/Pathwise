import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import type { User } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface AuthRequest extends Request {
  user?: User;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(userId: string): Promise<string> {
  // Delete existing sessions for this user (single session per user)
  await storage.deleteUserSessions(userId);
  
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  
  await storage.createSession(userId, token, expiresAt);
  return token;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "") || 
                  req.cookies?.auth_token;

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const session = await storage.getSession(token);
    if (!session) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    req.user = session.user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export async function logout(token: string): Promise<void> {
  await storage.deleteSession(token);
}
