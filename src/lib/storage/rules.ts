import { randomBytes } from "node:crypto";
import path from "node:path";

export const UPLOAD_RULES = {
  icon: {
    contentTypes: ["image/png", "image/jpeg", "image/webp"],
    maxBytes: 2 * 1024 * 1024,
    prefix: "icons",
  },
  profile: {
    contentTypes: ["image/png", "image/jpeg", "image/webp"],
    maxBytes: 2 * 1024 * 1024,
    prefix: "profiles",
  },
  resume: {
    contentTypes: ["application/pdf"],
    maxBytes: 10 * 1024 * 1024,
    prefix: "resumes",
  },
  // Screenshots and exported diagrams, so the ceiling is higher than an icon's
  // and gif is allowed: a short screen capture is often the clearest way to
  // show what a thing does.
  post: {
    contentTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
    maxBytes: 8 * 1024 * 1024,
    prefix: "posts",
  },
} as const;

const extensions: Record<string, string> = {
  "image/gif": ".gif",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

export function validateUpload(
  resourceType: keyof typeof UPLOAD_RULES,
  contentType: string,
  size: number,
) {
  const rule = UPLOAD_RULES[resourceType];
  return (
    rule.contentTypes.includes(contentType as never) &&
    size > 0 &&
    size <= rule.maxBytes
  );
}

export function createObjectKey(
  resourceType: keyof typeof UPLOAD_RULES,
  contentType: string,
  now = new Date(),
) {
  const rule = UPLOAD_RULES[resourceType];
  const extension = extensions[contentType];
  if (!extension || !rule.contentTypes.includes(contentType as never)) {
    throw new Error("Unsupported upload content type.");
  }
  return `${rule.prefix}/${now.getUTCFullYear()}/${randomBytes(24).toString("hex")}${extension}`;
}

export function isPublicIconKey(key: string) {
  const normalized = key.replaceAll("\\", "/");
  return (
    normalized === key &&
    !normalized.includes("..") &&
    /^icons\/\d{4}\/[a-f0-9]{48}\.(png|jpg|webp)$/.test(normalized) &&
    path.posix.normalize(normalized) === normalized
  );
}

export function isPublicProfileKey(key: string) {
  const normalized = key.replaceAll("\\", "/");
  return (
    normalized === key &&
    !normalized.includes("..") &&
    /^profiles\/\d{4}\/[a-f0-9]{48}\.(png|jpg|webp)$/.test(normalized) &&
    path.posix.normalize(normalized) === normalized
  );
}

export function isPublicPostImageKey(key: string) {
  const normalized = key.replaceAll("\\", "/");
  return (
    normalized === key &&
    !normalized.includes("..") &&
    /^posts\/\d{4}\/[a-f0-9]{48}\.(png|jpg|webp|gif)$/.test(normalized) &&
    path.posix.normalize(normalized) === normalized
  );
}

export function isPublicMediaKey(key: string) {
  return (
    isPublicIconKey(key) || isPublicProfileKey(key) || isPublicPostImageKey(key)
  );
}

export function isManagedObjectKey(key: string) {
  return (
    isPublicMediaKey(key) || /^resumes\/\d{4}\/[a-f0-9]{48}\.pdf$/.test(key)
  );
}
