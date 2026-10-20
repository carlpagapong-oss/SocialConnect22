import { useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Globe2, MessageSquare, MoreHorizontal, Share2, ThumbsUp } from "lucide-react";
import { UserAvatar } from "@/components/common/Avatar";
import { CommentsModal } from "./CommentsModal";
import { postService } from "@/services/postService";
import { cn } from "@/utils/cn";
import { timeAgo } from "@/utils/formatters";
import { useAuth } from "@/hooks/useAuth";

// `onChange(updatedPost)` lets the parent list keep its copy in sync.
export function PostCard({ post, onChange, onDelete }) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const { user } = useAuth();
  const isAuthor = String(user?.id) === String(post.ownerId || post.author.id);

  const update = (changes) => onChange?.({ ...post, ...changes });

  const toggleLike = async () => {
    const wasLiked = post.liked;
    // Optimistic update, rolled back if the request fails.
    update({ liked: !wasLiked, likesCount: post.likesCount + (wasLiked ? -1 : 1) });
    try {
      const res = await postService.toggleLike(post.id);
      update({ liked: res.liked, likesCount: res.likesCount });
    } catch {
      update({ liked: wasLiked, likesCount: post.likesCount });
    }
  };

  const toggleBookmark = async () => {
    const was = post.bookmarked;
    update({ bookmarked: !was });
    try {
      const res = await postService.toggleBookmark(post.id);
      update({ bookmarked: res.bookmarked });
    } catch {
      update({ bookmarked: was });
    }
  };

  const deletePost = async () => {
    if (!window.confirm("Delete this post?")) return;
    setDeleting(true);
    try {
      await postService.remove(post.id);
      onDelete?.(post.id);
    } catch {
      setMenuOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const sharePost = async () => {
    try {
      const { post: sharedPost } = await postService.share(post.id);
      update({ shared: true });
      window.dispatchEvent(new CustomEvent("socialconnect:post-shared", { detail: sharedPost }));
      setShareStatus("Shared");
    } catch (error) {
      setShareStatus(error.message || "Unable to share");
    }
  };

  return (
    <article className="rounded-2xl border bg-card p-5">
      {post.sharedBy && (
        <p className="mb-3 text-xs font-medium text-muted-foreground">
          {post.sharedBy.name} shared this post
        </p>
      )}
      <div className="flex gap-3">
        <Link to={`/user/${post.author.username}`}>
          <UserAvatar src={post.author.avatar} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between">
            <div>
              <Link to={`/user/${post.author.username}`} className="text-sm font-semibold">
                {post.author.name}
              </Link>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                {timeAgo(post.createdAt)} · <Globe2 className="h-3 w-3" aria-label="Public post" />
              </p>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted"
                aria-label="Post options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 z-10 min-w-36 rounded-lg border bg-card p-1 shadow-lg">
                  {isAuthor && (
                    <button
                      type="button"
                      onClick={deletePost}
                      disabled={deleting}
                      className="w-full rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                    >
                      {deleting ? "Deleting..." : "Delete post"}
                    </button>
                  )}
                  {!isAuthor && (
                    <span className="block px-3 py-2 text-sm text-muted-foreground">
                      No actions available
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-secondary-foreground">{post.text}</p>
        </div>
      </div>
      {post.image && post.mediaType === "video" ? (
        <video
          src={post.image}
          controls
          className="mt-4 max-h-[40rem] w-full rounded-xl bg-black object-contain"
        />
      ) : post.image ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-4 block w-full overflow-hidden rounded-xl"
        >
          <img
            src={post.image}
            alt=""
            loading="lazy"
            width={1280}
            height={720}
            className="max-h-[40rem] w-full object-contain"
          />
        </button>
      ) : null}
      <div className="mt-4 flex items-center gap-5 border-t pt-3 text-xs text-muted-foreground">
        <button
          onClick={toggleLike}
          className={cn("flex items-center gap-1.5", post.liked && "text-primary")}
        >
          <ThumbsUp className={cn("h-4 w-4", post.liked && "fill-primary")} /> {post.likesCount}
        </button>
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4" /> {post.commentCount}
        </button>
        {!isAuthor && (
          <button
            type="button"
            onClick={sharePost}
            className="ml-auto flex items-center gap-1.5"
            aria-label="Share post"
            disabled={Boolean(post.shared)}
          >
            <Share2 className="h-4 w-4" />
            {shareStatus || (post.shared ? "Shared" : "Share")}
          </button>
        )}
        <button onClick={toggleBookmark} aria-label="Bookmark">
          <Bookmark className={cn("h-4 w-4", post.bookmarked && "fill-primary text-primary")} />
        </button>
      </div>
      {open && (
        <CommentsModal
          post={post}
          likes={post.likesCount}
          onCommentAdded={() => update({ commentCount: post.commentCount + 1 })}
          onClose={() => setOpen(false)}
        />
      )}
    </article>
  );
}
