// Increment this whenever the social-card asset or metadata strategy changes.
// Article timestamps alone cannot invalidate a failed crawler cache after a
// code-only deployment.
export const SOCIAL_PREVIEW_REVISION = "v2";

export function getSocialPreviewVersion(updatedAt: Date) {
  return `${SOCIAL_PREVIEW_REVISION}-${updatedAt.getTime().toString(36)}`;
}
