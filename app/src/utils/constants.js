export const TOKEN_KEY = "socialconnect_token";

export const API_URL = import.meta.env.VITE_API_URL || "/api";

export const GENDERS = ["Male", "Female"];

// Shared Tailwind classes for text inputs on the auth screens.
export const inputCls =
  "h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20";

export const primaryButtonCls =
  "h-12 w-full rounded-lg bg-primary font-medium text-primary-foreground shadow-button transition hover:opacity-90 disabled:opacity-60";
