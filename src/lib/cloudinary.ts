export function getOptimisedUrl(
  url: string | null | undefined,
  transformation: string = "f_auto,q_auto",
): string {
  if (!url) {
    return "";
  }

  try {
    const parsedUrl = new URL(url);

    if (
      !parsedUrl.hostname.endsWith("cloudinary.com") ||
      !parsedUrl.pathname.includes("/upload/")
    ) {
      return url;
    }
  } catch {
    return url;
  }

  return url.replace("/upload/", `/upload/${transformation}/`);
}

export function getBlogCoverUrl(url: string | null | undefined): string {
  return getOptimisedUrl(url, "f_auto,q_auto,w_1200,h_630,c_fill");
}

export function getBlogThumbnailUrl(url: string | null | undefined): string {
  return getOptimisedUrl(url, "f_auto,q_auto,w_800,h_420,c_fill");
}

export function getRecognitionCardUrl(url: string | null | undefined): string {
  return getOptimisedUrl(url, "f_auto,q_auto,w_600,h_315,c_fill");
}

export function getTeamPhotoUrl(url: string | null | undefined): string {
  return getOptimisedUrl(url, "f_auto,q_auto,w_400,h_400,c_fill,g_face");
}

export function getProductCoverUrl(url: string | null | undefined): string {
  return getOptimisedUrl(url, "f_auto,q_auto,w_1200,h_630,c_fill");
}

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  filename: string,
  folder: string,
) {
  const importCloudinary = new Function("return import('cloudinary')") as () => Promise<
    typeof import("cloudinary")
  >;
  const { v2: cloudinary } = await importCloudinary();
  // Cloudinary treats "/" in a public_id as a folder separator, so an unsanitised
  // filename could write outside the allowlisted folder.
  const publicId = filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9\-_]/g, "-");

  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result?.secure_url) {
          reject(new Error("Cloudinary upload did not return a secure URL."));
          return;
        }

        resolve(result.secure_url);
      },
    );

    uploadStream.end(fileBuffer);
  });
}
