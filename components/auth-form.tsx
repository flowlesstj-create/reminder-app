"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: Record<string, string> = {
        email,
        password,
      };

      if (isSignup) {
        payload.name = name;
      }

      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Unable to authenticate.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (requestError) {
      console.error(requestError);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
      <h1 className="text-2xl font-semibold text-zinc-900">
        {isSignup ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        {isSignup
          ? "Sign up to manage and share reminders."
          : "Log in to manage your reminders."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {isSignup ? (
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-700">Name</span>
            <input
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none transition focus:border-zinc-900"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
            />
          </label>
        ) : null}

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-700">Email</span>
          <input
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none transition focus:border-zinc-900"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-700">Password</span>
          <input
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none transition focus:border-zinc-900"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? isSignup
              ? "Creating account..."
              : "Logging in..."
            : isSignup
              ? "Create account"
              : "Log in"}
        </button>
      </form>

      <p className="mt-4 text-sm text-zinc-600">
        {isSignup ? "Already have an account?" : "Need an account?"}{" "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-medium text-zinc-900 underline-offset-2 hover:underline"
        >
          {isSignup ? "Log in" : "Sign up"}
        </Link>
      </p>
    </div>
  );
}
