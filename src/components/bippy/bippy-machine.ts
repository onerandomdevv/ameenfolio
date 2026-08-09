export const bippyStates = [
  "idle",
  "curious",
  "working",
  "excited",
  "sleep",
  "wake",
  "dragging",
  "moving",
] as const;

export type BippyState = (typeof bippyStates)[number];
export type BippyRestingState = "idle" | "working";

export type BippyEvent =
  | { type: "ACTIVITY" }
  | { type: "ACTIVATE" }
  | { type: "NOTICE" }
  | { type: "START_WORK" }
  | { type: "DRAG_START" }
  | { type: "DRAG_MOVE" }
  | { type: "DRAG_END" }
  | { type: "WANDER" }
  | { type: "INACTIVITY" }
  | { type: "ARRIVED" }
  | { type: "STATE_TIMEOUT" }
  | { type: "RESET" };

export const bippyStateTimeouts: Partial<Record<BippyState, number>> = {
  curious: 1_600,
  working: 4_500,
  excited: 900,
  wake: 700,
};

export function transitionBippy(
  state: BippyState,
  event: BippyEvent,
  restingState: BippyRestingState = "idle",
): BippyState {
  if (event.type === "RESET") return restingState;
  if (event.type === "DRAG_START") return "dragging";
  if (state === "dragging") {
    if (event.type === "DRAG_MOVE") return "moving";
    return event.type === "DRAG_END" ? restingState : state;
  }
  if (state === "moving") {
    return event.type === "DRAG_END" || event.type === "ARRIVED"
      ? restingState
      : state;
  }
  if (event.type === "INACTIVITY") {
    return restingState === "working" ? "working" : "sleep";
  }

  if (state === "sleep") {
    return event.type === "ACTIVITY" || event.type === "ACTIVATE"
      ? "wake"
      : state;
  }

  if (event.type === "ACTIVATE") return "excited";
  if (event.type === "START_WORK") return "working";
  if (
    event.type === "NOTICE" &&
    (state === "idle" || state === "working" || state === "wake")
  ) {
    return "curious";
  }
  if (event.type === "WANDER" && state === restingState) return "moving";

  if (state === "wake") {
    return event.type === "STATE_TIMEOUT" ? restingState : state;
  }

  if (state === "excited" || state === "working") {
    return event.type === "STATE_TIMEOUT" ? restingState : state;
  }

  if (event.type === "STATE_TIMEOUT" && state === "curious") {
    return restingState;
  }

  return state;
}

export function reconcileBippyRestingState(
  state: BippyState,
  restingState: BippyRestingState,
): BippyState {
  return state === "idle" ||
    state === "working" ||
    state === "sleep" ||
    state === "wake"
    ? restingState
    : state;
}
