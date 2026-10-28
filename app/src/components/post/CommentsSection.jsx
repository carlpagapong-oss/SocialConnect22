import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Send } from "lucide-react";
import { UserAvatar } from "@/components/common/Avatar";
import { postService } from "@/services/postService";
import { timeAgo } from "@/utils/formatters";
import { useAuth } from "@/hooks/useAuth";

export function CommentsSection({ post, onCommentAdded, onCommentRemoved, sectionRef }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const menuRefs = useRef({});
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    postService
      .getComments(post.id)
      .then((data) => setComments(data.comments))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [post.id]);

  useEffect(() => {
    const handleOutside = (event) => {
      const anyOpen = Object.values(menuRefs.current).some((ref) => ref?.contains(event.target));
      if (!anyOpen) setMenuOpenId(null);
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, []);

  const submit = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const { comment } = await postService.addComment(post.id, text.trim());
      setComments((current) => [...current, comment]);
      setText("");
      onCommentAdded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const deleteComment = async (commentId) => {
    if (deletingId) return;
    setDeletingId(commentId);
    setError("");
    try {
      await postService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => String(c.id) !== String(commentId)));
      onCommentRemoved?.();
      setMenuOpenId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section ref={sectionRef} className="rounded-2xl border bg-card p-5">
      <h2 className="text-sm font-bold">Comments</h2>
      {loading && <p className="mt-4 text-sm text-muted-foreground">Loading comments...</p>}
      {!loading && comments.length === 0 && (
        <p className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          No comments yet. Be the first to comment.
        </p>
      )}
      <div className="mt-4 space-y-4">
        {comments.map((comment) => {
          const isOwner = String(user?.id) === String(comment.author?.id);
          return (
            <div key={comment.id} className="flex gap-3">
              <UserAvatar size={34} src={comment.author.avatar} />
              <div className="min-w-0 flex-1">
                <div className="relative rounded-2xl bg-muted px-4 py-2.5 pr-8">
                  <p className="text-sm font-semibold">{comment.author.name}</p>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-secondary-foreground">
                    {comment.text}
                  </p>
                  {isOwner && (
                    <div
                      ref={(el) => {
                        menuRefs.current[comment.id] = el;
                      }}
                      className="absolute right-1 top-1"
                    >
                      <button
                        type="button"
                        onClick={() => setMenuOpenId((id) => (id === comment.id ? null : comment.id))}
                        className="rounded-full p-1 text-muted-foreground hover:bg-background/60"
                        aria-label="Comment options"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {menuOpenId === comment.id && (
                        <div className="absolute right-0 top-7 z-10 min-w-28 rounded-lg border bg-card p-1 shadow-lg">
                          <button
                            type="button"
                            onClick={() => deleteComment(comment.id)}
                            disabled={deletingId === comment.id}
                            className="w-full rounded-md px-3 py-1.5 text-left text-sm text-destructive hover:bg-muted"
                          >
                            {deletingId === comment.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="mt-1 px-2 text-xs text-muted-foreground">
                  {timeAgo(comment.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      <div className="mt-5 flex items-center gap-2 border-t pt-4">
        <input
          id={`comment-input-${post.id}`}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && submit()}
          placeholder="Write a comment..."
          maxLength={500}
          className="h-11 flex-1 rounded-full bg-muted px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={submit}
          disabled={sending || !text.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
          aria-label="Post comment"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
