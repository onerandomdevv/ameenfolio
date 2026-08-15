import "server-only";

import { eq, lt } from "drizzle-orm";
import { getDb } from "@/db/client";
import { agentMediaUploads, posts } from "@/db/schema";
import { logServer } from "@/lib/logger";
import { cleanupExpiredArticleImages } from "@/lib/mcp/article-image-cleanup";
import { deleteObjectOrThrow } from "@/lib/storage/server";

export function cleanupExpiredArticleImagesForMcp(now = new Date()) {
  const db = getDb();
  return cleanupExpiredArticleImages(now, {
    selectExpired: (cutoff) =>
      db
        .select({
          id: agentMediaUploads.id,
          objectKey: agentMediaUploads.objectKey,
        })
        .from(agentMediaUploads)
        .where(lt(agentMediaUploads.createdAt, cutoff)),
    listSavedPostMarkdown: async () => {
      const rows = await db
        .select({ bodyMarkdown: posts.bodyMarkdown })
        .from(posts);
      return rows.map((row) => row.bodyMarkdown);
    },
    deleteObject: deleteObjectOrThrow,
    deleteRow: async (id) => {
      await db.delete(agentMediaUploads).where(eq(agentMediaUploads.id, id));
    },
    log: logServer,
  });
}
