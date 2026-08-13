"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, RotateCcw, X } from "lucide-react";
import {
  bippyDialogues,
  isBippyDialogueKey,
  type BippyDialogueKey,
} from "@/components/bippy/bippy-dialogue";
import {
  bippyStateTimeouts,
  reconcileBippyRestingState,
  transitionBippy,
  type BippyEvent,
  type BippyRestingState,
  type BippyState,
} from "@/components/bippy/bippy-machine";
import {
  clampBippyPosition,
  hasMeaningfulBippyTravel,
  resolveBippyPosition,
  type BippyMovementOptions,
  type BippyPoint,
  type BippySafeZone,
} from "@/components/bippy/bippy-movement";
import { BippySprite } from "@/components/bippy/bippy-sprite";
import { useWakaTimeStatus } from "@/components/bippy/use-wakatime-status";
import styles from "@/components/bippy/bippy.module.css";
import { useReducedMotion } from "@/components/bippy/use-reduced-motion";
import { Button } from "@/components/ui/button";
import { toggleTheme } from "@/lib/theme";

const POSITION_STORAGE_KEY = "bippy-position-v1";
const DESKTOP_SIZE = 128;
const MOBILE_SIZE = 96;
const EDGE_GAP = 16;
const ARRIVAL_DISTANCE = 3;
const DRAG_THRESHOLD = 4;
const INACTIVITY_MS = 25_000;
const CODING_WORK_DURATION_MS = 15_000;
const CODING_MESSAGE_DURATION_MS = 6_000;
const DIALOGUE_COOLDOWN_MS = 6_500;
const PROJECTS_DWELL_MS = 16_000;
const AUTONOMOUS_TARGET_ATTEMPTS = 8;
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
  coding: "Ameen is coding right now.",
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
  kind?: "coding" | "reaction";
  action?: { label: string; href: string };
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
  const dialogueDelayRef = useRef<number | null>(null);
  const lastDialogueAtRef = useRef(0);
  const shownDialoguesRef = useRef(new Set<BippyDialogueKey>());
  const codingActiveRef = useRef(false);
  const codingWorkStartedAtRef = useRef(0);
  const welcomeShownRef = useRef(false);
  const [state, setState] = useState<BippyState>("idle");
  const [facing, setFacing] = useState<1 | -1>(1);
  const [pageVisible, setPageVisible] = useState(true);
  const [message, setMessage] = useState<CompanionMessage | null>(null);
  const reducedMotion = useReducedMotion();
  const wakaTimeStatus = useWakaTimeStatus();

  const restingState = useCallback((): BippyRestingState => {
    return codingActiveRef.current ? "working" : "idle";
  }, []);

  const send = useCallback((event: BippyEvent) => {
    setState((current) =>
      transitionBippy(
        current,
        event,
        codingActiveRef.current ? "working" : "idle",
      ),
    );
  }, []);

  const stopMovement = useCallback(() => {
    movingRef.current = false;
    setState((current) =>
      current === "moving"
        ? codingActiveRef.current
          ? "working"
          : "idle"
        : current,
    );
  }, []);

  useEffect(() => {
    stateRef.current = state;
    if (state === "working") codingWorkStartedAtRef.current = Date.now();
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

  const constrainToViewport = useCallback((requested: BippyPoint) => {
    const mobile = isMobileViewport();
    return clampBippyPosition(
      requested,
      viewportBounds(),
      companionSize(),
      (mobile ? MOBILE_MOVEMENT_OPTIONS : DESKTOP_MOVEMENT_OPTIONS).insets,
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
    (nextMessage: CompanionMessage, duration: number) => {
      if (messageTimeoutRef.current !== null) {
        window.clearTimeout(messageTimeoutRef.current);
      }
      setMessage(nextMessage);
      messageTimeoutRef.current = window.setTimeout(() => {
        dismissMessage();
      }, duration);
    },
    [dismissMessage],
  );

  const showDialogue = useCallback(
    (key: BippyDialogueKey, options?: { immediate?: boolean }) => {
      if (codingActiveRef.current || shownDialoguesRef.current.has(key)) {
        return;
      }

      if (dialogueDelayRef.current !== null) {
        window.clearTimeout(dialogueDelayRef.current);
        dialogueDelayRef.current = null;
      }

      const dialogue = bippyDialogues[key];
      const presentDialogue = () => {
        dialogueDelayRef.current = null;
        if (codingActiveRef.current || shownDialoguesRef.current.has(key)) {
          return;
        }

        shownDialoguesRef.current.add(key);
        lastDialogueAtRef.current = Date.now();
        showMessage(
          {
            text: dialogue.text,
            kind: "reaction",
            ...("action" in dialogue ? { action: { ...dialogue.action } } : {}),
          },
          dialogue.duration,
        );
      };

      const elapsed = Date.now() - lastDialogueAtRef.current;
      const delay = options?.immediate
        ? 0
        : Math.max(DIALOGUE_COOLDOWN_MS - elapsed, 0);
      if (delay > 0) {
        dialogueDelayRef.current = window.setTimeout(presentDialogue, delay);
      } else {
        presentDialogue();
      }
    },
    [showMessage],
  );

  const dismissDialogue = useCallback(() => {
    if (dialogueDelayRef.current !== null) {
      window.clearTimeout(dialogueDelayRef.current);
      dialogueDelayRef.current = null;
    }
    dismissMessage();
  }, [dismissMessage]);

  const showCodingMessage = useCallback(() => {
    if (!wakaTimeStatus?.isCoding) return;
    showMessage(
      {
        text: wakaTimeStatus.todayText
          ? `Ameen is coding right now.\n${wakaTimeStatus.todayText} today`
          : BIPPY_COPY.coding,
        kind: "coding",
        action: { label: "See what he’s building", href: "/projects" },
      },
      CODING_MESSAGE_DURATION_MS,
    );
  }, [showMessage, wakaTimeStatus]);

  const placeFromSavedPosition = useCallback(
    (saved: SavedPosition) => {
      const size = companionSize();
      const bounds = viewportBounds();
      place(
        constrainToViewport({
          x: saved.x * Math.max(bounds.width - size, 0),
          y: saved.y * Math.max(bounds.height - size, 0),
        }),
      );
    },
    [constrainToViewport, place],
  );

  const placeAtDefault = useCallback(() => {
    const size = companionSize();
    const bounds = viewportBounds();
    place(
      constrainToViewport({
        x: Math.max(bounds.width - size - EDGE_GAP, 0),
        y: Math.max(bounds.height - size - EDGE_GAP, 0),
      }),
    );
  }, [constrainToViewport, place]);

  const returnToRestingPosition = useCallback(() => {
    const persisted = parseSavedPosition(
      window.localStorage.getItem(POSITION_STORAGE_KEY),
    );
    lastActivityRef.current = Date.now();
    stopMovement();
    if (hasCustomPositionRef.current && persisted) {
      placeFromSavedPosition(persisted);
    } else {
      placeAtDefault();
    }
  }, [placeAtDefault, placeFromSavedPosition, stopMovement]);

  const startAutonomousMovement = useCallback(() => {
    const size = companionSize();
    const bounds = viewportBounds();
    const current = positionRef.current;
    const minimumDistance = isMobileViewport() ? 48 : 64;

    for (let attempt = 0; attempt < AUTONOMOUS_TARGET_ATTEMPTS; attempt += 1) {
      const target = resolveTarget({
        x: Math.random() * Math.max(bounds.width - size, 0),
        y: Math.random() * Math.max(bounds.height - size, 0),
      });
      if (!hasMeaningfulBippyTravel(current, target, minimumDistance)) continue;

      targetRef.current = target;
      movingRef.current = true;
      send({ type: "WANDER" });
      return true;
    }

    stopMovement();
    return false;
  }, [resolveTarget, send, stopMovement]);

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
      if (dialogueDelayRef.current !== null) {
        window.clearTimeout(dialogueDelayRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!wakaTimeStatus) return;

    codingActiveRef.current = wakaTimeStatus.isCoding;
    if (wakaTimeStatus.isCoding) {
      if (dialogueDelayRef.current !== null) {
        window.clearTimeout(dialogueDelayRef.current);
        dialogueDelayRef.current = null;
      }
    }
    const nextRestingState: BippyRestingState = wakaTimeStatus.isCoding
      ? "working"
      : "idle";
    const statusUpdate = window.setTimeout(() => {
      if (wakaTimeStatus.isCoding) dismissMessage();
      setState((current) =>
        reconcileBippyRestingState(current, nextRestingState),
      );

      if (wakaTimeStatus.isCoding) codingWorkStartedAtRef.current = Date.now();
    }, 0);
    return () => window.clearTimeout(statusUpdate);
  }, [dismissMessage, wakaTimeStatus]);

  useEffect(() => {
    if (
      pathname !== "/" ||
      welcomeShownRef.current ||
      wakaTimeStatus?.isCoding
    ) {
      return;
    }
    welcomeShownRef.current = true;
    const welcomeDelay = window.setTimeout(() => {
      showDialogue("welcome");
    }, 600);
    return () => window.clearTimeout(welcomeDelay);
  }, [pathname, showDialogue, wakaTimeStatus?.isCoding]);

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
        !codingActiveRef.current &&
        stateRef.current !== "sleep" &&
        stateRef.current !== "dragging" &&
        stateRef.current !== "moving" &&
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
        codingActiveRef.current ||
        stateRef.current !== restingState() ||
        Date.now() - lastActivityRef.current < 4_000
      ) {
        return;
      }

      if (!codingActiveRef.current && Math.random() < 0.3) {
        movingRef.current = false;
        send({ type: "START_WORK" });
        return;
      }

      startAutonomousMovement();
    }, 7_000);
    return () => window.clearInterval(autonomous);
  }, [pageVisible, reducedMotion, restingState, send, startAutonomousMovement]);

  useEffect(() => {
    if (reducedMotion || !wakaTimeStatus?.isCoding) return;

    const codingCycle = window.setInterval(() => {
      if (
        !pageVisible ||
        stateRef.current !== "working" ||
        Date.now() - codingWorkStartedAtRef.current < CODING_WORK_DURATION_MS
      ) {
        return;
      }

      startAutonomousMovement();
    }, 500);

    return () => window.clearInterval(codingCycle);
  }, [
    pageVisible,
    reducedMotion,
    startAutonomousMovement,
    wakaTimeStatus?.isCoding,
  ]);

  useEffect(() => {
    if (
      !pageVisible ||
      reducedMotion ||
      state !== "moving" ||
      !movingRef.current
    ) {
      return;
    }

    let frame = 0;
    let previous = performance.now();

    const animate = (now: number) => {
      if (
        stateRef.current === "moving" &&
        !movingRef.current &&
        dragRef.current === null
      ) {
        send({ type: "ARRIVED" });
        return;
      }

      if (
        !pageVisible ||
        reducedMotion ||
        stateRef.current !== "moving" ||
        !movingRef.current
      ) {
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
      frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [pageVisible, place, reducedMotion, send, state]);

  useEffect(() => {
    const reactTo = (element: HTMLElement) => {
      lastActivityRef.current = Date.now();
      stopMovement();
      const dialogue = element.dataset.bippyDialogue;
      if (isBippyDialogueKey(dialogue)) showDialogue(dialogue);
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
        stopMovement();
        if (target.hasAttribute("data-bippy-project")) {
          send({ type: "RESET" });
          showDialogue("project-opened", { immediate: true });
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
  }, [send, showDialogue, stopMovement]);

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
          if (isBippyDialogueKey(section)) showDialogue(section);
          lastActivityRef.current = Date.now();
          stopMovement();
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
  }, [pathname, send, showDialogue, stopMovement]);

  useEffect(() => {
    const routeChanged = previousPathRef.current !== pathname;
    let routeUpdateDelay: number | undefined;
    stopMovement();
    if (routeChanged) returnToRestingPosition();

    if (pathname === "/projects") {
      lastActivityRef.current = Date.now();
      routeUpdateDelay = window.setTimeout(() => {
        send({ type: "RESET" });
        send({ type: "NOTICE" });
        showDialogue("projects-route");
      }, 0);
    } else if (routeChanged) {
      routeUpdateDelay = window.setTimeout(() => send({ type: "RESET" }), 0);
    }

    previousPathRef.current = pathname;
    return () => window.clearTimeout(routeUpdateDelay);
  }, [pathname, returnToRestingPosition, send, showDialogue, stopMovement]);

  useEffect(() => {
    if (pathname !== "/projects") return;
    const dwellTimeout = window.setTimeout(() => {
      showDialogue("projects-dwell");
    }, PROJECTS_DWELL_MS);
    return () => window.clearTimeout(dwellTimeout);
  }, [pathname, showDialogue]);

  function startDragging(event: ReactPointerEvent<HTMLButtonElement>) {
    const actor = actorRef.current;
    if (!actor) return;
    const rect = actor.getBoundingClientRect();
    lastActivityRef.current = Date.now();
    stopMovement();
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
      !drag.moved &&
      Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >=
        DRAG_THRESHOLD
    ) {
      drag.moved = true;
      send({ type: "DRAG_MOVE" });
    }

    const current = positionRef.current;
    const next = constrainToViewport({
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
    stopMovement();
    showCodingMessage();
    send({ type: "ACTIVATE" });
  }

  function celebrateOnHover() {
    lastActivityRef.current = Date.now();
    stopMovement();
    send({ type: "ACTIVATE" });
  }

  function resetPosition() {
    try {
      window.localStorage.removeItem(POSITION_STORAGE_KEY);
    } catch {
      // A blocked storage API must not prevent the visible reset.
    }
    hasCustomPositionRef.current = false;
    lastActivityRef.current = Date.now();
    stopMovement();
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
      onLostPointerCapture={stopDragging}
      onPointerEnter={celebrateOnHover}
      // Double-click flips the theme. Undocumented on purpose: it is a thing
      // to find, and the button in the nav is the discoverable way to do it.
      onDoubleClick={toggleTheme}
      data-coding={wakaTimeStatus?.isCoding ? "true" : "false"}
      data-state={state}
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
          <div className={styles.companionMessageBody}>
            <p>{message.text}</p>
            {message.action ? (
              <Link
                href={message.action.href}
                className={styles.companionMessageAction}
              >
                {message.action.label}
                <ArrowUpRight aria-hidden="true" />
              </Link>
            ) : null}
          </div>
          {message.kind !== "coding" ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={styles.companionMessageDismiss}
              aria-label="Dismiss Bippy message"
              onClick={dismissDialogue}
            >
              <X aria-hidden="true" />
            </Button>
          ) : null}
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
