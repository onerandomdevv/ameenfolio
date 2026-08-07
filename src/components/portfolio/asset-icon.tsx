import Image from "next/image";
import { Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

type AssetIconProps = {
  objectKey: string | null;
  alt: string;
  size?: "sm" | "default";
};

export function AssetIcon({
  objectKey,
  alt,
  size = "default",
}: AssetIconProps) {
  const classes = cn(
    "shrink-0 rounded-xl border bg-background object-contain p-2",
    size === "sm" ? "size-8" : "size-11",
  );

  if (!objectKey) {
    return (
      <span
        className={cn(classes, "grid place-items-center text-primary")}
        aria-hidden="true"
      >
        <Boxes className={size === "sm" ? "size-4" : "size-5"} />
      </span>
    );
  }

  const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  const src = base ? `${base}/${objectKey}` : `/media/${objectKey}`;

  return (
    <Image
      src={src}
      unoptimized
      width={size === "sm" ? 32 : 44}
      height={size === "sm" ? 32 : 44}
      alt={alt}
      className={classes}
    />
  );
}
