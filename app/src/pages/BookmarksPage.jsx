import { AppShell } from "@/components/layout/AppShell";
import { PostCard } from "@/components/post/PostCard";
import { EmptyState, ErrorMessage, Loading } from "@/components/common/PageState";
import { usePageTitle } from "@/hooks/usePageTitle";
import { usePosts } from "@/hooks/usePosts";
import { postService } from "@/services/postService";

export default function BookmarksPage() {
  usePageTitle("Bookmarks — Social Connect");
  const { posts, loading, error, reload, updatePost, removePost } = usePosts(
    postService.getBookmarks,
  );

  // Un-bookmarking a post removes it from this page.
  const handleChange = (post) => (post.bookmarked ? updatePost(post) : removePost(post.id));

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-5">
        <h1 className="text-2xl font-extrabold">Bookmarks</h1>
        {loading && <Loading />}
        {error && <ErrorMessage message={error} onRetry={reload} />}
        {!loading && !error && posts.length === 0 && (
          <EmptyState
            title="No saved posts"
            hint="Tap the bookmark icon on a post to keep it here."
          />
        )}
        {posts.map((p) => (
          <PostCard key={p.id} post={p} onChange={handleChange} />
        ))}
      </div>
    </AppShell>
  );
}
