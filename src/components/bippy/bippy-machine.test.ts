import { describe, expect, it } from "vitest";
import { transitionBippy } from "@/components/bippy/bippy-machine";

describe("Bippy state machine", () => {
  it("runs only after an explicit drag starts moving", () => {
    expect(transitionBippy("idle", { type: "ACTIVITY" })).toBe("idle");
    expect(transitionBippy("idle", { type: "DRAG_START" })).toBe("dragging");
    expect(transitionBippy("dragging", { type: "DRAG_MOVE" })).toBe("moving");
    expect(transitionBippy("moving", { type: "DRAG_END" })).toBe("idle");
  });

  it("wakes before returning to idle after inactivity", () => {
    expect(transitionBippy("idle", { type: "INACTIVITY" })).toBe("sleep");
    expect(transitionBippy("sleep", { type: "ACTIVITY" })).toBe("wake");
    expect(transitionBippy("wake", { type: "STATE_TIMEOUT" })).toBe("idle");
  });

  it("reacts to activation without trapping later transitions", () => {
    expect(transitionBippy("idle", { type: "ACTIVATE" })).toBe("excited");
    expect(transitionBippy("excited", { type: "STATE_TIMEOUT" })).toBe("idle");
  });

  it("supports a focused working state", () => {
    expect(transitionBippy("idle", { type: "START_WORK" })).toBe("working");
    expect(transitionBippy("working", { type: "STATE_TIMEOUT" })).toBe("idle");
  });

  it("can notice portfolio activity without following the pointer", () => {
    expect(transitionBippy("idle", { type: "NOTICE" })).toBe("curious");
    expect(transitionBippy("working", { type: "NOTICE" })).toBe("curious");
    expect(transitionBippy("curious", { type: "STATE_TIMEOUT" })).toBe("idle");
  });

  it("supports autonomous curiosity and an explicit reset", () => {
    expect(transitionBippy("idle", { type: "WANDER" })).toBe("moving");
    expect(transitionBippy("moving", { type: "ARRIVED" })).toBe("idle");
    expect(transitionBippy("sleep", { type: "RESET" })).toBe("idle");
  });
});
