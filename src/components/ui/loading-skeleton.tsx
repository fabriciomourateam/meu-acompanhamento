import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  className?: string;
}

export function TableRowSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <tr className={cn("animate-pulse", className)}>
      <td className="p-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </td>
      <td className="p-4">
        <Skeleton className="h-6 w-20" />
      </td>
      <td className="p-4">
        <Skeleton className="h-6 w-16" />
      </td>
      <td className="p-4">
        <Skeleton className="h-6 w-16" />
      </td>
      <td className="p-4">
        <Skeleton className="h-6 w-16" />
      </td>
      <td className="p-4">
        <Skeleton className="h-6 w-16" />
      </td>
      <td className="p-4">
        <Skeleton className="h-6 w-16" />
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </td>
    </tr>
  );
}

export function CardSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("animate-pulse bg-card border border-border rounded-lg p-6", className)}>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MetricCardSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("animate-pulse bg-card border border-border rounded-lg p-6", className)}>
      <div className="flex items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

export function ChartSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("animate-pulse bg-card border border-border rounded-lg p-6", className)}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="h-64 bg-muted/20 rounded flex items-end justify-around p-4 space-x-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton 
              key={i} 
              className="w-8" 
              style={{ height: `${Math.random() * 150 + 50}px` }} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function FeedbackItemSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("animate-pulse p-4 bg-surface rounded-lg border border-border", className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="text-center p-2 bg-background/50 rounded">
            <Skeleton className="h-3 w-12 mx-auto mb-1" />
            <Skeleton className="h-4 w-8 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CheckinItemSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("animate-pulse p-6 bg-surface rounded-xl border border-border", className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="text-center">
            <Skeleton className="h-3 w-12 mx-auto mb-1" />
            <Skeleton className="h-4 w-8 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}