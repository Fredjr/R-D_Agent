'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// Base Skeleton Component
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-[var(--spotify-dark-gray)] rounded",
        className
      )}
    />
  );
}

// Question Card Skeleton
export function QuestionCardSkeleton() {
  return (
    <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}

// Question Tree Skeleton
export function QuestionTreeSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <QuestionCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Hypothesis Card Skeleton
export function HypothesisCardSkeleton() {
  return (
    <div className="bg-[var(--spotify-dark-gray)]/50 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}

// Evidence Card Skeleton
export function EvidenceCardSkeleton() {
  return (
    <div className="bg-[var(--spotify-black)] rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

// Paper Card Skeleton
export function PaperCardSkeleton() {
  return (
    <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-4 space-y-3">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex items-center space-x-2 pt-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}

// Collection Card Skeleton
export function CollectionCardSkeleton() {
  return (
    <div className="bg-[var(--spotify-dark-gray)] rounded-lg p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

// Project Header Skeleton
export function ProjectHeaderSkeleton() {
  return (
    <div className="w-full p-6">
      <div className="flex items-end space-x-6">
        <Skeleton className="w-60 h-60 flex-shrink-0" />
        <div className="flex-1 space-y-4 pb-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-5 w-full max-w-2xl" />
          <div className="flex items-center space-x-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-6 px-6 pt-6">
        <Skeleton className="w-14 h-14 rounded-full" />
        <Skeleton className="w-8 h-8" />
        <Skeleton className="w-8 h-8" />
        <Skeleton className="w-8 h-8" />
      </div>
    </div>
  );
}

// Tab Content Skeleton
export function TabContentSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CollectionCardSkeleton />
        <CollectionCardSkeleton />
        <CollectionCardSkeleton />
      </div>
    </div>
  );
}

export default Skeleton;

