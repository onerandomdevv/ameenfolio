import React from "react";

export function ProjectCardSkeleton() {
  return (
    <div className="group relative bg-bg-glass backdrop-blur-md rounded-none overflow-hidden shadow-xl">
      {/* Image Skeleton */}
      <div className="relative aspect-video w-full overflow-hidden bg-bg-glass/30 animate-pulse" />

      {/* Content Skeleton */}
      <div className="p-8 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {/* Title Skeleton */}
            <div className="h-8 bg-bg-glass/30 rounded w-2/3 animate-pulse" />
            {/* Icon Skeleton */}
            <div className="w-5 h-5 bg-bg-glass/30 rounded-full animate-pulse" />
          </div>

          {/* Description Skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-bg-glass/30 rounded w-full animate-pulse" />
            <div className="h-4 bg-bg-glass/30 rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-bg-glass/30 rounded w-4/6 animate-pulse" />
          </div>

          {/* Tech Stack Tags Skeleton */}
          <div className="flex flex-wrap gap-2">
            <div className="h-6 bg-bg-glass/30 rounded w-20 animate-pulse" />
            <div className="h-6 bg-bg-glass/30 rounded w-16 animate-pulse" />
            <div className="h-6 bg-bg-glass/30 rounded w-24 animate-pulse" />
          </div>
        </div>

        {/* Button Skeleton */}
        <div className="space-y-3 pt-6 border-t border-border-subtle/30">
          <div className="h-12 bg-bg-glass/30 rounded-xl w-full animate-pulse" />
          <div className="grid grid-cols-3 gap-2">
            <div className="h-10 bg-bg-glass/30 rounded-lg animate-pulse" />
            <div className="h-10 bg-bg-glass/30 rounded-lg animate-pulse" />
            <div className="h-10 bg-bg-glass/30 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div className="min-h-screen bg-bg-primary text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header Skeleton */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-6 bg-bg-glass/30 rounded-full w-24 animate-pulse" />
            </div>
            <div className="h-16 bg-bg-glass/30 rounded w-2/3 animate-pulse" />
            <div className="h-6 bg-bg-glass/30 rounded w-full animate-pulse" />
          </div>

          {/* Image Skeleton */}
          <div className="aspect-video bg-bg-glass/30 rounded-lg animate-pulse" />

          {/* Content Skeleton */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="h-4 bg-bg-glass/30 rounded w-full animate-pulse" />
              <div className="h-4 bg-bg-glass/30 rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-bg-glass/30 rounded w-4/6 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}
