import { getOptimisedUrl } from "@/lib/cloudinary-url";

export { getOptimisedUrl };

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  filename: string,
) {
  const { v2: cloudinary } = await import("cloudinary");
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

        resolve(getOptimisedUrl(result.secure_url));
      },
    );

    uploadStream.end(fileBuffer);
  });
}
