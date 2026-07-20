"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";

type AdminDeleteButtonProps = {
  endpoint: string;
  label?: string;
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

  return "Delete failed.";
}

export default function AdminDeleteButton({
  endpoint,
  label = "Delete",
}: AdminDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Delete this record? This cannot be undone.")) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(endpoint, { method: "DELETE" });
      const result: unknown = await response.json();

      if (!response.ok) {
        window.alert(getErrorMessage(result));
        return;
      }

      router.refresh();
    } catch {
      window.alert("Delete failed.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isDeleting}
      onClick={handleDelete}
      className="text-[#DC2626] hover:bg-red-50"
    >
      {isDeleting ? "Deleting..." : label}
    </Button>
  );
}
