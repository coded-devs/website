export function getOptimisedUrl(url: string | null | undefined): string {
  if (!url) {
    return "";
  }

  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  if (url.includes("/upload/f_auto,q_auto/")) {
    return url;
  }

  return url.replace("/upload/", "/upload/f_auto,q_auto/");
}

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  filename: string,
) {
  const importCloudinary = new Function("return import('cloudinary')") as () => Promise<
    typeof import("cloudinary")
  >;
  const { v2: cloudinary } = await importCloudinary();
  const publicId = filename.replace(/\.[^/.]+$/, "");

  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "codeddevs-website",
        public_id: publicId,
        resource_type: "auto",
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
