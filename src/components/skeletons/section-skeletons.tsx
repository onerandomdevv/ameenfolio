import React from "react";

/**
 * Hero Section Skeleton
 * Matches the hero/landing section layout
 */
export function HeroSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-6xl mx-auto w-full space-y-12 animate-pulse">
        {/* Main Heading Skeleton */}
        <div className="space-y-6">
          <div className="h-20 bg-bg-glass/30 rounded w-3/4 mx-auto" />
          <div className="h-16 bg-bg-glass/30 rounded w-2/3 mx-auto" />
        </div>

        {/* Subheading Skeleton */}
        <div className="space-y-3 max-w-2xl mx-auto">
          <div className="h-6 bg-bg-glass/30 rounded w-full" />
          <div className="h-6 bg-bg-glass/30 rounded w-5/6 mx-auto" />
        </div>

        {/* CTA Buttons Skeleton */}
        <div className="flex gap-4 justify-center">
          <div className="h-14 bg-bg-glass/30 rounded-xl w-40" />
          <div className="h-14 bg-bg-glass/30 rounded-xl w-40" />
        </div>

        {/* Social Links Skeleton */}
        <div className="flex gap-4 justify-center">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-10 h-10 bg-bg-glass/30 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Tech Stack Section Skeleton
 * Matches the tech stack/skills section layout
 */
export function TechStackSkeleton() {
  return (
    <div className="py-20 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Title Skeleton */}
        <div className="text-center space-y-4">
          <div className="h-12 bg-bg-glass/30 rounded w-64 mx-auto animate-pulse" />
          <div className="h-6 bg-bg-glass/30 rounded w-96 mx-auto animate-pulse" />
        </div>

        {/* Category Tabs Skeleton */}
        <div className="flex flex-wrap gap-4 justify-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-10 bg-bg-glass/30 rounded w-32 animate-pulse"
            />
          ))}
        </div>

        {/* Skills Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-bg-glass/30 backdrop-blur-md rounded-lg p-6 space-y-4 animate-pulse"
            >
              {/* Icon Skeleton */}
              <div className="w-16 h-16 bg-bg-glass/40 rounded-lg mx-auto" />

              {/* Name Skeleton */}
              <div className="h-5 bg-bg-glass/40 rounded w-3/4 mx-auto" />

              {/* Progress Bar Skeleton (optional) */}
              <div className="h-2 bg-bg-glass/40 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Marketplace Section Skeleton
 * Matches the marketplace/products grid layout
 */
export function MarketplaceSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="py-20 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header Skeleton */}
        <div className="text-center space-y-4">
          <div className="h-12 bg-bg-glass/30 rounded w-80 mx-auto animate-pulse" />
          <div className="h-6 bg-bg-glass/30 rounded w-96 mx-auto animate-pulse" />
        </div>

        {/* Products Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="bg-bg-glass backdrop-blur-md rounded-none overflow-hidden shadow-xl animate-pulse"
            >
              {/* Product Image Skeleton */}
              <div className="aspect-video w-full bg-bg-glass/30" />

              {/* Product Content Skeleton */}
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  {/* Title Skeleton */}
                  <div className="h-8 bg-bg-glass/30 rounded w-2/3" />

                  {/* Description Skeleton */}
                  <div className="space-y-2">
                    <div className="h-4 bg-bg-glass/30 rounded w-full" />
                    <div className="h-4 bg-bg-glass/30 rounded w-5/6" />
                    <div className="h-4 bg-bg-glass/30 rounded w-4/6" />
                  </div>

                  {/* Price Skeleton */}
                  <div className="flex items-center gap-4">
                    <div className="h-8 bg-bg-glass/30 rounded w-24" />
                    <div className="h-6 bg-bg-glass/30 rounded w-16" />
                  </div>

                  {/* Tags Skeleton */}
                  <div className="flex flex-wrap gap-2">
                    <div className="h-6 bg-bg-glass/30 rounded w-20" />
                    <div className="h-6 bg-bg-glass/30 rounded w-16" />
                    <div className="h-6 bg-bg-glass/30 rounded w-24" />
                  </div>
                </div>

                {/* Button Skeleton */}
                <div className="h-12 bg-bg-glass/30 rounded-xl w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Contact Section Skeleton
 * Matches the contact form section layout
 */
export function ContactSkeleton() {
  return (
    <div className="py-20 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Section Title Skeleton */}
        <div className="text-center space-y-4">
          <div className="h-12 bg-bg-glass/30 rounded w-64 mx-auto animate-pulse" />
          <div className="h-6 bg-bg-glass/30 rounded w-96 mx-auto animate-pulse" />
        </div>

        {/* Form Skeleton */}
        <div className="bg-bg-glass backdrop-blur-md rounded-lg p-8 space-y-6">
          {/* Name Input Skeleton */}
          <div className="h-12 bg-bg-glass/30 rounded animate-pulse" />

          {/* Email Input Skeleton */}
          <div className="h-12 bg-bg-glass/30 rounded animate-pulse" />

          {/* Message Textarea Skeleton */}
          <div className="h-32 bg-bg-glass/30 rounded animate-pulse" />

          {/* Submit Button Skeleton */}
          <div className="h-14 bg-bg-glass/30 rounded-xl animate-pulse" />
        </div>

        {/* Social Links Skeleton */}
        <div className="flex gap-6 justify-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-12 h-12 bg-bg-glass/30 rounded-full animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
