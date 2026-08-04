import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

const allowedFolders = [
  "team",
  "products",
  "blogs",
  "blogs/inline",
] as const;

function isAllowedFolder(folder: string): folder is (typeof allowedFolders)[number] {
  return allowedFolders.includes(folder as (typeof allowedFolders)[number]);
}

const uploadPayloadSchema = z.object({
  file: z.instanceof(File),
});

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const REQUIRED_CLOUDINARY_VARS = [
  "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

// Without these, the request still reaches Cloudinary and comes back as an
// opaque 401 ("cloud_name is disabled"), which reads like an outage rather than
// a missing .env value. Check first and say exactly what is absent.
function getMissingCloudinaryVars() {
  // ?.trim() so a variable set to whitespace counts as missing. Without it the
  // check passes and Cloudinary rejects the request instead.
  return REQUIRED_CLOUDINARY_VARS.filter((name) => !process.env[name]?.trim());
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The variable names stay in the server log only. The response says that
  // uploads are unconfigured without naming the infrastructure settings.
  const missingConfig = getMissingCloudinaryVars();

  if (missingConfig.length > 0) {
    console.error(
      `[upload] Cloudinary is not configured. Missing: ${missingConfig.join(", ")}`,
    );

    return NextResponse.json(
      {
        error:
          "Image uploads are not configured on this server. Check the server logs for the missing settings.",
      },
      { status: 503 },
    );
  }

  try {
    const url = new URL(request.url);
    const folder = url.searchParams.get("folder");

    if (!folder || !isAllowedFolder(folder)) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
    }

    const formData = await request.formData();
    const parsedPayload = uploadPayloadSchema.safeParse({
      file: formData.get("file"),
    });

    if (!parsedPayload.success) {
      return NextResponse.json(
        { error: "Invalid upload payload" },
        { status: 400 },
      );
    }

    const { file } = parsedPayload.data;

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP images are allowed" },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File size must be under 5MB" },
        { status: 413 },
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const uploadedUrl = await uploadToCloudinary(
      fileBuffer,
      file.name,
      `codeddevs-website/${folder}`,
    );

    return NextResponse.json({ url: uploadedUrl }, { status: 200 });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
