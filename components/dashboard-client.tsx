"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import type { ReminderDto } from "@/lib/reminders";

type DashboardClientProps = {
  user: {
    name: string;
    email: string;
  };
  initialReminders: ReminderDto[];
};

function isoToLocalInput(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function localInputToIso(value: string): string | null {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
}

function buildShareHref(token: string): string {
  if (typeof window === "undefined") {
    return `/shared/${token}`;
  }

  return `${window.location.origin}/shared/${token}`;
}

export function DashboardClient({
  user,
  initialReminders,
}: DashboardClientProps) {
  const router = useRouter();
  const [reminders, setReminders] = useState(initialReminders);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const reminderCountText = useMemo(() => {
    if (reminders.length === 1) {
      return "1 reminder";
    }

    return `${reminders.length} reminders`;
  }, [reminders.length]);

  async function createReminder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setInfo(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          note,
          remindAt: localInputToIso(remindAt),
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        reminder?: ReminderDto;
      };

      if (!response.ok || !data.reminder) {
        setError(data.error ?? "Unable to create reminder.");
        setSubmitting(false);
        return;
      }

      setReminders((current) => [data.reminder!, ...current]);
      setTitle("");
      setNote("");
      setRemindAt("");
      setInfo("Reminder created.");
      setSubmitting(false);
    } catch (requestError) {
      console.error(requestError);
      setError("Unable to create reminder.");
      setSubmitting(false);
    }
  }

  function updateReminderInState(
    id: number,
    patch: Partial<ReminderDto>,
  ): void {
    setReminders((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        return { ...item, ...patch };
      }),
    );
  }

  async function saveReminder(id: number) {
    setBusyId(id);
    setError(null);
    setInfo(null);

    try {
      const reminder = reminders.find((item) => item.id === id);
      if (!reminder) {
        setBusyId(null);
        return;
      }

      const response = await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: reminder.title,
          note: reminder.note,
          remindAt: reminder.remindAt,
          isCompleted: reminder.isCompleted,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        reminder?: ReminderDto;
      };

      if (!response.ok || !data.reminder) {
        setError(data.error ?? "Unable to update reminder.");
        setBusyId(null);
        return;
      }

      setReminders((current) =>
        current.map((item) => (item.id === id ? data.reminder! : item)),
      );
      setInfo("Reminder saved.");
      setBusyId(null);
    } catch (requestError) {
      console.error(requestError);
      setError("Unable to save reminder.");
      setBusyId(null);
    }
  }

  async function deleteReminder(id: number) {
    setBusyId(id);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Unable to delete reminder.");
        setBusyId(null);
        return;
      }

      setReminders((current) => current.filter((item) => item.id !== id));
      setInfo("Reminder deleted.");
      setBusyId(null);
    } catch (requestError) {
      console.error(requestError);
      setError("Unable to delete reminder.");
      setBusyId(null);
    }
  }

  async function shareReminder(id: number) {
    setBusyId(id);
    setError(null);
    setInfo(null);

    try {
      const response = await fetch(`/api/reminders/${id}/share`, {
        method: "POST",
      });

      const data = (await response.json()) as {
        error?: string;
        shareToken?: string;
        shareUrl?: string;
      };

      if (!response.ok || !data.shareToken || !data.shareUrl) {
        setError(data.error ?? "Unable to create share link.");
        setBusyId(null);
        return;
      }

      updateReminderInState(id, { sharedToken: data.shareToken });

      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(data.shareUrl);
        setInfo("Share link copied to clipboard.");
      } else {
        setInfo(`Share link: ${data.shareUrl}`);
      }

      setBusyId(null);
    } catch (requestError) {
      console.error(requestError);
      setError("Unable to create share link.");
      setBusyId(null);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-zinc-100 p-4 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
              <p className="mt-1 text-sm text-zinc-600">
                Signed in as {user.name} ({user.email})
              </p>
              <p className="text-sm text-zinc-500">{reminderCountText}</p>
            </div>
            <button
              onClick={logout}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900"
            >
              Log out
            </button>
          </div>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Create reminder</h2>
          <form onSubmit={createReminder} className="mt-4 space-y-3">
            <input
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900"
              placeholder="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
            <textarea
              className="h-28 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900"
              placeholder="Notes"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <label className="block text-sm text-zinc-700">
              Remind at
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900"
                value={remindAt}
                onChange={(event) => setRemindAt(event.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create reminder"}
            </button>
          </form>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          {info ? <p className="mt-3 text-sm text-green-700">{info}</p> : null}
        </section>

        <section className="space-y-4">
          {reminders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
              No reminders yet. Create your first one above.
            </div>
          ) : null}

          {reminders.map((reminder) => {
            const shareHref = reminder.sharedToken
              ? buildShareHref(reminder.sharedToken)
              : null;

            return (
              <article
                key={reminder.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700">
                    <input
                      type="checkbox"
                      checked={reminder.isCompleted}
                      onChange={(event) =>
                        updateReminderInState(reminder.id, {
                          isCompleted: event.target.checked,
                        })
                      }
                    />
                    Completed
                  </label>
                  <span className="text-xs text-zinc-500">
                    Updated {new Date(reminder.updatedAt).toLocaleString()}
                  </span>
                </div>

                <input
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900"
                  value={reminder.title}
                  onChange={(event) =>
                    updateReminderInState(reminder.id, {
                      title: event.target.value,
                    })
                  }
                />

                <textarea
                  className="mt-3 h-28 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900"
                  value={reminder.note}
                  onChange={(event) =>
                    updateReminderInState(reminder.id, {
                      note: event.target.value,
                    })
                  }
                />

                <label className="mt-3 block text-sm text-zinc-700">
                  Remind at
                  <input
                    type="datetime-local"
                    value={isoToLocalInput(reminder.remindAt)}
                    onChange={(event) =>
                      updateReminderInState(reminder.id, {
                        remindAt: localInputToIso(event.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900"
                  />
                </label>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => saveReminder(reminder.id)}
                    disabled={busyId === reminder.id}
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => shareReminder(reminder.id)}
                    disabled={busyId === reminder.id}
                    className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Share link
                  </button>
                  <button
                    onClick={() => deleteReminder(reminder.id)}
                    disabled={busyId === reminder.id}
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>

                {shareHref ? (
                  <p className="mt-3 text-sm text-zinc-600">
                    Shared URL:{" "}
                    <Link
                      href={shareHref}
                      target="_blank"
                      className="text-zinc-900 underline underline-offset-2"
                    >
                      {shareHref}
                    </Link>
                  </p>
                ) : null}
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
