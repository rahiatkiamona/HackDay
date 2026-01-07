import bcrypt from "bcryptjs";
import { decode, sign, verify, Secret, SignOptions, JwtPayload as BaseJwtPayload } from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { HttpError } from "../../middleware/errorHandler";
import { randomUUID } from "crypto";

interface JwtPayload extends BaseJwtPayload {
  sub: string;
  jti: string;
}

const accessSecret: Secret = env.jwtAccessSecret;
const refreshSecret: Secret = env.jwtRefreshSecret;
const accessExpiresIn: SignOptions["expiresIn"] = env.jwtAccessExpiresIn as SignOptions["expiresIn"];
const refreshExpiresIn: SignOptions["expiresIn"] = env.jwtRefreshExpiresIn as SignOptions["expiresIn"];

const hashToken = async (token: string): Promise<string> => bcrypt.hash(token, 10);

const generateAccessToken = (userId: number, email: string): string => {
  return sign({ sub: String(userId), email }, accessSecret, {
    expiresIn: accessExpiresIn,
  });
};

const generateRefreshToken = async (userId: number): Promise<{ token: string; jti: string; expiresAt: Date }> => {
  const jti = randomUUID();
  const token = sign({ sub: String(userId), jti }, refreshSecret, {
    expiresIn: refreshExpiresIn,
  });

  // Decode expiresAt from token
  const decoded = decode(token) as { exp?: number } | null;
  const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return { token, jti, expiresAt };
};

const persistRefreshToken = async (userId: number, token: string, jti: string, expiresAt: Date) => {
  const tokenHash = await hashToken(token);
  await prisma.refreshToken.create({
    data: { userId, jti, tokenHash, expiresAt },
  });
};

export const registerUser = async (email: string, password: string) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError(409, "Email already in use");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { email, passwordHash } });

  const accessToken = generateAccessToken(user.id, user.email);
  const { token: refreshToken, jti, expiresAt } = await generateRefreshToken(user.id);
  await persistRefreshToken(user.id, refreshToken, jti, expiresAt);

  return {
    user: { id: user.id, email: user.email },
    tokens: { accessToken, refreshToken },
  };
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new HttpError(401, "Invalid credentials");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, "Invalid credentials");
  }

  const accessToken = generateAccessToken(user.id, user.email);
  const { token: refreshToken, jti, expiresAt } = await generateRefreshToken(user.id);
  await persistRefreshToken(user.id, refreshToken, jti, expiresAt);

  return {
    user: { id: user.id, email: user.email },
    tokens: { accessToken, refreshToken },
  };
};

export const refreshSession = async (refreshToken: string) => {
  let payload: JwtPayload;
  try {
    payload = verify(refreshToken, refreshSecret) as JwtPayload;
  } catch {
    throw new HttpError(401, "Invalid refresh token");
  }

  if (!payload?.sub || !payload?.jti) {
    throw new HttpError(401, "Invalid refresh token payload");
  }

  const tokenRecord = await prisma.refreshToken.findUnique({ where: { jti: payload.jti } });
  if (!tokenRecord || tokenRecord.revoked) {
    throw new HttpError(401, "Refresh token revoked or missing");
  }

  const stillValid = await bcrypt.compare(refreshToken, tokenRecord.tokenHash);
  if (!stillValid) {
    throw new HttpError(401, "Invalid refresh token");
  }

  if (tokenRecord.expiresAt < new Date()) {
    throw new HttpError(401, "Refresh token expired");
  }

  // rotate token
  await prisma.refreshToken.update({ where: { jti: payload.jti }, data: { revoked: true } });

  const userId = Number(payload.sub);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, "User not found");
  }

  const accessToken = generateAccessToken(user.id, user.email);
  const { token: newRefreshToken, jti, expiresAt } = await generateRefreshToken(user.id);
  await persistRefreshToken(user.id, newRefreshToken, jti, expiresAt);

  return {
    user: { id: user.id, email: user.email },
    tokens: { accessToken, refreshToken: newRefreshToken },
  };
};

export const revokeTokensForUser = async (userId: number) => {
  await prisma.refreshToken.updateMany({ where: { userId, revoked: false }, data: { revoked: true } });
};
