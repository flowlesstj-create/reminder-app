import { Reminder } from "@/lib/db";

export type ReminderDto = {
  id: number;
  title: string;
  note: string;
  remindAt: string | null;
  isCompleted: boolean;
  sharedToken: string | null;
  createdAt: string;
  updatedAt: string;
};

export function serializeReminder(reminder: Reminder): ReminderDto {
  return {
    id: reminder.id,
    title: reminder.title,
    note: reminder.note,
    remindAt: reminder.remindAt ? reminder.remindAt.toISOString() : null,
    isCompleted: reminder.isCompleted,
    sharedToken: reminder.sharedToken,
    createdAt: reminder.createdAt.toISOString(),
    updatedAt: reminder.updatedAt.toISOString(),
  };
}
