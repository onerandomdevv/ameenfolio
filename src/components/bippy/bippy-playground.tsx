"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Activity,
  Gauge,
  Laptop,
  Moon,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  bippyStateTimeouts,
  transitionBippy,
  type BippyEvent,
  type BippyState,
} from "@/components/bippy/bippy-machine";
import {
  clampBippyPosition,
  resolveBippyPosition,
  type BippyPoint,
  type BippySafeZone,
} from "@/components/bippy/bippy-movement";
import {
  bippySpriteAssets,
  BippySprite,
} from "@/components/bippy/bippy-sprite";
import styles from "@/components/bippy/bippy.module.css";
import { useBippyPerformance } from "@/components/bippy/use-bippy-performance";
import { useReducedMotion } from "@/components/bippy/use-reduced-motion";
import { cn } from "@/lib/utils";

const ACTOR_SIZE = 128;
const INACTIVITY_MS = 12_000;
const ARRIVAL_DISTANCE = 3;
const DRAG_THRESHOLD = 4;

type DragSession = {
  pointerId: number;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
  moved: boolean;
};

function actorSize() {
  return ACTOR_SIZE;
}

function readSafeZones(arena: HTMLElement): BippySafeZone[] {
  const arenaRect = arena.getBoundingClientRect();
  return Array.from(
    arena.querySelectorAll<HTMLElement>("[data-bippy-safe-zone]"),
  ).map((element) => {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left - arenaRect.left,
      y: rect.top - arenaRect.top,
      width: rect.width,
      height: rect.height,
    };
  });
}

