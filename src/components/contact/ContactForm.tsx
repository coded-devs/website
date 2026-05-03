"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";

type Subject =
  | "General Inquiry"
  | "Partnership"
  | "Press"
  | "Investment"
  | "Other";

type FormValues = {
  full_name: string;
  email: string;
  subject: Subject | "";
  message: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;
type SubmitState = "idle" | "sending" | "success";

const subjects: Subject[] = [
  "General Inquiry",
  "Partnership",
  "Press",
  "Investment",
  "Other",
];

const initialValues: FormValues = {
  full_name: "",
  email: "",
  subject: "",
  message: "",
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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

async function readJsonResponse(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function validate(values: FormValues) {
  const errors: FormErrors = {};

  if (!values.full_name.trim()) {
    errors.full_name = "Full name is required.";
  }

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.subject) {
    errors.subject = "Subject is required.";
  }

  if (!values.message.trim()) {
    errors.message = "Message is required.";
  } else if (values.message.trim().length < 10) {
    errors.message = "Message must be at least 10 characters.";
  }

  return errors;
}

export default function ContactForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  function updateValue(key: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors = validate(values);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitState("sending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: values.full_name.trim(),
          email: values.email.trim(),
          subject: values.subject,
          message: values.message.trim(),
        }),
      });

      const result = await readJsonResponse(response);

      if (!response.ok) {
        setSubmitError(getErrorMessage(result));
        setSubmitState("idle");
        return;
      }

      setSubmitState("success");
    } catch {
      setSubmitError("Something went wrong. Please try again.");
      setSubmitState("idle");
    }
  }

  if (submitState === "success") {
    return (
      <div className="rounded-lg border border-[#C4CAD6] bg-[#F4F5F8] p-6">
        <p className="font-sans text-lg leading-[1.75] text-[#121F38]">
          Message sent. We&apos;ll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-[#C4CAD6] bg-[#F4F5F8] p-6"
      noValidate
    >
      <div className="space-y-5">
        <Input
          label="Full Name"
          name="full_name"
          value={values.full_name}
          onChange={(event) => updateValue("full_name", event.target.value)}
          error={errors.full_name}
          required
          autoComplete="name"
        />

        <Input
          label="Email"
          name="email"
          type="email"
          value={values.email}
          onChange={(event) => updateValue("email", event.target.value)}
          error={errors.email}
          required
          autoComplete="email"
        />

        <div className="w-full">
          <label
            htmlFor="subject"
            className="mb-2 block font-sans text-sm font-medium text-[#121F38]"
          >
            Subject
          </label>
          <select
            id="subject"
            name="subject"
            value={values.subject}
            onChange={(event) => updateValue("subject", event.target.value)}
            aria-invalid={Boolean(errors.subject) || undefined}
            aria-describedby={errors.subject ? "subject-error" : undefined}
            className="w-full rounded-md border border-[#C4CAD6] bg-white px-4 py-3 font-sans text-sm text-[#121F38] outline-none focus:border-[#121F38]"
            required
          >
            <option value="">Select a subject</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
          {errors.subject ? (
            <p id="subject-error" className="mt-2 font-sans text-sm text-[#DC2626]">
              {errors.subject}
            </p>
          ) : null}
        </div>

        <Textarea
          label="Message"
          name="message"
          value={values.message}
          onChange={(event) => updateValue("message", event.target.value)}
          error={errors.message}
          required
          minLength={10}
        />

        {submitError ? (
          <p className="font-sans text-sm leading-[1.6] text-[#DC2626]">
            {submitError}
          </p>
        ) : null}

        <Button type="submit" disabled={submitState === "sending"}>
          {submitState === "sending" ? "Sending..." : "Send Message"}
        </Button>
      </div>
    </form>
  );
}
