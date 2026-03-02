import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";
import { User, initDatabase } from "@/lib/db";
import { normalizeEmail } from "@/lib/validation";

export const runtime = "nodejs";

type SignupBody = {
  name?: string;
  email?: string;
  password?: string;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {

    const body = (await request.json()) as SignupBody;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = normalizeEmail(
      typeof body.email === "string" ? body.email : "",
    );
    const password = typeof body.password === "string" ? body.password : "";

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: "Name must be between 2 and 100 characters." },
        { status: 400 },
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid email." },
        { status: 400 },
      );
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { error: "Password must be between 8 and 128 characters." },
        { status: 400 },
      );
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      // Use generic error message to prevent user enumeration attacks
      return NextResponse.json(
        { error: "Unable to create account right now." },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name,
      email,
      passwordHash,
    });

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
    console.error("Signup failed", error);
    return NextResponse.json(
      { error: "Unable to create account right now." },
      { status: 500 },
    );
  }
}
