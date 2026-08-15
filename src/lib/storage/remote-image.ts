import { BlockList, isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";

export const MAX_ARTICLE_IMAGE_BYTES = 8 * 1024 * 1024;

export class RemoteImageError extends Error {
  constructor(
    public readonly code:
      | "unsafe_source"
      | "invalid_image"
      | "mime_mismatch"
      | "too_large"
      | "timeout"
      | "download_failed",
    message: string,
  ) {
    super(message);
    this.name = "RemoteImageError";
  }
}

const forbiddenIpv4Addresses = new BlockList();
const forbiddenIpv6Addresses = new BlockList();

for (const [address, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  forbiddenIpv4Addresses.addSubnet(address, prefix, "ipv4");
}

for (const [address, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["::ffff:0:0", 96],
  ["2001::", 32],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["3fff::", 20],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const) {
  forbiddenIpv6Addresses.addSubnet(address, prefix, "ipv6");
}

export type ResolvedAddress = {
  address: string;
  family: 4 | 6;
};

function isGlobalUnicastIpv6(address: string) {
  const firstGroup = Number.parseInt(address.split(":", 1)[0] || "0", 16);
  return firstGroup >= 0x2000 && firstGroup <= 0x3fff;
}

export function assertPublicAddresses(addresses: ResolvedAddress[]) {
  if (addresses.length === 0) {
    throw new RemoteImageError(
      "unsafe_source",
      "The image host did not resolve to a public address.",
    );
  }

  for (const { address, family } of addresses) {
    const detectedFamily = isIP(address);
    const isPublicIpv6 = family !== 6 || isGlobalUnicastIpv6(address);
    const isForbidden =
      family === 4
        ? forbiddenIpv4Addresses.check(address, "ipv4")
        : forbiddenIpv6Addresses.check(address, "ipv6");
    if (detectedFamily !== family || !isPublicIpv6 || isForbidden) {
      throw new RemoteImageError(
        "unsafe_source",
        "The image host must resolve only to public addresses.",
      );
    }
  }
}

export function validateRemoteImageUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new RemoteImageError("unsafe_source", "The image URL is invalid.");
  }
  if (url.protocol !== "https:") {
    throw new RemoteImageError(
      "unsafe_source",
      "The image URL must use HTTPS.",
    );
  }
  if (url.username || url.password) {
    throw new RemoteImageError(
      "unsafe_source",
      "The image URL must not contain credentials.",
    );
  }
  return url;
}

export type DetectedArticleImage = {
  contentType: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
  extension: ".png" | ".jpg" | ".webp" | ".gif";
};

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

function endsWith(bytes: Uint8Array, signature: number[]) {
  if (bytes.byteLength < signature.length) return false;
  const offset = bytes.byteLength - signature.length;
  return signature.every((value, index) => bytes[offset + index] === value);
}

export function detectArticleImage(bytes: Uint8Array): DetectedArticleImage {
  const pngHeader = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const pngEnd = [
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ];
  if (startsWith(bytes, pngHeader) && endsWith(bytes, pngEnd)) {
    return { contentType: "image/png", extension: ".png" };
  }

  if (
    bytes.byteLength >= 4 &&
    startsWith(bytes, [0xff, 0xd8, 0xff]) &&
    endsWith(bytes, [0xff, 0xd9])
  ) {
    return { contentType: "image/jpeg", extension: ".jpg" };
  }

  const gifHeader = Buffer.from(bytes.subarray(0, 6)).toString("ascii");
  if (
    bytes.byteLength >= 7 &&
    (gifHeader === "GIF87a" || gifHeader === "GIF89a") &&
    bytes[bytes.byteLength - 1] === 0x3b
  ) {
    return { contentType: "image/gif", extension: ".gif" };
  }

  if (
    bytes.byteLength >= 12 &&
    Buffer.from(bytes.subarray(0, 4)).toString("ascii") === "RIFF" &&
    Buffer.from(bytes.subarray(8, 12)).toString("ascii") === "WEBP"
  ) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (view.getUint32(4, true) === bytes.byteLength - 8) {
      return { contentType: "image/webp", extension: ".webp" };
    }
  }

  throw new RemoteImageError(
    "invalid_image",
    "The downloaded file is not a valid image in a supported format.",
  );
}

type RemoteImageResponse = {
  statusCode: number;
  headers: Record<string, string | undefined>;
  body: AsyncIterable<Uint8Array>;
  destroy: () => void;
};

export type RemoteImageDependencies = {
  resolveHost: (hostname: string) => Promise<ResolvedAddress[]>;
  request: (
    url: URL,
    address: ResolvedAddress,
    timeoutMs: number,
  ) => Promise<RemoteImageResponse>;
};

function normalizedHostname(hostname: string) {
  return hostname.startsWith("[") && hostname.endsWith("]")
    ? hostname.slice(1, -1)
    : hostname;
}

async function resolveHost(hostname: string): Promise<ResolvedAddress[]> {
  const normalized = normalizedHostname(hostname);
  const family = isIP(normalized);
  if (family === 4 || family === 6) {
    return [{ address: normalized, family }];
  }
  const addresses = await lookup(normalized, { all: true, verbatim: true });
  return addresses.map(({ address, family }) => ({
    address,
    family: family as 4 | 6,
  }));
}

function headerValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function requestPinnedAddress(
  url: URL,
  address: ResolvedAddress,
  timeoutMs: number,
): Promise<RemoteImageResponse> {
  return new Promise((resolve, reject) => {
    let timedOut = false;
    const request = httpsRequest(
      url,
      {
        method: "GET",
        headers: {
          Accept: "image/png,image/jpeg,image/webp,image/gif",
          "Accept-Encoding": "identity",
          "User-Agent": "Ameenfolio-MCP/1.0",
        },
        lookup: (_hostname, _options, callback) =>
          callback(null, address.address, address.family),
        servername: isIP(normalizedHostname(url.hostname))
          ? undefined
          : normalizedHostname(url.hostname),
      },
      (response) => {
        const clear = () => clearTimeout(timer);
        response.once("end", clear);
        response.once("close", clear);
        response.once("error", clear);
        resolve({
          statusCode: response.statusCode ?? 0,
          headers: Object.fromEntries(
            Object.entries(response.headers).map(([name, value]) => [
              name,
              headerValue(value),
            ]),
          ),
          body: response,
          destroy: () => response.destroy(),
        });
      },
    );
    const timer = setTimeout(() => {
      timedOut = true;
      request.destroy(new Error("remote image timeout"));
    }, timeoutMs);
    request.once("error", (error) => {
      clearTimeout(timer);
      reject(
        timedOut
          ? new RemoteImageError("timeout", "The image download timed out.")
          : new RemoteImageError(
              "download_failed",
              `The image download failed: ${error.name}`,
            ),
      );
    });
    request.end();
  });
}

const defaultDependencies: RemoteImageDependencies = {
  resolveHost,
  request: requestPinnedAddress,
};

function normalizeMimeType(value: string | undefined) {
  return value?.split(";", 1)[0]?.trim().toLowerCase();
}

function redirectStatus(status: number) {
  return [301, 302, 303, 307, 308].includes(status);
}

export async function downloadRemoteArticleImage(
  input: { downloadUrl: string; declaredMimeType?: string },
  dependencies: RemoteImageDependencies = defaultDependencies,
) {
  let url = validateRemoteImageUrl(input.downloadUrl);
  let redirects = 0;

  while (true) {
    let addresses: ResolvedAddress[];
    try {
      addresses = await dependencies.resolveHost(url.hostname);
    } catch (error) {
      if (error instanceof RemoteImageError) throw error;
      throw new RemoteImageError(
        "unsafe_source",
        "The image host could not be resolved safely.",
      );
    }
    assertPublicAddresses(addresses);

    const response = await dependencies.request(url, addresses[0], 10_000);
    if (redirectStatus(response.statusCode)) {
      response.destroy();
      const location = response.headers.location;
      if (!location || redirects >= 3) {
        throw new RemoteImageError(
          "download_failed",
          "The image download exceeded the redirect limit.",
        );
      }
      url = validateRemoteImageUrl(new URL(location, url).href);
      redirects += 1;
      continue;
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      response.destroy();
      throw new RemoteImageError(
        "download_failed",
        "The image server did not return a successful response.",
      );
    }

    const contentEncoding = normalizeMimeType(
      response.headers["content-encoding"],
    );
    if (contentEncoding && contentEncoding !== "identity") {
      response.destroy();
      throw new RemoteImageError(
        "download_failed",
        "Encoded image responses are not accepted.",
      );
    }

    const contentLengthValue = response.headers["content-length"];
    if (contentLengthValue) {
      const contentLength = Number(contentLengthValue);
      if (!Number.isSafeInteger(contentLength) || contentLength < 0) {
        response.destroy();
        throw new RemoteImageError(
          "download_failed",
          "The image server returned an invalid content length.",
        );
      }
      if (contentLength > MAX_ARTICLE_IMAGE_BYTES) {
        response.destroy();
        throw new RemoteImageError(
          "too_large",
          "The image exceeds the 8 MB limit.",
        );
      }
    }

    const chunks: Buffer[] = [];
    let size = 0;
    try {
      for await (const chunk of response.body) {
        const bytes = Buffer.from(chunk);
        size += bytes.byteLength;
        if (size > MAX_ARTICLE_IMAGE_BYTES) {
          response.destroy();
          throw new RemoteImageError(
            "too_large",
            "The image exceeds the 8 MB limit.",
          );
        }
        chunks.push(bytes);
      }
    } catch (error) {
      if (error instanceof RemoteImageError) throw error;
      throw new RemoteImageError(
        "download_failed",
        "The image response could not be read.",
      );
    }

    const bytes = Buffer.concat(chunks, size);
    const detected = detectArticleImage(bytes);
    const responseMimeType = normalizeMimeType(
      response.headers["content-type"],
    );
    const declaredMimeType = normalizeMimeType(input.declaredMimeType);
    if (
      (responseMimeType && responseMimeType !== detected.contentType) ||
      (declaredMimeType && declaredMimeType !== detected.contentType)
    ) {
      throw new RemoteImageError(
        "mime_mismatch",
        "The image content does not match its declared file type.",
      );
    }

    return { bytes, contentType: detected.contentType };
  }
}
