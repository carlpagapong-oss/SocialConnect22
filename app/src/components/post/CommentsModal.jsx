import { useEffect, useState } from "react";
import { Globe2, Heart, MessageCircle, Send, X } from "lucide-react";
import { UserAvatar } from "@/components/common/Avatar";
import { postService } from "@/services/postService";
import { timeAgo } from "@/utils/formatters";

export function CommentsModal({ post, likes, onCommentAdded, onClose }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    postService
      .getComments(post.id)
      .then((data) => setComments(data.comments))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [post.id]);

  const submit = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const { comment } = await postService.addComment(post.id, text.trim());
      setComments((prev) => [...prev, comment]);
      setText("");
      onCommentAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-card shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="text-lg font-bold">Post</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted"
            aria-label="Close post and comments"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <article className="border-b px-5 py-4">
            <div className="flex gap-3">
              <UserAvatar src={post.author.avatar} />
              <div className="min-w-0">
                  <p className="text-sm font-semibold">{post.author.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    {timeAgo(post.createdAt)} · <Globe2 className="h-3 w-3" aria-label="Public post" />
                </p>
              </div>
            </div>
            {post.text && (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-secondary-foreground">
                {post.text}
              </p>
            )}
            {post.image && post.mediaType === "video" && (
              <video
                src={post.image}
                controls
                className="mt-4 max-h-96 w-full rounded-xl bg-black object-contain"
              />
            )}
            {post.image && post.mediaType !== "video" && (
              <img
                src={post.image}
                alt=""
                className="mt-4 max-h-96 w-full rounded-xl object-contain"
              />
            )}
            <div className="mt-4 flex items-center gap-5 border-t pt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Heart className="h-4 w-4" /> {likes} likes
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4" /> {comments.length} comments
              </span>
            </div>
          </article>

          <section className="px-5 py-4">
            <h4 className="text-sm font-semibold">Comments</h4>
            {loading && <p className="mt-4 text-sm text-muted-foreground">Loading comments...</p>}
            {!loading && comments.length === 0 && (
              <p className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                No comments yet. Be the first to comment.
              </p>
            )}
            <div className="mt-4 space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <UserAvatar size={34} src={comment.author.avatar} />
                  <div className="min-w-0">
                    <div className="rounded-2xl bg-muted px-4 py-2.5">
                      <p className="text-sm font-semibold">{comment.author.name}</p>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-secondary-foreground">
                        {comment.text}
                      </p>
                    </div>
                    <p className="mt-1 px-2 text-xs text-muted-foreground">
                      {timeAgo(comment.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="border-t bg-card p-4">
          {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
          <div className="flex items-center gap-2">
            <input
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
        </div>
      </div>
    </div>
  );
}
