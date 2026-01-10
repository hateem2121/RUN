export function LoadingSpinner() {
  return (
    <div className="flex min-h-96 w-full items-center justify-center">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-surface-muted dark:border-muted" />
        <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-t-blue-600 dark:border-t-blue-400" />
      </div>
    </div>
  );
}
