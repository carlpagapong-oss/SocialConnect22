import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorMessage, Loading } from "@/components/common/PageState";
import { PostCard } from "@/components/post/PostCard";
import { CommentsSection } from "@/components/post/CommentsSection";
import { postService } from "@/services/postService";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function PostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const [imageOpen, setImageOpen] = useState(false);
  const commentsRef = useRef(null);
  usePageTitle("Post — Social Connect");

  useEffect(() => {
    setPost(null);
    setError("");
    postService
      .get(id)
      .then((data) => setPost(data.post))
      .catch((err) => setError(err.message));
  }, [id]);

  const scrollToComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => document.getElementById(`comment-input-${id}`)?.focus(), 350);
  };

  useEffect(() => {
    if (!imageOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setImageOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [imageOpen]);

  return (
    <AppShell>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/60 p-3 sm:p-6">
        <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl">
          <header className="flex shrink-0 items-center justify-between border-b px-5 py-4">
            <h1 className="text-lg font-bold">Post</h1>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-full p-2 text-muted-foreground hover:bg-muted"
              aria-label="Close post"
            >
              <X className="h-5 w-5" />
            </button>
          </header>
          <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
            {error && <ErrorMessage message={error} />}
            {!error && !post && <Loading label="Loading post..." />}
            {post && (
              <div className="space-y-5">
                <PostCard
                  post={post}
                  onChange={setPost}
                  onDelete={() => navigate(-1)}
                  onCommentsClick={scrollToComments}
                  onImageClick={() => setImageOpen(true)}
                />
                <CommentsSection
                  post={post}
                  sectionRef={commentsRef}
                  onCommentAdded={() =>
                    setPost((current) => ({
                      ...current,
                      commentCount: (current.commentCount || 0) + 1,
                    }))
                  }
                  onCommentRemoved={() =>
                    setPost((current) => ({
                      ...current,
                      commentCount: Math.max(0, (current.commentCount || 0) - 1),
                    }))
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
      {imageOpen && post?.image && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setImageOpen(false)}
        >
          <img
            src={post.image}
            alt="Post"
            className="max-h-full max-w-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setImageOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            aria-label="Close photo"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
    </AppShell>
  );
}
