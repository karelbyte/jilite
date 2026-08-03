export default function Loading() {
  return (
    <div className="w-full flex-1 space-y-4 px-4 py-8 sm:px-6">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="mt-3 h-3 w-full rounded bg-gray-100 dark:bg-gray-800" />
            <div className="mt-2 h-3 w-4/5 rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    </div>
  );
}