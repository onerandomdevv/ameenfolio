export async function cleanupUpload(key: string | undefined) {
  if (!key) return;
  try {
    await fetch("/api/admin/uploads/sign", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
  } catch {
    // The server logs cleanup failures; a later bucket lifecycle rule is the final fallback.
  }
}
