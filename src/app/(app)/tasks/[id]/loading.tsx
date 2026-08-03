export default function Loading() {
  return (
    <div className="w-full flex-1 px-4 py-8 sm:px-6">
      <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      <div className="mt-4 h-40 animate-pulse rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900" />
      <div className="mt-6 h-24 animate-pulse rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900" />
    </div>
  );
}