export function BippyPlayground() {
  const arenaRef = useRef<HTMLDivElement>(null);
  const actorRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<BippyPoint>({ x: 0, y: 0 });
  const targetRef = useRef<BippyPoint>({ x: 0, y: 0 });
  const stateRef = useRef<BippyState>("idle");
  const lastActivityRef = useRef(0);
  const dragRef = useRef<DragSession | null>(null);
  const suppressActivationRef = useRef(false);
  const [state, setState] = useState<BippyState>("idle");
  const [facing, setFacing] = useState<1 | -1>(1);
  const [pageVisible, setPageVisible] = useState(true);
  const [spriteStatus, setSpriteStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const reducedMotion = useReducedMotion();
  const performanceCheck = useBippyPerformance();

  useEffect(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const send = useCallback((event: BippyEvent) => {
    setState((current) => transitionBippy(current, event));
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const place = useCallback((point: BippyPoint) => {
    positionRef.current = point;
    targetRef.current = point;
    if (actorRef.current) {
      actorRef.current.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
    }
  }, []);

  const resolveTarget = useCallback((requested: BippyPoint) => {
    const arena = arenaRef.current;
    if (!arena) return requested;
    return resolveBippyPosition(
      requested,
      { width: arena.clientWidth, height: arena.clientHeight },
      actorSize(),
      readSafeZones(arena),
    );
  }, []);

  const constrainToArena = useCallback((requested: BippyPoint) => {
    const arena = arenaRef.current;
    if (!arena) return requested;
    return clampBippyPosition(
      requested,
      { width: arena.clientWidth, height: arena.clientHeight },
      actorSize(),
    );
  }, []);

  const placeAtStart = useCallback(() => {
    const arena = arenaRef.current;
    if (!arena) return;
    const size = actorSize();
    place(
      constrainToArena({
        x: Math.max((arena.clientWidth - size) / 2, 0),
        y: Math.max(arena.clientHeight - size - 24, 0),
      }),
    );
  }, [constrainToArena, place]);

  useEffect(() => {
    placeAtStart();
    const resize = () => place(constrainToArena(positionRef.current));
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [constrainToArena, place, placeAtStart]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      bippySpriteAssets.map(
        (asset) =>
          new Promise<boolean>((resolve) => {
            const image = new Image();
            image.onload = () => resolve(true);
            image.onerror = () => resolve(false);
            image.src = asset;
          }),
      ),
    ).then((loaded) => {
      if (!cancelled) {
        setSpriteStatus(loaded.every(Boolean) ? "ready" : "error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const activity = () => {
      lastActivityRef.current = Date.now();
      if (stateRef.current === "sleep") send({ type: "ACTIVITY" });
    };
    window.addEventListener("pointermove", activity, { passive: true });
    window.addEventListener("keydown", activity);
    window.addEventListener("touchstart", activity, { passive: true });
    return () => {
      window.removeEventListener("pointermove", activity);
      window.removeEventListener("keydown", activity);
      window.removeEventListener("touchstart", activity);
    };
  }, [send]);

  useEffect(() => {
    const updateVisibility = () => {
      const visible = document.visibilityState === "visible";
      setPageVisible(visible);
      if (visible) lastActivityRef.current = Date.now();
    };
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () =>
      document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    const duration = bippyStateTimeouts[state];
    if (!duration || !pageVisible) return;
    const timeout = window.setTimeout(
      () => send({ type: "STATE_TIMEOUT" }),
      duration,
    );
    return () => window.clearTimeout(timeout);
  }, [pageVisible, send, state]);

  useEffect(() => {
    const inactivity = window.setInterval(() => {
      if (
        pageVisible &&
        stateRef.current !== "sleep" &&
        stateRef.current !== "dragging" &&
        stateRef.current !== "moving" &&
        Date.now() - lastActivityRef.current >= INACTIVITY_MS
      ) {
        send({ type: "INACTIVITY" });
      }
    }, 1_000);
    return () => window.clearInterval(inactivity);
  }, [pageVisible, send]);

  useEffect(() => {
    if (reducedMotion) return;
    const wander = window.setInterval(() => {
      const arena = arenaRef.current;
      if (
        !arena ||
        !pageVisible ||
        stateRef.current !== "idle" ||
        Date.now() - lastActivityRef.current < 3_000
      ) {
        return;
      }
      const size = actorSize();
      targetRef.current = resolveTarget({
        x: Math.random() * Math.max(arena.clientWidth - size, 0),
        y: Math.random() * Math.max(arena.clientHeight - size, 0),
      });
      send({ type: "WANDER" });
    }, 5_500);
    return () => window.clearInterval(wander);
  }, [pageVisible, reducedMotion, resolveTarget, send]);

  useEffect(() => {
    if (reducedMotion || !pageVisible || state !== "moving") return;
    let frame = 0;
    let previous = performance.now();

    const animate = (now: number) => {
      const activeState = stateRef.current;
      if (!pageVisible || activeState !== "moving" || dragRef.current) {
        return;
      }

      const elapsed = Math.min((now - previous) / 16.67, 2);
      previous = now;
      const current = positionRef.current;
      const target = targetRef.current;
      const dx = target.x - current.x;
      const dy = target.y - current.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= ARRIVAL_DISTANCE) {
        place(target);
        if (activeState === "moving") send({ type: "ARRIVED" });
        return;
      }

      const speed = 1.4;
      const step = Math.min(speed * elapsed, distance);
      const next = {
        x: current.x + (dx / distance) * step,
        y: current.y + (dy / distance) * step,
      };
      positionRef.current = next;
      if (actorRef.current) {
        actorRef.current.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`;
      }
      setFacing(dx < 0 ? -1 : 1);
      frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [pageVisible, place, reducedMotion, send, state]);

  function startDragging(event: ReactPointerEvent<HTMLButtonElement>) {
    const arena = arenaRef.current;
    const actor = actorRef.current;
    if (!arena || !actor) return;

    const actorRect = actor.getBoundingClientRect();
    lastActivityRef.current = Date.now();
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - actorRect.left,
      offsetY: event.clientY - actorRect.top,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    send({ type: "DRAG_START" });
  }

  function moveDraggedBippy(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const arena = arenaRef.current;
    if (!drag || !arena || event.pointerId !== drag.pointerId) return;

    if (
      !drag.moved &&
      Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >=
        DRAG_THRESHOLD
    ) {
      drag.moved = true;
      send({ type: "DRAG_MOVE" });
    }

    const arenaRect = arena.getBoundingClientRect();
    const current = positionRef.current;
    const next = constrainToArena({
      x: event.clientX - arenaRect.left - drag.offsetX,
      y: event.clientY - arenaRect.top - drag.offsetY,
    });
    place(next);
    if (Math.abs(next.x - current.x) > 1) {
      setFacing(next.x < current.x ? -1 : 1);
    }
  }

  function stopDragging(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;

    suppressActivationRef.current = drag.moved;
    dragRef.current = null;
    lastActivityRef.current = Date.now();
    send({ type: "DRAG_END" });
    window.setTimeout(() => {
      suppressActivationRef.current = false;
    }, 0);
  }

  function activate() {
    if (suppressActivationRef.current) return;
    send({ type: "ACTIVATE" });
  }

  function reset() {
    lastActivityRef.current = Date.now();
    send({ type: "RESET" });
    placeAtStart();
  }

  const ratingCopy = performanceCheck.result
    ? {
        good: "Good",
        fair: "Fair",
        "needs-attention": "Needs attention",
      }[performanceCheck.result.rating]
    : "Not tested";

  return (
    <section aria-labelledby="playground-heading">
      <Card className="gap-0 overflow-hidden rounded-md py-0 shadow-none">
        <CardHeader className="border-b px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle id="playground-heading">Bippy playground</CardTitle>
              <CardDescription>
                Test his states, movement, and runtime health.
              </CardDescription>
            </div>
            <Badge variant="secondary" aria-label={`Current state: ${state}`}>
              {state}
            </Badge>
          </div>
        </CardHeader>

        <div
          ref={arenaRef}
          className="relative h-[20rem] overflow-hidden bg-[#050505] sm:h-[24rem]"
          onPointerMove={moveDraggedBippy}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          onLostPointerCapture={stopDragging}
          data-testid="bippy-arena"
        >
          <div
            data-bippy-safe-zone
            className="pointer-events-none absolute top-4 left-4 max-w-48 border border-white/10 bg-black/70 px-3 py-2 text-xs leading-5 text-muted-foreground"
          >
            Hold and drag Bippy. He avoids this area while moving by himself.
          </div>

          <div ref={actorRef} className={styles.actor}>
            <BippySprite
              state={state}
              facing={facing}
              reducedMotion={reducedMotion}
              pageVisible={pageVisible}
              onActivate={activate}
              onPointerDown={startDragging}
            />
          </div>
        </div>

        <div
          className="grid grid-cols-2 gap-2 border-t p-3 sm:grid-cols-4 sm:p-4"
          aria-label="Bippy states"
        >
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-16 flex-col gap-1.5 rounded-md",
              state === "excited" && "border-primary/60 bg-primary/5",
            )}
            aria-pressed={state === "excited"}
            onClick={() => send({ type: "ACTIVATE" })}
          >
            <Sparkles aria-hidden="true" />
            Celebrate
          </Button>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-16 flex-col gap-1.5 rounded-md",
              state === "working" && "border-primary/60 bg-primary/5",
            )}
            aria-pressed={state === "working"}
            onClick={() => send({ type: "START_WORK" })}
          >
            <Laptop aria-hidden="true" />
            Work
          </Button>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-16 flex-col gap-1.5 rounded-md",
              state === "sleep" && "border-primary/60 bg-primary/5",
            )}
            aria-pressed={state === "sleep"}
            onClick={() => send({ type: "INACTIVITY" })}
          >
            <Moon aria-hidden="true" />
            Nap
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-16 flex-col gap-1.5 rounded-md"
            onClick={reset}
          >
            <RotateCcw aria-hidden="true" />
            Reset
          </Button>
        </div>

        <Separator />

        <CardContent className="space-y-4 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Gauge className="size-4 text-muted-foreground" aria-hidden />
              <div>
                <h3 className="text-sm font-medium">Performance</h3>
                <p className="text-xs text-muted-foreground">
                  A local check. No metrics are stored.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={performanceCheck.isRunning || !pageVisible}
              onClick={performanceCheck.runTest}
            >
              <Activity aria-hidden="true" />
              {performanceCheck.isRunning
                ? `Testing · ${performanceCheck.remainingSeconds}s`
                : "Run 10s check"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-4">
            <PerformanceMetric
              label="Live FPS"
              value={performanceCheck.fps ? String(performanceCheck.fps) : "—"}
            />
            <PerformanceMetric
              label="Frame time"
              value={
                performanceCheck.frameTime
                  ? `${performanceCheck.frameTime.toFixed(1)} ms`
                  : "—"
              }
            />
            <PerformanceMetric
              label="Sprites"
              value={
                spriteStatus === "ready"
                  ? "Ready"
                  : spriteStatus === "error"
                    ? "Load error"
                    : "Loading"
              }
            />
            <PerformanceMetric label="Result" value={ratingCopy} />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span>Loop: {state === "moving" ? "active" : "resting"}</span>
            <span>Tab: {pageVisible ? "visible" : "paused"}</span>
            <span>Motion: {reducedMotion ? "reduced" : "full"}</span>
            {performanceCheck.result ? (
              <>
                <span>
                  Average: {performanceCheck.result.averageFps.toFixed(0)} FPS
                </span>
                <span>
                  Slow frames:{" "}
                  {performanceCheck.result.slowFramePercentage.toFixed(1)}%
                </span>
              </>
            ) : null}
          </div>
        </CardContent>

        <p className="sr-only" aria-live="polite">
          Bippy is now {state}.
        </p>
      </Card>
    </section>
  );
}

function PerformanceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card px-3 py-3">
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
