import { useEffect, useState } from "react";
import { X } from "lucide-react";
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
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-card md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {post.image && (
          <img
            src={post.image}
            alt=""
            className="max-h-72 w-full object-cover md:max-h-none md:w-3/5"
          />
        )}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="font-bold">
              Comments <span className="text-muted-foreground">{comments.length}</span>
            </h3>
            <button onClick={onClose} aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {loading && <p className="text-sm text-muted-foreground">Loading comments...</p>}
            {!loading && comments.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No comments yet. Start the conversation!
              </p>
            )}
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <UserAvatar size={34} src={c.author.avatar} />
                <div>
                  <p className="text-sm">
                    <span className="font-medium">{c.author.name}</span>{" "}
                    <span className="text-muted-foreground">
                      @{c.author.username} · {timeAgo(c.createdAt)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-secondary-foreground">{c.text}</p>
                  <div className="mt-1 flex gap-4 text-xs font-medium text-muted-foreground">
                    <button>Like</button>
                    <button>Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t p-4">
            <p className="mb-3 text-sm">
              <b>{likes} likes</b> ·{" "}
              <span className="text-muted-foreground">{comments.length} comments</span>
            </p>
            {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Write a comment..."
                maxLength={500}
                className="h-10 flex-1 rounded-lg bg-muted px-3 text-sm outline-none"
              />
              <button
                onClick={submit}
                disabled={sending}
                className="rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
