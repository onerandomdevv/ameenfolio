import Image from "next/image";
import { Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

type AssetIconProps = {
  objectKey: string | null;
  alt: string;
  size?: "xxs" | "xs" | "sm" | "default";
  // Rendered as a lettered tile when no icon has been uploaded. Callers that
  // want a real placeholder pass one; the rest keep the generic mark.
  fallbackLabel?: string;
};

export function AssetIcon({
  objectKey,
  alt,
  size = "default",
  fallbackLabel,
}: AssetIconProps) {
  const classes = cn(
    "shrink-0 object-contain",
    // The larger sizes are framed tiles. xs and xxs are not: they sit inside a
    // badge or row that already supplies the surface, so a border, an opaque
    // backdrop and inset padding only box the artwork in with a black margin
    // around it.
    size === "xxs"
      ? "size-4 rounded-[3px]"
      : size === "xs"
        ? "size-5 rounded-[3px]"
        : size === "sm"
          ? "size-8 rounded-xl border bg-background p-2"
          : "size-11 rounded-xl border bg-background p-2",
  );

  if (!objectKey) {
    if (fallbackLabel) {
      // A solid lettered tile rather than a generic glyph, so an icon-less
      // project still reads as a deliberate mark and is replaced the moment a
      // real one is uploaded.
      return (
        <span
          className={cn(
            classes,
            "grid place-items-center border-0 bg-foreground p-0 font-semibold leading-none text-background",
            size === "xxs"
              ? "text-[9px]"
              : size === "xs"
                ? "text-[10px]"
                : "text-sm",
          )}
          aria-hidden="true"
        >
          {fallbackLabel}
        </span>
      );
    }

    return (
      <span
        className={cn(classes, "grid place-items-center text-foreground")}
        aria-hidden="true"
      >
        <Boxes
          className={
            size === "xxs" || size === "xs"
              ? "size-3"
              : size === "sm"
                ? "size-4"
                : "size-5"
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
      width={size === "xxs" ? 16 : size === "xs" ? 20 : size === "sm" ? 32 : 44}
      height={
        size === "xxs" ? 16 : size === "xs" ? 20 : size === "sm" ? 32 : 44
      }
      alt={alt}
      className={classes}
    />
  );
}
