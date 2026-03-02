import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const user = await getCurrentUser() as User | null;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate that all required user properties exist before returning
  if (user.id == null || user.name == null || user.email == null) {
    console.error("User object missing required properties", { id: user.id, name: user.name, email: user.email });
    return NextResponse.json({ error: "Invalid user data" }, { status: 500 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
}
