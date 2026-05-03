import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

const allowedFolders = [
  "team",
  "products",
  "blogs",
  "blogs/inline",
  "general",
] as const;

function isAllowedFolder(folder: string): folder is (typeof allowedFolders)[number] {
  return allowedFolders.includes(folder as (typeof allowedFolders)[number]);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const folder = url.searchParams.get("folder") || "general";

    if (!isAllowedFolder(folder)) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
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
