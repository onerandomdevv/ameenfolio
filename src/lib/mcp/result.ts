import type { ImageContent } from "@modelcontextprotocol/sdk/types.js";

export type McpImageContent = ImageContent;

type JsonObject = Record<string, unknown>;

function toJsonValue(value: unknown): unknown {
  const serialized = JSON.stringify(value);
  return serialized === undefined ? null : JSON.parse(serialized);
}

function toStructuredContent(value: unknown): JsonObject {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }

  return { data: value };
}

/**
 * Returns MCP data through both supported channels.
 *
 * `structuredContent` powers clients and widgets that understand rich MCP
 * responses. The JSON text block gives every model-facing client the same
 * result even when it ignores or cannot inspect structured content.
 */
export function createMcpToolResult(
  data: unknown,
  summary: string,
  images: McpImageContent[] = [],
) {
  const jsonData = toJsonValue(data);

  return {
    structuredContent: toStructuredContent(jsonData),
    content: [
      {
        type: "text" as const,
        text: `${summary}\n\nTool result (JSON):\n${JSON.stringify(jsonData, null, 2)}`,
      },
      ...images,
    ],
  };
}
