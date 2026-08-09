"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { usePathname } from "next/navigation";
import { RotateCcw, X } from "lucide-react";
import {
  bippyStateTimeouts,
  transitionBippy,
  type BippyEvent,
  type BippyState,
} from "@/components/bippy/bippy-machine";
import {
  resolveBippyPosition,
  type BippyMovementOptions,
  type BippyPoint,
  type BippySafeZone,
} from "@/components/bippy/bippy-movement";
import { BippySprite } from "@/components/bippy/bippy-sprite";
import styles from "@/components/bippy/bippy.module.css";
import { useReducedMotion } from "@/components/bippy/use-reduced-motion";
import { Button } from "@/components/ui/button";

const POSITION_STORAGE_KEY = "bippy-position-v1";
const DESKTOP_SIZE = 128;
const MOBILE_SIZE = 96;
const EDGE_GAP = 16;
const ARRIVAL_DISTANCE = 3;
const DRAG_THRESHOLD = 4;
const INACTIVITY_MS = 25_000;
const MOBILE_VIEWPORT_QUERY = "(max-width: 480px)";
const MOBILE_SAFE_ZONE_PADDING = 8;
const DESKTOP_MOVEMENT_OPTIONS: BippyMovementOptions = {
  insets: { top: 96, right: 8, bottom: 8, left: 8 },
  safeZoneGap: 12,
};
const MOBILE_MOVEMENT_OPTIONS: BippyMovementOptions = {
  insets: { top: 92, right: 12, bottom: 20, left: 12 },
  safeZoneGap: 16,
};
const BIPPY_COPY = {
  welcome: "Hi, I’m Bippy. Welcome.",
  projects: "Let’s explore the projects.",
  projectOpened: "Nice choice!",
} as const;

type DragSession = {
  pointerId: number;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
  moved: boolean;
};

type SavedPosition = { x: number; y: number };
type CompanionMessage = {
  text: string;
};

function isMobileViewport() {
  return window.matchMedia(MOBILE_VIEWPORT_QUERY).matches;
}

function companionSize() {
  return isMobileViewport() ? MOBILE_SIZE : DESKTOP_SIZE;
}

function viewportBounds() {
  return {
    width: window.visualViewport?.width ?? window.innerWidth,
    height: window.visualViewport?.height ?? window.innerHeight,
  };
}

function readSafeZones(padding = 0): BippySafeZone[] {
  const bounds = viewportBounds();

  return Array.from(
    document.querySelectorAll<HTMLElement>("[data-bippy-safe-zone]"),
  )
    .map((element) => element.getBoundingClientRect())
    .filter(
      (rect) =>
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < bounds.height &&
        rect.left < bounds.width,
    )
    .map((rect) => ({
      x: rect.left - padding,
      y: rect.top - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    }));
}

function parseSavedPosition(value: string | null): SavedPosition | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<SavedPosition>;
    if (
      typeof parsed.x === "number" &&
      Number.isFinite(parsed.x) &&
      parsed.x >= 0 &&
      parsed.x <= 1 &&
      typeof parsed.y === "number" &&
      Number.isFinite(parsed.y) &&
      parsed.y >= 0 &&
      parsed.y <= 1
    ) {
      return { x: parsed.x, y: parsed.y };
    }
  } catch {
    return null;
  }

  return null;
}

