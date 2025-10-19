'use client';

export function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="space-y-4">
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-12 w-12 bg-gray-700 rounded-lg"></div>
        <div className="h-10 w-20 bg-gray-700 rounded"></div>
      </div>
      <div className="h-4 bg-gray-700 rounded w-2/3 mb-2"></div>
      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
          <div className="flex-1">
            <div className="h-4 bg-gray-600 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-600 rounded w-1/3"></div>
          </div>
          <div className="h-4 bg-gray-600 rounded w-1/6"></div>
        </div>
      ))}
    </div>
  );
}

