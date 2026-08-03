export default function Loading() {
  return (
    <div className="w-full flex-1 px-4 py-8 sm:px-6">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
      <div className="mt-6 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900" />
        ))}
      </div>
    </div>
  );
}