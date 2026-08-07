import Image from "next/image";
import { Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

type AssetIconProps = {
  objectKey: string | null;
  alt: string;
  size?: "xs" | "sm" | "default";
};

export function AssetIcon({
  objectKey,
  alt,
  size = "default",
}: AssetIconProps) {
  const classes = cn(
    "shrink-0 rounded-xl border bg-background object-contain p-2",
    size === "xs"
      ? "size-5 rounded-md p-0.5"
      : size === "sm"
        ? "size-8"
        : "size-11",
  );

  if (!objectKey) {
    return (
      <span
        className={cn(classes, "grid place-items-center text-foreground")}
        aria-hidden="true"
      >
        <Boxes
          className={
            size === "xs" ? "size-3" : size === "sm" ? "size-4" : "size-5"
          }
        />
      </span>
    );
  }

  const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  const src = base ? `${base}/${objectKey}` : `/media/${objectKey}`;

  return (
    <Image
      src={src}
      unoptimized
      width={size === "xs" ? 20 : size === "sm" ? 32 : 44}
      height={size === "xs" ? 20 : size === "sm" ? 32 : 44}
      alt={alt}
      className={classes}
    />
  );
}
