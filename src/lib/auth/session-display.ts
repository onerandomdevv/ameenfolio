export type SessionDeviceKind = "desktop" | "mobile" | "tablet";

export type SessionDevice = {
  browser: string;
  operatingSystem: string;
  kind: SessionDeviceKind;
  label: string;
};

export function describeSessionDevice(
  userAgent?: string | null,
): SessionDevice {
  const agent = userAgent ?? "";

  const browser = /Edg\//.test(agent)
    ? "Microsoft Edge"
    : /OPR\//.test(agent)
      ? "Opera"
      : /CriOS\//.test(agent)
        ? "Chrome"
        : /FxiOS\//.test(agent)
          ? "Firefox"
          : /Chrome\//.test(agent)
            ? "Chrome"
            : /Firefox\//.test(agent)
              ? "Firefox"
              : /Safari\//.test(agent)
                ? "Safari"
                : "Unknown browser";

  const operatingSystem = /Windows NT/.test(agent)
    ? "Windows"
    : /Android/.test(agent)
      ? "Android"
      : /iPhone|iPad|iPod/.test(agent)
        ? "iOS"
        : /Mac OS X|Macintosh/.test(agent)
          ? "macOS"
          : /Linux/.test(agent)
            ? "Linux"
            : "Unknown system";

  const kind: SessionDeviceKind = /iPad|Tablet/.test(agent)
    ? "tablet"
    : /Mobi|Android|iPhone|iPod/.test(agent)
      ? "mobile"
      : "desktop";

  return {
    browser,
    operatingSystem,
    kind,
    label:
      browser === "Unknown browser" && operatingSystem === "Unknown system"
        ? "Unknown device"
        : `${browser} on ${operatingSystem}`,
  };
}

export function maskSessionIp(ipAddress?: string | null) {
  if (!ipAddress) return null;

  if (ipAddress.includes(":")) {
    const visible = ipAddress.split(":").filter(Boolean).slice(0, 3);
    return visible.length ? `${visible.join(":")}:…` : "IPv6 address";
  }

  const parts = ipAddress.split(".");
  if (parts.length !== 4) return "Private address";
  return `${parts.slice(0, 3).join(".")}.•••`;
}
