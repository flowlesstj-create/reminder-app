import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export default async function LoginPage() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch (error) {
    console.error("Auth check failed:", error);
  }

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-4">
      <AuthForm mode="login" />
    </main>
  );
}
