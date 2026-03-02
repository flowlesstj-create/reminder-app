import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { User, initDatabase } from "@/lib/db";
import { normalizeEmail } from "@/lib/validation";

export const runtime = "nodejs";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {

    const body = (await request.json()) as LoginBody;
    const email = normalizeEmail(
      typeof body.email === "string" ? body.email : "",
    );
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const { token, expiresAt } = await createSession(user.id);

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

    setSessionCookie(response, token, expiresAt);
    return response;
  } catch (error) {
    // Do not log sensitive error details in production
    return NextResponse.json(
      { error: "Unable to login right now." },
      { status: 500 },
    );
  }
}
