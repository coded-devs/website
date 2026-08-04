import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db, products } from "@/db";
import { slugify } from "@/lib/utils";

const idSchema = z.string().uuid();
const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  tagline: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  cover_url: z.string().url().nullable().optional(),
  external_url: z.string().url().nullable().optional(),
  github_url: z.string().url().nullable().optional(),
  status: z.enum(["development", "live", "archived"]).optional(),
  is_featured: z.boolean().optional(),
  order_index: z.number().int().optional(),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;

  try {
    const parsedId = idSchema.safeParse(params.id);

    if (!parsedId.success) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, parsedId.data))
      .limit(1);

    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;

  try {
    const parsedId = idSchema.safeParse(params.id);
    const parsedBody = productUpdateSchema.safeParse(await request.json());

    if (!parsedId.success || !parsedBody.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsedBody.success ? undefined : parsedBody.error.flatten(),
        },
        { status: 400 },
      );
    }

    // Same normalisation as the create route: the slug is the public URL, so
    // it never goes into the database exactly as typed.
    const slug =
      parsedBody.data.slug === undefined
        ? undefined
        : slugify(parsedBody.data.slug);

    if (slug !== undefined && !slug) {
      return NextResponse.json(
        { error: "Invalid input", details: { fieldErrors: { slug: ["Slug must contain letters or numbers"] } } },
        { status: 400 },
      );
    }

    const [product] = await db
      .update(products)
      .set({
        ...parsedBody.data,
        ...(slug === undefined ? {} : { slug }),
        updated_at: new Date(),
      })
      .where(eq(products.id, parsedId.data))
      .returning();

    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;

  try {
    const parsedId = idSchema.safeParse(params.id);

    if (!parsedId.success) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [product] = await db
      .delete(products)
      .where(eq(products.id, parsedId.data))
      .returning({ id: products.id });

    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
