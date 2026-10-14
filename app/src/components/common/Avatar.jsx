import { cn } from "@/utils/cn";

// Shows the person's photo when they have one, otherwise the friendly placeholder.
export function UserAvatar({ src, size = 40, className }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-end justify-center overflow-hidden rounded-lg bg-primary-soft",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <svg viewBox="0 0 40 40" className="h-[85%] w-[85%] fill-primary">
          <circle cx="20" cy="14" r="7" className="opacity-60" />
          <path d="M5 40c0-9 6.7-15 15-15s15 6 15 15z" />
        </svg>
      )}
    </div>
  );
}

export function Logo({ light = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold",
          light ? "bg-card text-primary" : "bg-primary text-primary-foreground",
        )}
      >
        SC
      </div>
      <span className={cn("font-bold", light ? "text-primary-foreground" : "text-foreground")}>
        Social Connect
      </span>
    </div>
  );
}
