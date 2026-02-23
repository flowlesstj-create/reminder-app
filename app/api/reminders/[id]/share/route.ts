import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { Reminder, initDatabase } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseReminderId(value: string): number | null {
  const id = Number.parseInt(value, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  await initDatabase();

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idParam } = await params;
  const id = parseReminderId(idParam);
  if (!id) {
    return NextResponse.json({ error: "Invalid reminder id." }, { status: 400 });
  }

  const reminder = await Reminder.findOne({ where: { id, userId: user.id } });
  if (!reminder) {
    return NextResponse.json({ error: "Reminder not found." }, { status: 404 });
  }

  if (!reminder.sharedToken) {
    reminder.sharedToken = crypto.randomUUID();
    await reminder.save();
  }

  const sharePath = `/shared/${reminder.sharedToken}`;
  const shareUrl = `${request.nextUrl.origin}${sharePath}`;

  return NextResponse.json({
    shareToken: reminder.sharedToken,
    sharePath,
    shareUrl,
  });
}
