export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-gray-700" />
        <div className="w-12 h-12 rounded-full border-4 border-t-blue-600 dark:border-t-blue-400 animate-spin absolute inset-0" />
      </div>
    </div>
  );
}