export function Loading({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
      {label}
    </div>
  );
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-card p-6 text-center">
      <p className="text-sm text-destructive">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 text-sm font-medium text-primary">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, hint }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function FormError({ message, id }) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {message}
    </p>
  );
}
