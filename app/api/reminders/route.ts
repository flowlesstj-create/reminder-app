import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { Reminder, initDatabase } from "@/lib/db";
import { serializeReminder } from "@/lib/reminders";
import { parseOptionalDate } from "@/lib/validation";

export const runtime = "nodejs";

type CreateReminderBody = {
  title?: string;
  note?: string;
  remindAt?: string | null;
};

export async function GET(): Promise<NextResponse> {

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reminders = await Reminder.findAll({
    where: { userId: user.id },
    order: [["createdAt", "DESC"]],
  });

  return NextResponse.json({
    reminders: reminders.map(serializeReminder),
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as CreateReminderBody;
  const title = typeof body.title === "string" ? body.title.trim().replace(/[<>]/g, "") : "";
  const note = typeof body.note === "string" ? body.note.trim().replace(/[<>]/g, "") : "";

  if (title.length < 1 || title.length > 160) {
    return NextResponse.json(
      { error: "Title must be between 1 and 160 characters." },
      { status: 400 },
    );
  }

  if (note.length > 5000) {
    return NextResponse.json(
      { error: "Note must be 5000 characters or fewer." },
      { status: 400 },
    );
  }

  const parsedDate = parseOptionalDate(body.remindAt);
  if (parsedDate === "invalid" || parsedDate === "missing") {
    return NextResponse.json(
      { error: "Invalid reminder date." },
      { status: 400 },
    );
  }

  const reminder = await Reminder.create({
    userId: user.id,
    title,
    note,
    remindAt: parsedDate,
  });

  return NextResponse.json(
    {
      reminder: serializeReminder(reminder),
    },
    { status: 201 },
  );
}
