export type BippyPerformanceRating = "good" | "fair" | "needs-attention";

export type BippyPerformanceResult = {
  averageFps: number;
  averageFrameTime: number;
  slowFramePercentage: number;
  rating: BippyPerformanceRating;
};

export function rateBippyPerformance({
  averageFps,
  slowFramePercentage,
}: Pick<
  BippyPerformanceResult,
  "averageFps" | "slowFramePercentage"
>): BippyPerformanceRating {
  if (averageFps >= 55 && slowFramePercentage <= 5) return "good";
  if (averageFps >= 45 && slowFramePercentage <= 15) return "fair";
  return "needs-attention";
}
