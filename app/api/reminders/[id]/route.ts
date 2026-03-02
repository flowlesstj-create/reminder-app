import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { Reminder, initDatabase } from "@/lib/db";
import { serializeReminder } from "@/lib/reminders";
import { parseOptionalDate } from "@/lib/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type UpdateReminderBody = {
  title?: string;
  note?: string;
  remindAt?: string | null;
  isCompleted?: boolean;
};

function parseReminderId(value: string): number | null {
  const id = Number.parseInt(value, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {

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

  let body: UpdateReminderBody;
  try {
    body = (await request.json()) as UpdateReminderBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.title !== undefined) {
    if (typeof body.title !== "string") {
      return NextResponse.json(
        { error: "Title must be text." },
        { status: 400 },
      );
    }

    const title = body.title.trim().replace(/[<>]/g, "");
    if (title.length < 1 || title.length > 160) {
      return NextResponse.json(
        { error: "Title must be between 1 and 160 characters." },
        { status: 400 },
      );
    }

    reminder.title = title;
  }

  if (body.note !== undefined) {
    if (typeof body.note !== "string") {
      return NextResponse.json(
        { error: "Note must be text." },
        { status: 400 },
      );
    }

    const note = body.note.trim().replace(/[<>]/g, "");
    if (note.length > 5000) {
      return NextResponse.json(
        { error: "Note must be 5000 characters or fewer." },
        { status: 400 },
      );
    }

    reminder.note = note;
  }

  const parsedDate = parseOptionalDate(body.remindAt);
  if (parsedDate === "invalid") {
    return NextResponse.json(
      { error: "Invalid reminder date." },
      { status: 400 },
    );
  }

  if (parsedDate !== "missing") {
    reminder.remindAt = parsedDate;
  }

  if (body.isCompleted !== undefined) {
    if (typeof body.isCompleted !== "boolean") {
      return NextResponse.json(
        { error: "Completed must be true or false." },
        { status: 400 },
      );
    }

    reminder.isCompleted = Boolean(body.isCompleted);
  }

  try {
    await reminder.save();
  } catch (error) {
    console.error("Failed to save reminder", error);
    return NextResponse.json({ error: "Unable to save reminder." }, { status: 500 });
  }

  return NextResponse.json({
    reminder: serializeReminder(reminder),
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idParam } = await params;
  const id = parseReminderId(idParam);
  if (!id) {
    return NextResponse.json({ error: "Invalid reminder id." }, { status: 400 });
  }

  let deleted: number;
  try {
    deleted = await Reminder.destroy({ where: { id, userId: user.id } });
  } catch (error) {
    console.error("Failed to delete reminder", error);
    return NextResponse.json({ error: "Unable to delete reminder." }, { status: 500 });
  }
  if (!deleted) {
    return NextResponse.json({ error: "Reminder not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
