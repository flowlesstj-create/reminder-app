import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Session, User, initDatabase } from "@/lib/db";

export const SESSION_COOKIE_NAME = "app_reminder_session";
const SESSION_DURATION_DAYS = 14;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(
  userId: number,
): Promise<{ token: string; expiresAt: Date }> {
  await initDatabase();

  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await Session.create({
    userId,
    token,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function deleteSessionByToken(token: string): Promise<void> {
  await initDatabase();
  await Session.destroy({ where: { token } });
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getCurrentUser(): Promise<User | null> {
  await initDatabase();

  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const session = await Session.findOne({ where: { token } });
  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await session.destroy();
    return null;
  }

  return User.findByPk(session.userId);
}

export function setSessionCookie(
  response: NextResponse,
  token: string,
  expiresAt: Date,
): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}
