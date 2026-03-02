import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  deleteSessionByToken,
  getSessionToken,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(): Promise<NextResponse> {
  try {
    const token = await getSessionToken();
    if (token) {
      await deleteSessionByToken(token);
    }
  } catch (error) {
    console.error("Logout failed", error);
    return NextResponse.json(
      { error: "Unable to logout right now." },
      { status: 500 },
    );
  }

  const response = new NextResponse(null, { status: 204 });
  clearSessionCookie(response);
  return response;
}
