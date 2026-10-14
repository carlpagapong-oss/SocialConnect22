import { useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, MessageSquare, MoreHorizontal, Share2, ThumbsUp } from "lucide-react";
import { UserAvatar } from "@/components/common/Avatar";
import { CommentsModal } from "./CommentsModal";
import { postService } from "@/services/postService";
import { cn } from "@/utils/cn";
import { timeAgo } from "@/utils/formatters";

// `onChange(updatedPost)` lets the parent list keep its copy in sync.
export function PostCard({ post, onChange }) {
  const [open, setOpen] = useState(false);

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

  return (
    <article className="rounded-2xl border bg-card p-5">
      <div className="flex gap-3">
        <Link to={`/user/${post.author.username}`}>
          <UserAvatar src={post.author.avatar} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between">
            <p className="text-sm">
              <Link to={`/user/${post.author.username}`} className="font-medium">
                {post.author.name}
              </Link>{" "}
              <span className="text-muted-foreground">
                @{post.author.username} · {timeAgo(post.createdAt)}
              </span>
            </p>
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-secondary-foreground">{post.text}</p>
        </div>
      </div>
      {post.image && (
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
            className="aspect-[16/8.5] w-full object-cover"
          />
        </button>
      )}
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
        <Share2 className="ml-auto h-4 w-4" />
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
