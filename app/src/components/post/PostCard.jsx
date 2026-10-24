import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bookmark, Globe2, MessageSquare, MoreHorizontal, Share2, ThumbsUp } from "lucide-react";
import { UserAvatar } from "@/components/common/Avatar";
import { CommentsModal } from "./CommentsModal";
import { postService } from "@/services/postService";
import { cn } from "@/utils/cn";
import { formatPostDate } from "@/utils/formatters";
import { useAuth } from "@/hooks/useAuth";

// `onChange(updatedPost)` lets the parent list keep its copy in sync.
export function PostCard({ post, onChange, onDelete, onCommentsClick, onImageClick }) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [shareComposerOpen, setShareComposerOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [editShareOpen, setEditShareOpen] = useState(false);
  const [editShareMessage, setEditShareMessage] = useState(post.sharedText || "");
  const [visibleSharedText, setVisibleSharedText] = useState(post.sharedText || "");
  const [savingShare, setSavingShare] = useState(false);
  const [editShareError, setEditShareError] = useState("");
  const menuRef = useRef(null);
  const shareMenuRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAuthor = String(user?.id) === String(post.ownerId || post.author.id);

  useEffect(() => {
    setVisibleSharedText(post.sharedText || "");
  }, [post.sharedText]);

  useEffect(() => {
    const handleOutsideMenus = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
      if (!shareMenuRef.current?.contains(event.target)) setShareMenuOpen(false);
    };
    document.addEventListener("pointerdown", handleOutsideMenus);
    return () => document.removeEventListener("pointerdown", handleOutsideMenus);
  }, []);

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
    if (!window.confirm(post.sharedBy ? "Delete this shared post?" : "Delete this post?")) return;
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

  const saveShareCaption = async (event) => {
    event.preventDefault();
    setSavingShare(true);
    setEditShareError("");
    try {
      const { post: updatedPost } = await postService.updateShare(post.id, editShareMessage);
      const nextCaption = editShareMessage.trim();
      setVisibleSharedText(nextCaption);
      update({
        ...updatedPost,
        sharedText: nextCaption,
      });
      setEditShareOpen(false);
      setShareMenuOpen(false);
    } catch (error) {
      setEditShareError(error.message || "Unable to edit shared post");
    } finally {
      setSavingShare(false);
    }
  };

  const sharePost = async () => {
    if (sharing) return;
    setSharing(true);
    setShareStatus("");
    try {
      const { post: sharedPost } = await postService.share(post.id, shareMessage);
      update({ shared: true });
      window.dispatchEvent(
        new CustomEvent("socialconnect:post-shared", {
          detail: { ...sharedPost, sharedText: shareMessage.trim() },
        }),
      );
      setShareStatus("Shared");
      setShareMessage("");
      setShareComposerOpen(false);
    } catch (error) {
      setShareStatus(error.message || "Unable to share");
    } finally {
      setSharing(false);
    }
  };

  return (
    <article className="rounded-2xl border bg-card p-5">
      {post.sharedBy && (
        <div className="mb-4 flex items-center gap-3">
          <Link to={`/user/${post.sharedBy.username}`}>
            <UserAvatar src={post.sharedBy.avatar} size={40} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              <Link to={`/user/${post.sharedBy.username}`} className="hover:underline">
                {post.sharedBy.name}
              </Link>{" "}
              shared a post
            </p>
            <p className="text-xs text-muted-foreground">
              {formatPostDate(post.sharedBy.sharedAt)}
            </p>
            {visibleSharedText && (
              <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">
                {visibleSharedText}
              </p>
            )}
          </div>
          {isAuthor && (
            <div ref={shareMenuRef} className="relative self-start">
              <button
                type="button"
                onClick={() => setShareMenuOpen((value) => !value)}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted"
                aria-label="Shared post options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {shareMenuOpen && (
                <div className="absolute right-0 top-10 z-10 min-w-44 rounded-lg border bg-card p-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setEditShareMessage(visibleSharedText);
                      setEditShareError("");
                      setEditShareOpen(true);
                      setShareMenuOpen(false);
                    }}
                    className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    Edit post
                  </button>
                  <button
                    type="button"
                    onClick={deletePost}
                    disabled={deleting}
                    className="w-full rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                  >
                    {deleting ? "Deleting..." : "Delete shared post"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <div
        className={cn(
          post.sharedBy && "cursor-pointer rounded-xl border p-3 transition hover:bg-muted/40",
        )}
        onClick={() => {
          if (post.sharedBy && post.originalPostId) navigate(`/post/${post.originalPostId}`);
        }}
        onKeyDown={(event) => {
          if (
            post.sharedBy &&
            post.originalPostId &&
            (event.key === "Enter" || event.key === " ")
          ) {
            event.preventDefault();
            navigate(`/post/${post.originalPostId}`);
          }
        }}
        role={post.sharedBy ? "link" : undefined}
        tabIndex={post.sharedBy ? 0 : undefined}
        aria-label={post.sharedBy ? "Open original post" : undefined}
      >
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
                  {formatPostDate(post.originalCreatedAt || post.createdAt)} ·{" "}
                  <Globe2 className="h-3 w-3" aria-label="Public post" />
                </p>
              </div>
              {!post.sharedBy && (
                <div ref={menuRef} className="relative">
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
              )}
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
            onClick={() => {
              if (onImageClick) {
                onImageClick(post.image);
              } else if (post.sharedBy && post.originalPostId) {
                navigate(`/post/${post.originalPostId}`);
              } else {
                setOpen(true);
              }
            }}
            className="mt-4 block w-full overflow-hidden rounded-xl"
            aria-label="Open photo"
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
      </div>
      <div className="mt-4 flex items-center gap-5 border-t pt-3 text-xs text-muted-foreground">
        <button
          onClick={toggleLike}
          className={cn("flex items-center gap-1.5", post.liked && "text-primary")}
        >
          <ThumbsUp className={cn("h-4 w-4", post.liked && "fill-primary")} /> {post.likesCount}
        </button>
        <button
          onClick={() => {
            if (onCommentsClick) {
              onCommentsClick();
            } else {
              setOpen(true);
            }
          }}
          className="flex items-center gap-1.5"
        >
          <MessageSquare className="h-4 w-4" /> {post.commentCount}
        </button>
        {!isAuthor && (
          <div className="relative ml-auto">
            <button
              type="button"
              onClick={() => setShareComposerOpen((value) => !value)}
              className="flex items-center gap-1.5"
              aria-label="Share post"
              disabled={Boolean(post.shared)}
            >
              <Share2 className="h-4 w-4" />
              {shareStatus || (post.shared ? "Shared" : "Share")}
            </button>
            {shareComposerOpen && !post.shared && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                onClick={() => {
                  setShareComposerOpen(false);
                  setShareMessage("");
                }}
              >
                <div
                  className="w-full max-w-xl rounded-2xl border bg-card p-6 text-left shadow-2xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar src={user?.avatar} size={44} />
                    <p className="text-base font-semibold">{user?.name || user?.username}</p>
                  </div>
                  <div className="mt-5 rounded-xl border p-4">
                    <div className="flex items-center gap-2">
                      <UserAvatar src={post.author.avatar} size={32} />
                      <p className="text-sm font-semibold">{post.author.name}</p>
                    </div>
                    {post.text && (
                      <p className="mt-2 line-clamp-3 text-sm text-secondary-foreground">
                        {post.text}
                      </p>
                    )}
                    {post.image && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {post.mediaType === "video" ? "Video" : "Photo"} attached
                      </p>
                    )}
                  </div>
                  <label
                    className="mt-5 block text-sm font-semibold"
                    htmlFor={`share-message-${post.id}`}
                  >
                    Your message
                  </label>
                  <textarea
                    id={`share-message-${post.id}`}
                    autoFocus
                    value={shareMessage}
                    onChange={(event) => setShareMessage(event.target.value)}
                    placeholder="Say something about this..."
                    maxLength={1000}
                    rows={5}
                    className="mt-5 min-h-32 w-full resize-none rounded-xl bg-muted p-4 text-base outline-none"
                  />
                  <p className="mt-2 text-right text-xs text-muted-foreground">
                    {shareMessage.length}/1000
                  </p>
                  <div className="mt-5 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShareComposerOpen(false);
                        setShareMessage("");
                      }}
                      className="rounded-lg px-4 py-2.5 text-base font-medium hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={sharePost}
                      disabled={sharing}
                      className="rounded-lg bg-primary px-5 py-2.5 text-base font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      {sharing ? "Sharing..." : "Share now"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <button onClick={toggleBookmark} aria-label="Bookmark">
          <Bookmark className={cn("h-4 w-4", post.bookmarked && "fill-primary text-primary")} />
        </button>
      </div>
      {editShareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setEditShareOpen(false)}
        >
          <form
            onSubmit={saveShareCaption}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-xl rounded-2xl border bg-card p-6 text-left shadow-2xl"
          >
            <h2 className="text-lg font-bold">Edit shared post</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Update the message you added when sharing this post.
            </p>
            <div className="mt-5 rounded-xl border p-4">
              <div className="flex items-center gap-2">
                <UserAvatar src={post.author.avatar} size={32} />
                <p className="text-sm font-semibold">{post.author.name}</p>
              </div>
              {post.text && (
                <p className="mt-2 line-clamp-3 text-sm text-secondary-foreground">{post.text}</p>
              )}
            </div>
            <textarea
              autoFocus
              value={editShareMessage}
              onChange={(event) => setEditShareMessage(event.target.value)}
              placeholder="Say something about this..."
              maxLength={1000}
              rows={5}
              className="mt-5 min-h-32 w-full resize-none rounded-xl bg-muted p-4 text-base outline-none"
            />
            <p className="mt-2 text-right text-xs text-muted-foreground">
              {editShareMessage.length}/1000
            </p>
            {editShareError && <p className="mt-2 text-sm text-destructive">{editShareError}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditShareOpen(false)}
                className="rounded-lg px-4 py-2.5 text-base font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingShare}
                className="rounded-lg bg-primary px-5 py-2.5 text-base font-semibold text-primary-foreground disabled:opacity-60"
              >
                {savingShare ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}
      {open && (
        <CommentsModal
          post={post}
          likes={post.likesCount}
          liked={post.liked}
          onLike={toggleLike}
          onCommentAdded={() => update({ commentCount: post.commentCount + 1 })}
          onClose={() => setOpen(false)}
        />
      )}
    </article>
  );
}
