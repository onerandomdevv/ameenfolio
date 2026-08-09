"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import idleManifest from "../../../public/bippy/idle/bippy-idle.json";
import { Button } from "@/components/ui/button";
import type { BippyState } from "@/components/bippy/bippy-machine";
import styles from "@/components/bippy/bippy.module.css";
import { cn } from "@/lib/utils";

const staticFrames: Partial<Record<BippyState, number>> = {
  curious: 2,
};

const idleSprite = "/bippy/idle/bippy-idle.png";
const workingSprite = "/bippy/states/working.png";
const sleepSprite = "/bippy/states/sleep.png";
const excitedSprite = "/bippy/states/excited.png";
const movingSprite = "/bippy/states/moving.png";

export const bippySpriteAssets = [
  idleSprite,
  workingSprite,
  sleepSprite,
  excitedSprite,
  movingSprite,
] as const;

const stateSprites: Partial<Record<BippyState, string>> = {
  working: workingSprite,
  sleep: sleepSprite,
  excited: excitedSprite,
  moving: movingSprite,
};

const stateSequences: Record<BippyState, readonly number[]> = {
  idle: idleManifest.timeline.map((entry) => entry.frame),
  curious: [2],
  working: [0],
  excited: [0],
  sleep: [0],
  wake: [4, 2, 0],
  dragging: [0],
  moving: [0, 1, 2, 3],
};

export function BippySprite({
  state,
  facing,
  reducedMotion,
  pageVisible,
  onActivate,
  onPointerDown,
}: {
  state: BippyState;
  facing: 1 | -1;
  reducedMotion: boolean;
  pageVisible: boolean;
  onActivate: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
}) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    bippySpriteAssets.forEach((asset, index) => {
      const image = new Image();
      image.decoding = "async";
      image.fetchPriority = index === 0 ? "high" : "low";
      image.src = asset;
    });
  }, []);

  useEffect(() => {
    if (reducedMotion || !pageVisible) {
      return;
    }

    const sequence = stateSequences[state];
    let index = 0;
    let timeout: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const advance = () => {
      if (cancelled) return;
      const nextFrame = sequence[index % sequence.length] ?? 0;
      setFrame(nextFrame);
      const idleDuration = idleManifest.timeline.find(
        (entry) => entry.frame === nextFrame,
      )?.durationMs;
      const duration =
        state === "idle"
          ? (idleDuration ?? 180)
          : state === "moving"
            ? 90
            : 150;
      index += 1;
      timeout = setTimeout(advance, duration);
    };

    advance();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [pageVisible, reducedMotion, state]);

  const renderedSize = 128;
  const renderedFrame =
    reducedMotion || !pageVisible ? (staticFrames[state] ?? 0) : frame;
  const stateSprite = stateSprites[state];
  const renderedFacing = state === "working" || state === "sleep" ? 1 : facing;

  return (
    <Button
      type="button"
      variant="ghost"
      className={styles.button}
      aria-label="Activate Bippy"
      onClick={onActivate}
      onPointerDown={onPointerDown}
      data-testid="bippy"
      data-state={state}
    >
      <span className={cn(styles.motion, styles[state])}>
        <span
          className={styles.facing}
          style={{ "--bippy-facing": renderedFacing } as CSSProperties}
        >
          <span
            aria-hidden="true"
            className={cn(styles.sprite, stateSprite && styles.stateSprite)}
            style={
              stateSprite
                ? state === "moving"
                  ? {
                      backgroundImage: `url(${stateSprite})`,
                      backgroundPosition: `${-renderedFrame * renderedSize}px 0`,
                      backgroundSize: "512px 128px",
                    }
                  : {
                      backgroundImage: `url(${stateSprite})`,
                      backgroundPosition: "center",
                      backgroundSize: "contain",
                    }
                : {
                    backgroundPosition: `${-renderedFrame * renderedSize}px 0`,
                  }
            }
          >
            {state === "working" ? (
              <span className={styles.workingDetails}>
                <span
                  className={cn(styles.workingEye, styles.workingEyeLeft)}
                />
                <span
                  className={cn(styles.workingEye, styles.workingEyeRight)}
                />
                <span
                  className={cn(styles.typingHand, styles.typingHandLeft)}
                />
                <span
                  className={cn(styles.typingHand, styles.typingHandRight)}
                />
              </span>
            ) : null}
          </span>
        </span>
      </span>
    </Button>
  );
}