function BippyCompanionSurface({ pathname }: { pathname: string }) {
  const actorRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<BippyPoint>({ x: 0, y: 0 });
  const targetRef = useRef<BippyPoint>({ x: 0, y: 0 });
  const stateRef = useRef<BippyState>("idle");
  const lastActivityRef = useRef(0);
  const dragRef = useRef<DragSession | null>(null);
  const movingRef = useRef(false);
  const suppressActivationRef = useRef(false);
  const hasCustomPositionRef = useRef(false);
  const seenSectionsRef = useRef(new Set<string>());
  const previousPathRef = useRef(pathname);
  const messageTimeoutRef = useRef<number | null>(null);
  const [state, setState] = useState<BippyState>("idle");
  const [facing, setFacing] = useState<1 | -1>(1);
  const [pageVisible, setPageVisible] = useState(true);
  const [message, setMessage] = useState<CompanionMessage | null>(null);
  const reducedMotion = useReducedMotion();

  const send = useCallback((event: BippyEvent) => {
    setState((current) => transitionBippy(current, event));
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const resolveTarget = useCallback((requested: BippyPoint) => {
    const mobile = isMobileViewport();
    return resolveBippyPosition(
      requested,
      viewportBounds(),
      companionSize(),
      readSafeZones(mobile ? MOBILE_SAFE_ZONE_PADDING : 0),
      mobile ? MOBILE_MOVEMENT_OPTIONS : DESKTOP_MOVEMENT_OPTIONS,
    );
  }, []);

  const place = useCallback((point: BippyPoint) => {
    positionRef.current = point;
    targetRef.current = point;
    if (actorRef.current) {
      const bounds = viewportBounds();
      const size = companionSize();
      const bubbleWidth = isMobileViewport() ? 184 : 204;
      const bubbleLeft = point.x + size / 2 - bubbleWidth / 2;
      const clampedBubbleLeft = Math.min(
        Math.max(bubbleLeft, 12),
        Math.max(bounds.width - bubbleWidth - 12, 12),
      );
      actorRef.current.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
      actorRef.current.style.setProperty(
        "--bippy-bubble-shift",
        `${clampedBubbleLeft - bubbleLeft}px`,
      );
      actorRef.current.style.visibility = "visible";
    }
  }, []);

  const dismissMessage = useCallback(() => {
    if (messageTimeoutRef.current !== null) {
      window.clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = null;
    }
    setMessage(null);
  }, []);

  const showMessage = useCallback(
    (text: string, duration: number) => {
      if (messageTimeoutRef.current !== null) {
        window.clearTimeout(messageTimeoutRef.current);
      }
      setMessage({ text });
      messageTimeoutRef.current = window.setTimeout(() => {
        dismissMessage();
      }, duration);
    },
    [dismissMessage],
  );

  const placeFromSavedPosition = useCallback(
    (saved: SavedPosition) => {
      const size = companionSize();
      const bounds = viewportBounds();
      place(
        resolveTarget({
          x: saved.x * Math.max(bounds.width - size, 0),
          y: saved.y * Math.max(bounds.height - size, 0),
        }),
      );
    },
    [place, resolveTarget],
  );

  const placeAtDefault = useCallback(() => {
    const size = companionSize();
    const bounds = viewportBounds();
    place(
      resolveTarget({
        x: Math.max(bounds.width - size - EDGE_GAP, 0),
        y: Math.max(bounds.height - size - EDGE_GAP, 0),
      }),
    );
  }, [place, resolveTarget]);

  const returnToRestingPosition = useCallback(() => {
    const persisted = parseSavedPosition(
      window.localStorage.getItem(POSITION_STORAGE_KEY),
    );
    lastActivityRef.current = Date.now();
    movingRef.current = false;
    if (hasCustomPositionRef.current && persisted) {
      placeFromSavedPosition(persisted);
    } else {
      placeAtDefault();
    }
  }, [placeAtDefault, placeFromSavedPosition]);

  useEffect(() => {
    lastActivityRef.current = Date.now();
    const saved = parseSavedPosition(
      window.localStorage.getItem(POSITION_STORAGE_KEY),
    );
    hasCustomPositionRef.current = Boolean(saved);
    if (saved) placeFromSavedPosition(saved);
    else placeAtDefault();

    const resize = () => {
      const persisted = parseSavedPosition(
        window.localStorage.getItem(POSITION_STORAGE_KEY),
      );
      if (hasCustomPositionRef.current && persisted) {
        placeFromSavedPosition(persisted);
      } else {
        placeAtDefault();
      }
    };

    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
    };
  }, [placeAtDefault, placeFromSavedPosition]);

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current !== null) {
        window.clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const welcomeDelay = window.setTimeout(() => {
      showMessage(BIPPY_COPY.welcome, 4_500);
    }, 600);
    return () => window.clearTimeout(welcomeDelay);
  }, [showMessage]);

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
    let scrolling = false;
    let scrollEnd = 0;

    const restoreOnScroll = () => {
      if (!scrolling) {
        scrolling = true;
        returnToRestingPosition();
      }

      window.clearTimeout(scrollEnd);
      scrollEnd = window.setTimeout(() => {
        scrolling = false;
      }, 250);
    };

    window.addEventListener("scroll", restoreOnScroll, { passive: true });
    return () => {
      window.clearTimeout(scrollEnd);
      window.removeEventListener("scroll", restoreOnScroll);
    };
  }, [returnToRestingPosition]);

  useEffect(() => {
    const inactivity = window.setInterval(() => {
      if (
        pageVisible &&
        stateRef.current !== "sleep" &&
        stateRef.current !== "dragging" &&
        Date.now() - lastActivityRef.current >= INACTIVITY_MS
      ) {
        movingRef.current = false;
        send({ type: "INACTIVITY" });
      }
    }, 1_000);
    return () => window.clearInterval(inactivity);
  }, [pageVisible, send]);

  useEffect(() => {
    if (reducedMotion) return;
    const autonomous = window.setInterval(() => {
      if (
        !pageVisible ||
        stateRef.current !== "idle" ||
        Date.now() - lastActivityRef.current < 4_000
      ) {
        return;
      }

      if (Math.random() < 0.3) {
        movingRef.current = false;
        send({ type: "START_WORK" });
        return;
      }

      const size = companionSize();
      const bounds = viewportBounds();
      targetRef.current = resolveTarget({
        x: Math.random() * Math.max(bounds.width - size, 0),
        y: Math.random() * Math.max(bounds.height - size, 0),
      });
      movingRef.current = true;
      send({ type: "WANDER" });
    }, 7_000);
    return () => window.clearInterval(autonomous);
  }, [pageVisible, reducedMotion, resolveTarget, send]);

  useEffect(() => {
    let frame = 0;
    let previous = performance.now();

    const animate = (now: number) => {
      frame = window.requestAnimationFrame(animate);
      if (
        !pageVisible ||
        reducedMotion ||
        stateRef.current !== "curious" ||
        !movingRef.current
      ) {
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
        movingRef.current = false;
        place(target);
        send({ type: "ARRIVED" });
        return;
      }

      const step = Math.min(1.25 * elapsed, distance);
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

  useEffect(() => {
    const reactTo = (element: HTMLElement) => {
      lastActivityRef.current = Date.now();
      movingRef.current = false;
      if (element.dataset.bippyReaction === "working") {
        send({ type: "START_WORK" });
      } else {
        send({ type: "NOTICE" });
      }
    };

    const pointerOver = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>(
        "[data-bippy-reaction]",
      );
      if (!target) return;
      if (
        event.relatedTarget instanceof Node &&
        target.contains(event.relatedTarget)
      ) {
        return;
      }
      reactTo(target);
    };

    const focusIn = (event: FocusEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>(
        "[data-bippy-reaction]",
      );
      if (target) reactTo(target);
    };

    const click = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>(
        "[data-bippy-reaction]",
      );
      if (target) {
        lastActivityRef.current = Date.now();
        movingRef.current = false;
        if (target.hasAttribute("data-bippy-project")) {
          send({ type: "RESET" });
          showMessage(BIPPY_COPY.projectOpened, 2_000);
        }
        send({ type: "ACTIVATE" });
      }
    };

    document.addEventListener("pointerover", pointerOver);
    document.addEventListener("focusin", focusIn);
    document.addEventListener("click", click);
    return () => {
      document.removeEventListener("pointerover", pointerOver);
      document.removeEventListener("focusin", focusIn);
      document.removeEventListener("click", click);
    };
  }, [send, showMessage]);

  useEffect(() => {
    if (pathname !== "/") return;
    seenSectionsRef.current.clear();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.25) continue;
          const section = (entry.target as HTMLElement).dataset.bippySection;
          if (!section || seenSectionsRef.current.has(section)) continue;

          seenSectionsRef.current.add(section);
          lastActivityRef.current = Date.now();
          movingRef.current = false;
          if (section === "recognitions") {
            send({ type: "ACTIVATE" });
          } else if (section === "stack") {
            send({ type: "START_WORK" });
          } else {
            send({ type: "NOTICE" });
          }
        }
      },
      { threshold: [0.25], rootMargin: "-10% 0px" },
    );

    const observedSections = new Set<HTMLElement>();
    const observeSections = () => {
      document
        .querySelectorAll<HTMLElement>("[data-bippy-section]")
        .forEach((section) => {
          if (observedSections.has(section)) return;
          observedSections.add(section);
          observer.observe(section);
        });
    };

    let scanFrame = 0;
    const scheduleScan = () => {
      if (scanFrame) return;
      scanFrame = window.requestAnimationFrame(() => {
        scanFrame = 0;
        observeSections();
      });
    };

    observeSections();
    const mutations = new MutationObserver(scheduleScan);
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.cancelAnimationFrame(scanFrame);
      mutations.disconnect();
      observer.disconnect();
    };
  }, [pathname, send]);

  useEffect(() => {
    const routeChanged = previousPathRef.current !== pathname;
    let routeUpdateDelay: number | undefined;
    movingRef.current = false;

    if (pathname === "/projects") {
      lastActivityRef.current = Date.now();
      routeUpdateDelay = window.setTimeout(() => {
        send({ type: "RESET" });
        send({ type: "NOTICE" });
        if (routeChanged) showMessage(BIPPY_COPY.projects, 2_800);
      }, 0);
    } else if (routeChanged) {
      routeUpdateDelay = window.setTimeout(() => send({ type: "RESET" }), 0);
    }

    previousPathRef.current = pathname;
    return () => window.clearTimeout(routeUpdateDelay);
  }, [pathname, send, showMessage]);

  function startDragging(event: ReactPointerEvent<HTMLButtonElement>) {
    const actor = actorRef.current;
    if (!actor) return;
    const rect = actor.getBoundingClientRect();
    lastActivityRef.current = Date.now();
    movingRef.current = false;
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    send({ type: "DRAG_START" });
  }

  function moveDraggedBippy(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (
      Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >=
      DRAG_THRESHOLD
    ) {
      drag.moved = true;
    }

    const current = positionRef.current;
    const next = resolveTarget({
      x: event.clientX - drag.offsetX,
      y: event.clientY - drag.offsetY,
    });
    place(next);
    if (Math.abs(next.x - current.x) > 1) {
      setFacing(next.x < current.x ? -1 : 1);
    }
  }

  function stopDragging(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    suppressActivationRef.current = drag.moved;
    lastActivityRef.current = Date.now();
    send({ type: "DRAG_END" });

    const size = companionSize();
    const bounds = viewportBounds();
    const maxX = Math.max(bounds.width - size, 1);
    const maxY = Math.max(bounds.height - size, 1);
    const saved = {
      x: Math.min(Math.max(positionRef.current.x / maxX, 0), 1),
      y: Math.min(Math.max(positionRef.current.y / maxY, 0), 1),
    };
    try {
      window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(saved));
      hasCustomPositionRef.current = true;
    } catch {
      hasCustomPositionRef.current = false;
    }
    window.setTimeout(() => {
      suppressActivationRef.current = false;
    }, 0);
  }

  function activate() {
    if (suppressActivationRef.current) return;
    lastActivityRef.current = Date.now();
    movingRef.current = false;
    send({ type: "ACTIVATE" });
  }

  function celebrateOnHover() {
    lastActivityRef.current = Date.now();
    movingRef.current = false;
    send({ type: "ACTIVATE" });
  }

  function resetPosition() {
    window.localStorage.removeItem(POSITION_STORAGE_KEY);
    hasCustomPositionRef.current = false;
    lastActivityRef.current = Date.now();
    movingRef.current = false;
    placeAtDefault();
    send({ type: "RESET" });
  }

  return (
    <div
      ref={actorRef}
      className={styles.companionActor}
      onPointerMove={moveDraggedBippy}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      onPointerEnter={celebrateOnHover}
      data-testid="bippy-companion"
    >
      <div className={styles.companionScale}>
        <BippySprite
          state={state}
          facing={facing}
          reducedMotion={reducedMotion}
          pageVisible={pageVisible}
          onActivate={activate}
          onPointerDown={startDragging}
        />
      </div>
      {message ? (
        <div
          className={styles.companionMessage}
          role="status"
          aria-live="polite"
          data-testid="bippy-message"
        >
          <p>{message.text}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={styles.companionMessageDismiss}
            aria-label="Dismiss Bippy message"
            onClick={dismissMessage}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      ) : null}
      <div
        className={styles.companionControls}
        role="group"
        aria-label="Bippy controls"
        data-testid="bippy-companion-controls"
      >
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          className="bg-background/90"
          aria-label="Reset Bippy position"
          title="Reset Bippy position"
          onClick={resetPosition}
        >
          <RotateCcw aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

export function BippyCompanion({ enabled = true }: { enabled?: boolean }) {
  const pathname = usePathname();
  if (!enabled || (pathname !== "/" && pathname !== "/projects")) return null;
  return <BippyCompanionSurface pathname={pathname} />;
}
