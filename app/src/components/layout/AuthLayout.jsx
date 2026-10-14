import { Logo, UserAvatar } from "@/components/common/Avatar";

export function AuthLayout({ children, showSocialProof = true }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-brand p-12 text-primary-foreground lg:flex lg:flex-col">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full border-[60px] border-primary-foreground/10" />
        <Logo light />
        <div className="relative my-auto max-w-md">
          <p className="text-xs font-semibold tracking-[0.25em] opacity-70">YOUR PEOPLE ARE HERE</p>
          <h1 className="mt-4 text-5xl font-extrabold leading-tight tracking-tight">
            Share your world.
            <br />
            Find your circle.
          </h1>
          <p className="mt-5 text-lg leading-relaxed opacity-85">
            A cozy corner to share the little things, follow people you love, and be wonderfully
            yourself.
          </p>
          {showSocialProof && (
            <div className="mt-10 flex items-center gap-3">
              <div className="flex -space-x-3">
                {[0, 1, 2].map((i) => (
                  <UserAvatar
                    key={i}
                    size={38}
                    className="rounded-full ring-2 ring-primary-foreground/60"
                  />
                ))}
              </div>
              <div className="text-sm">
                <p className="font-bold">12k+ people</p>
                <p className="opacity-75">already sharing</p>
              </div>
            </div>
          )}
        </div>
        <p className="text-xs opacity-70">© 2025 Social Connect. Make yourself at home.</p>
      </aside>
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
