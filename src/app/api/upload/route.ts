import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToCloudinary(fileBuffer, file.name);

    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
