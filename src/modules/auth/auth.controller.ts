import { Request, Response, NextFunction } from "express";
import { loginSchema, refreshSchema, registerSchema } from "./auth.validators";
import { loginUser, refreshSession, registerUser, revokeTokensForUser } from "./auth.service";
import { HttpError } from "../../middleware/errorHandler";

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = registerSchema.parse(req.body);
    const result = await registerUser(parsed.email, parsed.password);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const result = await loginUser(parsed.email, parsed.password);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = refreshSchema.parse(req.body);
    const result = await refreshSession(parsed.refreshToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      throw new HttpError(400, "userId is required to logout");
    }
    await revokeTokensForUser(Number(userId));
    res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
};
