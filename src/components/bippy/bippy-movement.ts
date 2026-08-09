export type BippyPoint = { x: number; y: number };
export type BippyBounds = { width: number; height: number };
export type BippySafeZone = BippyPoint & BippyBounds;
export type BippyInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};
export type BippyMovementOptions = {
  insets?: Partial<BippyInsets>;
  safeZoneGap?: number;
};

const SAFE_ZONE_GAP = 12;
const ZERO_INSETS: BippyInsets = { top: 0, right: 0, bottom: 0, left: 0 };

function normalizeInsets(insets?: Partial<BippyInsets>): BippyInsets {
  return { ...ZERO_INSETS, ...insets };
}

function overlaps(point: BippyPoint, actorSize: number, zone: BippySafeZone) {
  return (
    point.x < zone.x + zone.width &&
    point.x + actorSize > zone.x &&
    point.y < zone.y + zone.height &&
    point.y + actorSize > zone.y
  );
}

export function clampBippyPosition(
  point: BippyPoint,
  bounds: BippyBounds,
  actorSize: number,
  insets?: Partial<BippyInsets>,
): BippyPoint {
  const resolvedInsets = normalizeInsets(insets);
  const minX = Math.min(resolvedInsets.left, bounds.width);
  const minY = Math.min(resolvedInsets.top, bounds.height);
  const maxX = Math.max(bounds.width - actorSize - resolvedInsets.right, minX);
  const maxY = Math.max(
    bounds.height - actorSize - resolvedInsets.bottom,
    minY,
  );

  return {
    x: Math.min(Math.max(point.x, minX), maxX),
    y: Math.min(Math.max(point.y, minY), maxY),
  };
}

function findNearestOpenPosition(
  requested: BippyPoint,
  bounds: BippyBounds,
  actorSize: number,
  safeZones: BippySafeZone[],
  insets: Partial<BippyInsets> | undefined,
) {
  const resolvedInsets = normalizeInsets(insets);
  const minX = Math.min(resolvedInsets.left, bounds.width);
  const minY = Math.min(resolvedInsets.top, bounds.height);
  const maxX = Math.max(bounds.width - actorSize - resolvedInsets.right, minX);
  const maxY = Math.max(
    bounds.height - actorSize - resolvedInsets.bottom,
    minY,
  );
  const step = Math.max(Math.floor(actorSize / 2), 24);
  const candidates: BippyPoint[] = [];

  for (let y = minY; y <= maxY; y += step) {
    for (let x = minX; x <= maxX; x += step) {
      candidates.push({ x, y });
    }
    candidates.push({ x: maxX, y });
  }
  for (let x = minX; x <= maxX; x += step) {
    candidates.push({ x, y: maxY });
  }
  candidates.push({ x: maxX, y: maxY });

  return candidates
    .filter((candidate) =>
      safeZones.every((zone) => !overlaps(candidate, actorSize, zone)),
    )
    .sort(
      (a, b) =>
        Math.hypot(a.x - requested.x, a.y - requested.y) -
        Math.hypot(b.x - requested.x, b.y - requested.y),
    )[0];
}

export function resolveBippyPosition(
  requested: BippyPoint,
  bounds: BippyBounds,
  actorSize: number,
  safeZones: BippySafeZone[],
  options: BippyMovementOptions = {},
): BippyPoint {
  const safeZoneGap = options.safeZoneGap ?? SAFE_ZONE_GAP;
  let point = clampBippyPosition(requested, bounds, actorSize, options.insets);

  for (const zone of safeZones) {
    if (!overlaps(point, actorSize, zone)) continue;

    const candidates = [
      { x: zone.x - actorSize - safeZoneGap, y: point.y },
      { x: zone.x + zone.width + safeZoneGap, y: point.y },
      { x: point.x, y: zone.y - actorSize - safeZoneGap },
      { x: point.x, y: zone.y + zone.height + safeZoneGap },
    ]
      .map((candidate) =>
        clampBippyPosition(candidate, bounds, actorSize, options.insets),
      )
      .filter((candidate) =>
        safeZones.every(
          (candidateZone) => !overlaps(candidate, actorSize, candidateZone),
        ),
      )
      .sort(
        (a, b) =>
          Math.hypot(a.x - requested.x, a.y - requested.y) -
          Math.hypot(b.x - requested.x, b.y - requested.y),
      );

    point = candidates[0] ?? point;
  }

  if (safeZones.every((zone) => !overlaps(point, actorSize, zone))) {
    return point;
  }

  return (
    findNearestOpenPosition(
      requested,
      bounds,
      actorSize,
      safeZones,
      options.insets,
    ) ?? point
  );
}
