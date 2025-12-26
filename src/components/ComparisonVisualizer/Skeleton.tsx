/**
 * Skeleton component for loading state (Overlay mode layout)
 */
export function VisualizerSkeleton() {
  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden">
      {/* Header skeleton */}
      <div className="h-[60px] flex justify-center items-center gap-2 px-4 bg-slate-800/50 border-b border-slate-700">
        <div className="h-9 w-20 bg-slate-700 rounded-lg animate-pulse"></div>
        <div className="h-9 w-24 bg-slate-700 rounded-lg animate-pulse"></div>
        <div className="h-9 w-16 bg-slate-700 rounded-lg animate-pulse"></div>
      </div>
      {/* Swipe hint placeholder */}
      <div className="h-[20px] bg-slate-800/30"></div>
      {/* Content skeleton - Overlay mode, responsive sizes */}
      <div className="h-[480px] flex items-center justify-center p-3 sm:p-6">
        <div className="flex flex-col items-center w-full">
          {/* Overlapping device placeholders - responsive */}
          <div className="relative flex items-end justify-center w-full max-w-[700px]" style={{ height: '320px' }}>
            {/* Larger device (background) - dashed border */}
            <div
              className="absolute bottom-0 bg-slate-800/60 rounded border-2 border-dashed border-slate-500 animate-pulse w-[85%] sm:w-[560px] lg:w-[620px]"
              style={{ aspectRatio: '16/9' }}
            ></div>
            {/* Smaller device (foreground) - solid border */}
            <div
              className="relative z-10 bg-slate-700/80 rounded border-2 border-cyan-400/50 animate-pulse w-[65%] sm:w-[440px] lg:w-[490px]"
              style={{ aspectRatio: '16/9' }}
            ></div>
          </div>
          {/* Labels skeleton */}
          <div className="flex justify-center gap-10 mt-4 w-full px-1">
            <div className="text-center flex-1 max-w-[200px]">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-4 h-3 border-2 border-dashed border-slate-400 bg-slate-800/50 rounded"></div>
                <div className="h-4 w-24 bg-slate-700 rounded animate-pulse"></div>
              </div>
              <div className="h-3 w-28 bg-slate-800 rounded mx-auto animate-pulse"></div>
            </div>
            <div className="text-center flex-1 max-w-[200px]">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-4 h-3 border-2 border-solid border-cyan-400/50 bg-slate-700/70 rounded"></div>
                <div className="h-4 w-24 bg-slate-700 rounded animate-pulse"></div>
              </div>
              <div className="h-3 w-28 bg-slate-800 rounded mx-auto animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer skeleton */}
      <div className="h-[48px] flex justify-center items-center gap-8 px-4 bg-slate-800/50 border-t border-slate-700">
        <div className="h-3 w-36 bg-slate-700 rounded animate-pulse"></div>
      </div>
    </div>
  );
}
