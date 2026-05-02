"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirectTo: "/admin/dashboard",
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/admin/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFFFFF] px-6 font-sans text-[#2C3A52]">
      <section className="w-full max-w-md rounded-lg border border-[#C4CAD6] bg-[#F4F5F8] p-8">
        <div className="mb-8 flex justify-center">
          <Image
            src="/full-logo.png"
            alt="CODEDDEVS Technology LTD"
            width={180}
            height={48}
            className="h-12 w-auto"
            priority
          />
        </div>

        <div className="mb-8 text-center">
          <h1 className="font-mono text-2xl font-bold text-[#121F38]">
            Admin Sign In
          </h1>
          <p className="mt-2 text-sm text-[#6B7896]">
            Access the CODEDDEVS admin workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-[#121F38]"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-md border border-[#C4CAD6] bg-white px-4 py-3 text-[#121F38] outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-[#121F38]"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-md border border-[#C4CAD6] bg-white px-4 py-3 text-[#121F38] outline-none"
            />
          </div>

          {error ? (
            <p className="text-sm text-[#DC2626]" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-[#121F38] px-4 py-3 font-medium text-white disabled:opacity-70"
          >
            {isSubmitting ? "Signing In" : "Sign In"}
          </button>
        </form>
      </section>
    </main>
  );
}
