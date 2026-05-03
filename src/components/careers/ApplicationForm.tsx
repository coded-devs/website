"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";

type ApplicationFormProps = {
  careerId: string;
  careerTitle: string;
};

type SubmitState = "idle" | "submitting" | "success";

function getErrorMessage(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error;
  }

  return "Something went wrong. Please try again.";
}

export default function ApplicationForm({
  careerId,
  careerTitle,
}: ApplicationFormProps) {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitState("submitting");

    const formData = new FormData(event.currentTarget);
    const portfolioUrl = String(formData.get("portfolio_url") ?? "").trim();
    const githubUrl = String(formData.get("github_url") ?? "").trim();

    const payload = {
      career_id: careerId,
      full_name: String(formData.get("full_name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      cover_letter: String(formData.get("cover_letter") ?? "").trim(),
      ...(portfolioUrl ? { portfolio_url: portfolioUrl } : {}),
      ...(githubUrl ? { github_url: githubUrl } : {}),
    };

    try {
      const response = await fetch("/api/careers/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result: unknown = await response.json();

      if (!response.ok) {
        setError(getErrorMessage(result));
        setSubmitState("idle");
        return;
      }

      setSubmitState("success");
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitState("idle");
    }
  }

  if (submitState === "success") {
    return (
      <div className="rounded-lg border border-[#C4CAD6] bg-white p-5">
        <h3 className="font-mono text-xl font-semibold leading-[1.3] text-[#121F38]">
          Application received
        </h3>
        <p className="mt-3 font-sans text-base leading-[1.7] text-[#2C3A52]">
          Thanks for applying for {careerTitle}. We&apos;ll review your note and
          get back to you if there is a fit.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-[#C4CAD6] bg-white p-5"
    >
      <div className="space-y-5">
        <div>
          <h3 className="font-mono text-xl font-semibold leading-[1.3] text-[#121F38]">
            Apply for {careerTitle}
          </h3>
          <p className="mt-2 font-sans text-sm leading-[1.6] text-[#6B7896]">
            Tell us who you are, what you have built, and why this role matters
            to you.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Full Name"
            name="full_name"
            minLength={2}
            required
            autoComplete="name"
          />
          <Input
            label="Email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Portfolio URL"
            name="portfolio_url"
            type="url"
            placeholder="https://"
          />
          <Input
            label="GitHub URL"
            name="github_url"
            type="url"
            placeholder="https://github.com/username"
          />
        </div>

        <Textarea
          label="Cover Letter"
          name="cover_letter"
          minLength={50}
          required
          placeholder="Share the context, work, and motivation we should know about."
        />

        {error ? (
          <p className="font-sans text-sm leading-[1.6] text-[#DC2626]">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={submitState === "submitting"}>
          {submitState === "submitting" ? "Submitting..." : "Submit Application"}
        </Button>
      </div>
    </form>
  );
}
