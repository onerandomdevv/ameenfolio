import "client-only";

export type UploadResourceType = "icon" | "profile" | "resume";

export async function uploadFile(resourceType: UploadResourceType, file: File) {
  const signed = await fetch("/api/admin/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resourceType,
      filename: file.name,
      contentType: file.type,
      size: file.size,
    }),
  });

  if (!signed.ok) throw new Error("This file is not allowed.");

  const payload = (await signed.json()) as {
    uploadUrl: string;
    key: string;
  };
  const sent = await fetch(payload.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!sent.ok) {
    throw new Error("Upload failed before the file was saved.");
  }

  return payload;
}
