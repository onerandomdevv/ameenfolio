import { describe, expect, it } from "vitest";
import { describeSessionDevice, maskSessionIp } from "./session-display";

describe("admin session display", () => {
  it("describes common desktop and mobile user agents", () => {
    expect(
      describeSessionDevice(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36 Edg/140.0",
      ),
    ).toMatchObject({
      browser: "Microsoft Edge",
      operatingSystem: "Windows",
      kind: "desktop",
      label: "Microsoft Edge on Windows",
    });

    expect(
      describeSessionDevice(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
      ),
    ).toMatchObject({
      browser: "Safari",
      operatingSystem: "iOS",
      kind: "mobile",
    });
  });

  it("does not expose complete IP addresses", () => {
    expect(maskSessionIp("102.89.44.17")).toBe("102.89.44.•••");
    expect(maskSessionIp("2001:db8:85a3::8a2e:370:7334")).toBe(
      "2001:db8:85a3:…",
    );
    expect(maskSessionIp(null)).toBeNull();
  });
});
