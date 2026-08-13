import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireServerEnv } from "@/lib/env";
import { logServer } from "@/lib/logger";
import {
  createObjectKey,
  UPLOAD_RULES,
  validateUpload,
} from "@/lib/storage/rules";

let r2: S3Client | undefined;

function getR2() {
  if (!r2) {
    const env = requireServerEnv(
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
    );
    r2 = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return r2;
}

export async function signUpload(
  resourceType: keyof typeof UPLOAD_RULES,
  contentType: string,
) {
  const { R2_BUCKET_NAME } = requireServerEnv("R2_BUCKET_NAME");
  const key = createObjectKey(resourceType, contentType);
  const uploadUrl = await getSignedUrl(
    getR2(),
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 300 },
  );
  return { key, uploadUrl, mediaPath: `/media/${key}` };
}

export async function signPreviewDownload(key: string) {
  const { R2_BUCKET_NAME } = requireServerEnv("R2_BUCKET_NAME");
  return getSignedUrl(
    getR2(),
    new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }),
    { expiresIn: 300 },
  );
}

export async function getObject(key: string) {
  const { R2_BUCKET_NAME } = requireServerEnv("R2_BUCKET_NAME");
  return getR2().send(
    new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }),
  );
}

export async function assertStoredUpload(
  key: string,
  resourceType: keyof typeof UPLOAD_RULES,
) {
  const { R2_BUCKET_NAME } = requireServerEnv("R2_BUCKET_NAME");
  const metadata = await getR2().send(
    new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }),
  );
  if (
    !metadata.ContentType ||
    !metadata.ContentLength ||
    !validateUpload(resourceType, metadata.ContentType, metadata.ContentLength)
  ) {
    throw new Error(
      "Stored upload does not match the permitted type and size.",
    );
  }
}

export async function deleteObject(key: string | null | undefined) {
  if (!key) return;
  const { R2_BUCKET_NAME } = requireServerEnv("R2_BUCKET_NAME");
  try {
    await getR2().send(
      new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }),
    );
  } catch (error) {
    logServer("error", "storage.cleanup_failed", { key, error: String(error) });
  }
}
