import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard-client";
import { getCurrentUser } from "@/lib/auth";
import { Reminder, initDatabase } from "@/lib/db";
import { serializeReminder } from "@/lib/reminders";

export const runtime = "nodejs";

export default async function DashboardPage() {
  await initDatabase();

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const reminders = await Reminder.findAll({
    where: { userId: user.id },
    order: [["createdAt", "DESC"]],
  });

  return (
    <DashboardClient
      user={{ name: user.name, email: user.email }}
      initialReminders={reminders.map(serializeReminder)}
    />
  );
}
