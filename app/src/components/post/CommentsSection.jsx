import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { UserAvatar } from "@/components/common/Avatar";
import { postService } from "@/services/postService";
import { timeAgo } from "@/utils/formatters";

export function CommentsSection({ post, onCommentAdded, sectionRef }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
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
      setComments((current) => [...current, comment]);
      setText("");
      onCommentAdded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
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
