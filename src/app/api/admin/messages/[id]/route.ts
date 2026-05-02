import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { contactSubmissions, db } from "@/db";

const idSchema = z.string().uuid();
const messageUpdateSchema = z.object({
  is_read: z.boolean(),
});

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PUT(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsedId = idSchema.safeParse(params.id);
    const parsedBody = messageUpdateSchema.safeParse(await request.json());

    if (!parsedId.success || !parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsedBody.success ? undefined : parsedBody.error.flatten(),
        },
        { status: 400 },
      );
    }

    const [message] = await db
      .update(contactSubmissions)
      .set({ is_read: parsedBody.data.is_read })
      .where(eq(contactSubmissions.id, parsedId.data))
      .returning();

    if (!message) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(message, { status: 200 });
  } catch (error) {
    console.error("Failed to update message:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsedId = idSchema.safeParse(params.id);

    if (!parsedId.success) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [message] = await db
      .delete(contactSubmissions)
      .where(eq(contactSubmissions.id, parsedId.data))
      .returning({ id: contactSubmissions.id });

    if (!message) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete message:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
