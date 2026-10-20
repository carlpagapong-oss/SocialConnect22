import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { CreatePost } from "@/components/post/CreatePost";
import { PostCard } from "@/components/post/PostCard";
import { FollowRow } from "@/components/profile/FollowRow";
import { EmptyState, ErrorMessage, Loading } from "@/components/common/PageState";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";
import { postService } from "@/services/postService";
import { userService } from "@/services/userService";
import { UserAvatar } from "@/components/common/Avatar";

export default function HomePage() {
  usePageTitle("Home — Social Connect");
  const { user } = useAuth();
  const { posts, loading, error, reload, addPost, updatePost, removePost } = usePosts(
    postService.getFeed,
  );
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    userService
      .getSuggestions()
      .then((data) => setSuggestions(data.users))
      .catch(() => setSuggestions([]));
  }, []);

  useEffect(() => {
    const handleShared = (event) => addPost(event.detail);
    window.addEventListener("socialconnect:post-shared", handleShared);
    return () => window.removeEventListener("socialconnect:post-shared", handleShared);
  }, [addPost]);

  return (
    <AppShell>
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_270px]">
        <div className="space-y-5">
          <section className="relative overflow-hidden rounded-2xl bg-ink p-6 text-ink-foreground shadow-sm">
            <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-primary/20" />
            <div className="absolute -bottom-20 right-20 h-36 w-36 rounded-full bg-brand/20" />
            <div className="relative flex items-center gap-4">
              <UserAvatar src={user?.avatar} size={48} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-soft">
                  Social Connect
                </p>
                <h1 className="mt-1 text-2xl font-extrabold">
                  Welcome back, {user?.name || user?.username}
                </h1>
                <p className="mt-1 text-sm text-ink-foreground/70">
                  Stay connected with the people and posts that matter to you.
                </p>
              </div>
            </div>
          </section>
          <CreatePost onCreated={addPost} />
          {loading && <Loading label="Loading your feed..." />}
          {error && <ErrorMessage message={error} onRetry={reload} />}
          {!loading && !error && posts.length === 0 && (
            <EmptyState title="Nothing here yet" hint="Be the first to share something." />
          )}
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onChange={updatePost} onDelete={removePost} />
          ))}
        </div>
        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border bg-card p-5">
            <div className="flex justify-between">
              <h2 className="text-sm font-bold">People to follow</h2>
              <Link className="text-sm text-primary" to="/people">
                See all
              </Link>
            </div>
            <div className="mt-3 divide-y">
              {suggestions.slice(0, 2).map((person) => (
                <FollowRow key={person.id} person={person} />
              ))}
              {suggestions.length === 0 && (
                <p className="py-3 text-sm text-muted-foreground">
                  You&apos;re following everyone!
                </p>
              )}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border bg-card p-5">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Your community
              </p>
              <h2 className="mt-2 text-lg font-bold">Small moments matter.</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Share something positive, support your circle, and help keep Social Connect
                welcoming for everyone.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-muted-foreground">
                  A friendly place to connect
                </span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-75">
              Social Connect
            </p>
            <p className="mt-2 text-lg font-bold leading-snug">
              Be kind. Be curious. Be yourself.
            </p>
            <div className="mt-4 flex gap-1.5">
              <span className="h-1.5 w-8 rounded-full bg-primary-foreground/80" />
              <span className="h-1.5 w-4 rounded-full bg-primary-foreground/50" />
              <span className="h-1.5 w-2 rounded-full bg-primary-foreground/30" />
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
