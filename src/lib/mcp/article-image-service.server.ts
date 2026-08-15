import "server-only";

import { getDb } from "@/db/client";
import { agentMediaUploads } from "@/db/schema";
import type { ArticleImageInput } from "@/lib/mcp/article-image-contract";
import { storeArticleImage } from "@/lib/mcp/article-image-service";
import { logServer } from "@/lib/logger";
import { deleteObjectOrThrow, putObject } from "@/lib/storage/server";
import { downloadRemoteArticleImage } from "@/lib/storage/remote-image";

export function storeArticleImageForMcp(
  input: ArticleImageInput,
  clientId: string,
) {
  return storeArticleImage(input, clientId, {
    download: downloadRemoteArticleImage,
    putObject,
    insertUpload: async (values) => {
      await getDb().insert(agentMediaUploads).values(values);
    },
    deleteObject: deleteObjectOrThrow,
    log: logServer,
  });
}
