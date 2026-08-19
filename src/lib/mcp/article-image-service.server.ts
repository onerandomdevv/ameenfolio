import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { agentMediaUploads } from "@/db/schema";
import type { ArticleImageInput } from "@/lib/mcp/article-image-contract";
import { storeArticleImage } from "@/lib/mcp/article-image-service";
import { logServer } from "@/lib/logger";
import { createObjectKey } from "@/lib/storage/rules";
import { putArticleImageObject } from "@/lib/storage/server";
import { downloadRemoteArticleImage } from "@/lib/storage/remote-image";

export function storeArticleImageForMcp(
  input: ArticleImageInput,
  clientId: string,
) {
  return storeArticleImage(input, clientId, {
    download: downloadRemoteArticleImage,
    reserveUpload: async (values) => {
      const key = createObjectKey("post", values.contentType);
      const [row] = await getDb()
        .insert(agentMediaUploads)
        .values({ objectKey: key, ...values, status: "pending" })
        .returning({ id: agentMediaUploads.id });
      if (!row) throw new Error("The upload reservation was not created.");
      return { id: row.id, key, mediaPath: `/media/${key}` };
    },
    putObject: putArticleImageObject,
    markReady: async (id) => {
      const [row] = await getDb()
        .update(agentMediaUploads)
        .set({ status: "ready" })
        .where(eq(agentMediaUploads.id, id))
        .returning({ id: agentMediaUploads.id });
      if (!row) throw new Error("The upload reservation no longer exists.");
    },
    log: logServer,
  });
}
