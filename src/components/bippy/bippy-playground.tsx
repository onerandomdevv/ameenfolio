"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  bippyStateTimeouts,
  transitionBippy,
  type BippyEvent,
  type BippyState,
} from "@/components/bippy/bippy-machine";
import {
  resolveBippyPosition,
  type BippyPoint,
  type BippySafeZone,
} from "@/components/bippy/bippy-movement";
import { BippySprite } from "@/components/bippy/bippy-sprite";
import styles from "@/components/bippy/bippy.module.css";
import { useReducedMotion } from "@/components/bippy/use-reduced-motion";

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
  const reducedMotion = useReducedMotion();

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

  const placeAtStart = useCallback(() => {
    const arena = arenaRef.current;
    if (!arena) return;
    const size = actorSize();
    place(
      resolveTarget({
        x: Math.max((arena.clientWidth - size) / 2, 0),
        y: Math.max(arena.clientHeight - size - 24, 0),
      }),
    );
  }, [place, resolveTarget]);

  useEffect(() => {
    placeAtStart();
    const resize = () => place(resolveTarget(positionRef.current));
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [place, placeAtStart, resolveTarget]);

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
    if (reducedMotion) return;
    let frame = 0;
    let previous = performance.now();

    const animate = (now: number) => {
      frame = window.requestAnimationFrame(animate);
      const activeState = stateRef.current;
      if (!pageVisible || activeState !== "curious") {
        previous = now;
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
        if (activeState === "curious") send({ type: "ARRIVED" });
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
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [pageVisible, place, reducedMotion, send]);

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
      Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >=
      DRAG_THRESHOLD
    ) {
      drag.moved = true;
    }

    const arenaRect = arena.getBoundingClientRect();
    const current = positionRef.current;
    const next = resolveTarget({
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

  return (
    <section aria-labelledby="playground-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" aria-label={`Current state: ${state}`}>
            {state}
          </Badge>
          {reducedMotion ? (
            <Badge variant="outline">Reduced motion</Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Bippy controls">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => send({ type: "ACTIVATE" })}
          >
            Celebrate
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => send({ type: "START_WORK" })}
          >
            Work
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => send({ type: "INACTIVITY" })}
          >
            Nap
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={reset}>
            Reset
          </Button>
        </div>
      </div>

      <div
        ref={arenaRef}
        className="relative min-h-[32rem] overflow-hidden rounded-lg border border-white/10 bg-[#050505] sm:min-h-[38rem]"
        onPointerMove={moveDraggedBippy}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        data-testid="bippy-arena"
      >
        <div
          data-bippy-safe-zone
          className="pointer-events-none absolute top-5 left-5 max-w-52 rounded-md border border-dashed border-white/10 bg-black/60 p-3 text-xs leading-5 text-muted-foreground"
        >
          <h2 id="playground-heading" className="font-medium text-foreground">
            Bippy playground
          </h2>
          Hold and drag Bippy to reposition him. This panel is a protected safe
          zone.
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

      <p className="sr-only" aria-live="polite">
        Bippy is now {state}.
      </p>
    </section>
  );
}
