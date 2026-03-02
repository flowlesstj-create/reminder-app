import Link from "next/link";
import { notFound } from "next/navigation";
import { Reminder, User } from "@/lib/db";

export const runtime = "nodejs";

type SharedPageProps = {
  params: Promise<{ token: string }>;
};

export default async function SharedReminderPage({ params }: SharedPageProps) {

  const { token } = await params;

  const reminder = await Reminder.findOne({ where: { sharedToken: token } });
  if (!reminder) {
    notFound();
  }

  let owner: User | null = null;
  try {
    owner = await User.findByPk(reminder.userId);
  } catch (error) {
    console.error("Failed to fetch reminder owner", error);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-4">
      <article className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-500">Shared reminder</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{reminder.title}</h1>

        {owner ? (
          <p className="mt-2 text-sm text-zinc-600">Owner: {owner.name}</p>
        ) : null}

        {reminder.remindAt ? (
          <p className="mt-2 text-sm text-zinc-700">
            Remind at: {new Date(reminder.remindAt).toLocaleString()}
          </p>
        ) : null}

        <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-sm whitespace-pre-wrap text-zinc-700">
          {reminder.note || "No note attached."}
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          Status: {reminder.isCompleted ? "Completed" : "Open"}
        </p>

        <Link
          href="/login"
          className="mt-6 inline-flex rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
        >
          Open your dashboard
        </Link>
      </article>
    </main>
  );
}
