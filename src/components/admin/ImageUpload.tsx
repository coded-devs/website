"use client";

import Image from "next/image";
import { useRef, useState, type SyntheticEvent } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Button from "@/components/ui/Button";
import { getOptimisedUrl } from "@/lib/cloudinary";

export type UploadFolder = "team" | "products" | "blogs" | "blogs/inline";

type ImageUploadProps = {
  value: string | null;
  onChange: (url: string) => void;
  folder: UploadFolder;
  aspectRatio?: number;
  buttonLabel?: string;
  showPreview?: boolean;
};

function getErrorMessage(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error;
  }

  return "Upload failed.";
}

function createInitialCrop(
  imageWidth: number,
  imageHeight: number,
  aspectRatio?: number,
): Crop {
  if (!aspectRatio) {
    return {
      unit: "%",
      x: 5,
      y: 5,
      width: 90,
      height: 90,
    };
  }

  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspectRatio,
      imageWidth,
      imageHeight,
    ),
    imageWidth,
    imageHeight,
  );
}

function getCroppedBlob(image: HTMLImageElement, crop: PixelCrop) {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare image crop.");
  }

  canvas.width = crop.width;
  canvas.height = crop.height;
  context.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not create cropped image."));
          return;
        }

        resolve(blob);
      },
      "image/jpeg",
      0.92,
    );
  });
}

export default function ImageUpload({
  value,
  onChange,
  folder,
  aspectRatio,
  buttonLabel = "Upload Image",
  showPreview = true,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function closeCropper() {
    if (sourceUrl) {
      URL.revokeObjectURL(sourceUrl);
    }

    setSourceUrl(null);
    setCrop(undefined);
    setCompletedCrop(null);
    setIsUploading(false);
  }

  function handleFileChange(file: File | undefined) {
    if (!file) {
      return;
    }

    if (sourceUrl) {
      URL.revokeObjectURL(sourceUrl);
    }

    setError(null);
    setCrop(undefined);
    setCompletedCrop(null);
    setSelectedFileName(file.name.replace(/\.[^/.]+$/, "") || "upload");
    setSourceUrl(URL.createObjectURL(file));

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleImageLoad(event: SyntheticEvent<HTMLImageElement>) {
    const { width, height } = event.currentTarget;
    const initialCrop = createInitialCrop(width, height, aspectRatio);

    setCrop(initialCrop);
  }

  async function uploadBlob(blob: Blob) {
    const formData = new FormData();
    formData.append("file", blob, `${selectedFileName}-cropped.jpg`);

    const response = await fetch(
      `/api/upload?folder=${encodeURIComponent(folder)}`,
      {
        method: "POST",
        body: formData,
      },
    );
    const result: unknown = await response.json();

    if (
      !response.ok ||
      typeof result !== "object" ||
      result === null ||
      !("url" in result) ||
      typeof result.url !== "string"
    ) {
      throw new Error(getErrorMessage(result));
    }

    return result.url;
  }

  async function handleApplyCrop() {
    if (!imageRef.current || !completedCrop?.width || !completedCrop.height) {
      setError("Choose a crop area before uploading.");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const blob = await getCroppedBlob(imageRef.current, completedCrop);
      const url = await uploadBlob(blob);
      onChange(url);
      closeCropper();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {showPreview && value ? (
        <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-[#C4CAD6] bg-white">
          <Image
            src={getOptimisedUrl(value)}
            alt="Current upload"
            fill
            sizes="(min-width: 768px) 480px, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFileChange(event.target.files?.[0])}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {buttonLabel}
        </Button>
        {showPreview && value ? (
          <Button type="button" variant="ghost" onClick={() => onChange("")}>
            Remove
          </Button>
        ) : null}
      </div>

      {error && !sourceUrl ? (
        <p className="font-sans text-sm text-[#DC2626]">{error}</p>
      ) : null}

      {sourceUrl ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-8">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-sm">
            <div className="max-h-[70vh] overflow-auto">
              <ReactCrop
                crop={crop}
                aspect={aspectRatio}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
              >
                <img
                  ref={imageRef}
                  src={sourceUrl}
                  alt="Crop selected upload"
                  className="max-h-[60vh] max-w-full"
                  onLoad={handleImageLoad}
                />
              </ReactCrop>
            </div>

            {error ? (
              <p className="mt-4 font-sans text-sm text-[#DC2626]">{error}</p>
            ) : null}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={isUploading}
                onClick={closeCropper}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isUploading}
                onClick={handleApplyCrop}
              >
                {isUploading ? "Uploading..." : "Apply Crop"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
