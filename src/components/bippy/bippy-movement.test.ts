import { describe, expect, it } from "vitest";
import {
  clampBippyPosition,
  resolveBippyPosition,
} from "@/components/bippy/bippy-movement";

const bounds = { width: 500, height: 400 };

describe("Bippy movement", () => {
  it("keeps Bippy inside the playground", () => {
    expect(clampBippyPosition({ x: -40, y: 390 }, bounds, 64)).toEqual({
      x: 0,
      y: 336,
    });
  });

  it("moves Bippy around protected interface zones", () => {
    const zone = { x: 180, y: 120, width: 140, height: 80 };
    const resolved = resolveBippyPosition({ x: 210, y: 130 }, bounds, 64, [
      zone,
    ]);

    const clearsHorizontally =
      resolved.x + 64 <= zone.x || resolved.x >= zone.x + zone.width;
    const clearsVertically =
      resolved.y + 64 <= zone.y || resolved.y >= zone.y + zone.height;

    expect(clearsHorizontally || clearsVertically).toBe(true);
  });

  it("keeps mobile controls and the actor away from viewport edges", () => {
    const resolved = clampBippyPosition(
      { x: 500, y: -20 },
      { width: 390, height: 844 },
      96,
      { top: 40, right: 12, bottom: 20, left: 12 },
    );

    expect(resolved).toEqual({ x: 282, y: 40 });
  });

  it("finds an open mobile position when immediate zone exits are blocked", () => {
    const mobileBounds = { width: 390, height: 844 };
    const zones = [
      { x: 250, y: 600, width: 140, height: 120 },
      { x: 140, y: 720, width: 250, height: 124 },
    ];
    const resolved = resolveBippyPosition(
      { x: 282, y: 728 },
      mobileBounds,
      96,
      zones,
      {
        insets: { top: 40, right: 12, bottom: 20, left: 12 },
        safeZoneGap: 16,
      },
    );

    expect(resolved.x).toBeGreaterThanOrEqual(12);
    expect(resolved.x + 96).toBeLessThanOrEqual(378);
    expect(resolved.y).toBeGreaterThanOrEqual(40);
    expect(resolved.y + 96).toBeLessThanOrEqual(824);
    expect(
      zones.every(
        (zone) =>
          resolved.x + 96 <= zone.x - 16 ||
          resolved.x >= zone.x + zone.width + 16 ||
          resolved.y + 96 <= zone.y - 16 ||
          resolved.y >= zone.y + zone.height + 16,
      ),
    ).toBe(true);
  });
});
