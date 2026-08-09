"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  rateBippyPerformance,
  type BippyPerformanceResult,
} from "@/components/bippy/bippy-performance";

const TEST_DURATION_MS = 10_000;
const SLOW_FRAME_MS = 34;

type TestSample = {
  startedAt: number;
  previousFrameAt: number;
  frameCount: number;
  frameTimeTotal: number;
  slowFrames: number;
};

export function useBippyPerformance() {
  const frameRef = useRef(0);
  const livePreviousRef = useRef(0);
  const liveWindowRef = useRef({
    startedAt: 0,
    frames: 0,
    frameTimeTotal: 0,
  });
  const testRef = useRef<TestSample | null>(null);
  const [fps, setFps] = useState(0);
  const [frameTime, setFrameTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [result, setResult] = useState<BippyPerformanceResult | null>(null);

  const finishTest = useCallback((sample: TestSample) => {
    const elapsed = Math.max(performance.now() - sample.startedAt, 1);
    const measuredFrames = Math.max(sample.frameCount, 1);
    const averageFps = (sample.frameCount / elapsed) * 1_000;
    const averageFrameTime = sample.frameTimeTotal / measuredFrames;
    const slowFramePercentage = (sample.slowFrames / measuredFrames) * 100;

    setResult({
      averageFps,
      averageFrameTime,
      slowFramePercentage,
      rating: rateBippyPerformance({ averageFps, slowFramePercentage }),
    });
    setIsRunning(false);
    setRemainingSeconds(0);
    testRef.current = null;
  }, []);

  useEffect(() => {
    const sampleFrame = (now: number) => {
      const previous = livePreviousRef.current || now;
      const elapsed = now - previous;
      livePreviousRef.current = now;

      const liveWindow = liveWindowRef.current;
      if (!liveWindow.startedAt) liveWindow.startedAt = now;
      liveWindow.frames += 1;
      liveWindow.frameTimeTotal += elapsed;
      const liveElapsed = now - liveWindow.startedAt;
      if (liveElapsed >= 1_000) {
        setFps(Math.round((liveWindow.frames / liveElapsed) * 1_000));
        setFrameTime(liveWindow.frameTimeTotal / liveWindow.frames);
        liveWindow.startedAt = now;
        liveWindow.frames = 0;
        liveWindow.frameTimeTotal = 0;
      }

      const test = testRef.current;
      if (test) {
        const testElapsed = now - test.previousFrameAt;
        test.previousFrameAt = now;
        test.frameCount += 1;
        test.frameTimeTotal += testElapsed;
        if (testElapsed > SLOW_FRAME_MS) test.slowFrames += 1;

        const remaining = Math.max(
          Math.ceil((TEST_DURATION_MS - (now - test.startedAt)) / 1_000),
          0,
        );
        setRemainingSeconds((current) =>
          current === remaining ? current : remaining,
        );
        if (now - test.startedAt >= TEST_DURATION_MS) finishTest(test);
      }

      frameRef.current = window.requestAnimationFrame(sampleFrame);
    };

    const handleVisibility = () => {
      livePreviousRef.current = 0;
      liveWindowRef.current = { startedAt: 0, frames: 0, frameTimeTotal: 0 };
      if (document.visibilityState === "hidden" && testRef.current) {
        testRef.current = null;
        setIsRunning(false);
        setRemainingSeconds(0);
      }
    };

    frameRef.current = window.requestAnimationFrame(sampleFrame);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.cancelAnimationFrame(frameRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [finishTest]);

  const runTest = useCallback(() => {
    const now = performance.now();
    setResult(null);
    setIsRunning(true);
    setRemainingSeconds(TEST_DURATION_MS / 1_000);
    testRef.current = {
      startedAt: now,
      previousFrameAt: now,
      frameCount: 0,
      frameTimeTotal: 0,
      slowFrames: 0,
    };
  }, []);

  return {
    fps,
    frameTime,
    isRunning,
    remainingSeconds,
    result,
    runTest,
  };
}
