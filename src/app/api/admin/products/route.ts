import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { adminUsers, db, products } from "@/db";

const productCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  cover_url: z.string().url().nullable().optional(),
  external_url: z.string().url().nullable().optional(),
  github_url: z.string().url().nullable().optional(),
  status: z.enum(["development", "live", "archived"]),
  is_featured: z.boolean().optional(),
  order_index: z.number().int().optional(),
});

async function isAdminUser(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  const [adminUser] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);

  return Boolean(adminUser);
}

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!(await isAdminUser(session.user?.email))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const productList = await db
      .select()
      .from(products)
      .orderBy(asc(products.order_index));

    return NextResponse.json(productList, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!(await isAdminUser(session.user?.email))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 },
      );
    }

    const parsed = productCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const [product] = await db
      .insert(products)
      .values(parsed.data)
      .returning();

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
