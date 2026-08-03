import Badge, { type BadgeProps } from "@/components/ui/Badge";
import type { ProductSelect } from "@/types";

type ProductStatus = ProductSelect["status"];

const statusLabels: Record<ProductStatus, string> = {
  development: "In Development",
  live: "Live",
  archived: "Archived",
};

const statusVariants: Record<ProductStatus, BadgeProps["variant"]> = {
  development: "warning",
  live: "success",
  archived: "muted",
};

export default function ProductStatusBadge({
  status,
}: {
  status: ProductStatus;
}) {
  return <Badge variant={statusVariants[status]}>{statusLabels[status]}</Badge>;
}
