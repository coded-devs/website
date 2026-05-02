import { Resend } from "resend";

type ContactFormData = {
  full_name: string;
  email: string;
  subject: "General Inquiry" | "Partnership" | "Press" | "Investment" | "Other";
  message: string;
};

type ApplicationFormData = {
  career_title: string;
  full_name: string;
  email: string;
  cover_letter: string;
  portfolio_url?: string;
  github_url?: string;
};

function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_NOTIFICATION_EMAIL;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  if (!to) {
    throw new Error("CONTACT_NOTIFICATION_EMAIL is not configured.");
  }

  return {
    resend: new Resend(apiKey),
    to,
  };
}

export async function sendContactNotification(data: ContactFormData) {
  const { resend, to } = createResendClient();

  return resend.emails.send({
    to,
    from: "onboarding@resend.dev",
    subject: `New contact message from ${data.full_name} \u2014 ${data.subject}`,
    text: [
      `Full Name: ${data.full_name}`,
      `Email: ${data.email}`,
      `Subject: ${data.subject}`,
      `Message: ${data.message}`,
    ].join("\n"),
  });
}

export async function sendApplicationNotification(data: ApplicationFormData) {
  const { resend, to } = createResendClient();

  return resend.emails.send({
    to,
    from: "onboarding@resend.dev",
    subject: `New application for ${data.career_title} from ${data.full_name}`,
    text: [
      `Applicant Name: ${data.full_name}`,
      `Email: ${data.email}`,
      data.portfolio_url ? `Portfolio URL: ${data.portfolio_url}` : null,
      data.github_url ? `GitHub URL: ${data.github_url}` : null,
      `Cover Letter: ${data.cover_letter}`,
    ]
      .filter((line): line is string => Boolean(line))
      .join("\n"),
  });
}
