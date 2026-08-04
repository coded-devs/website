import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db, products } from "@/db";
import { slugify } from "@/lib/utils";

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

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    // The slug becomes the public URL (/products/<slug>), so normalise it the
    // same way the blog route does. Without this, whatever is typed goes
    // straight into the path — a pasted URL or a space breaks the page.
    const slug = slugify(parsed.data.slug || parsed.data.name);

    if (!slug) {
      return NextResponse.json(
        { error: "Invalid input", details: { fieldErrors: { slug: ["Slug must contain letters or numbers"] } } },
        { status: 400 },
      );
    }

    const [product] = await db
      .insert(products)
      .values({ ...parsed.data, slug })
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
