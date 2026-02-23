import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  deleteSessionByToken,
  getSessionToken,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(): Promise<NextResponse> {
  const token = await getSessionToken();
  if (token) {
    await deleteSessionByToken(token);
  }

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
