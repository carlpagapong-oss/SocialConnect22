import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CreatePost } from "@/components/post/CreatePost";
import { PostCard } from "@/components/post/PostCard";
import { FollowRow } from "@/components/profile/FollowRow";
import { EmptyState, ErrorMessage, Loading } from "@/components/common/PageState";
import { usePageTitle } from "@/hooks/usePageTitle";
import { usePosts } from "@/hooks/usePosts";
import { postService } from "@/services/postService";
import { userService } from "@/services/userService";

export default function HomePage() {
  usePageTitle("Home — Social Connect");
  const { posts, loading, error, reload, addPost, updatePost } = usePosts(postService.getFeed);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    userService
      .getSuggestions()
      .then((data) => setSuggestions(data.users))
      .catch(() => setSuggestions([]));
  }, []);

  return (
    <AppShell>
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_270px]">
        <div className="space-y-5">
          <CreatePost onCreated={addPost} />
          {loading && <Loading label="Loading your feed..." />}
          {error && <ErrorMessage message={error} onRetry={reload} />}
          {!loading && !error && posts.length === 0 && (
            <EmptyState title="Nothing here yet" hint="Be the first to share something." />
          )}
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onChange={updatePost} />
          ))}
        </div>
        <aside className="space-y-5">
          <div className="rounded-2xl border bg-card p-5">
            <div className="flex justify-between">
              <h2 className="text-sm font-bold">People to follow</h2>
              <a className="text-sm text-primary" href="#">
                See all
              </a>
            </div>
            <div className="mt-3 divide-y">
              {suggestions.map((person) => (
                <FollowRow key={person.id} person={person} />
              ))}
              {suggestions.length === 0 && (
                <p className="py-3 text-sm text-muted-foreground">
                  You&apos;re following everyone!
                </p>
              )}
            </div>
          </div>
          <div className="rounded-2xl bg-ink p-5 text-ink-foreground">
            <p className="text-xs font-semibold tracking-widest text-primary-soft/80">
              CONNECT PROMPT
            </p>
            <p className="mt-2 text-lg font-bold leading-snug">
              What&apos;s one small thing that made you smile today?
            </p>
            <button className="mt-4 text-sm">Share your answer →</button>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-brand p-5 text-primary-foreground">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary-foreground/10" />
            <p className="text-[10px] font-bold tracking-widest opacity-80">COMMUNITY LIVE</p>
            <p className="mt-2 text-lg font-bold">Creative check-in</p>
            <p className="mt-1 text-xs opacity-85">
              Join a relaxed conversation with creators this Friday.
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-bold">Friday · 7:00 PM</span>
              <button className="rounded-lg bg-card px-3 py-2 text-sm text-primary">
                Join event
              </button>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
