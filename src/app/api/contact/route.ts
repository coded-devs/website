import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { contactSubmissions } from "@/db/schema";
import { sendContactNotification } from "@/lib/email";

const contactSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  subject: z.enum([
    "General Inquiry",
    "Partnership",
    "Press",
    "Investment",
    "Other",
  ]),
  message: z.string().min(10),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const data = contactSchema.parse(body);
    const { db } = await import("@/db");

    await db.insert(contactSubmissions).values(data);

    try {
      await sendContactNotification(data);
    } catch (error) {
      console.error("Failed to send contact notification email:", error);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    console.error("Failed to process contact submission:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
