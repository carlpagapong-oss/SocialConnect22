import { useRef, useState } from "react";
import { Image, Video, X } from "lucide-react";
import { UserAvatar } from "@/components/common/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { postService } from "@/services/postService";

export function CreatePost({ onCreated }) {
  const { user } = useAuth();
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [media, setMedia] = useState(null);
  const photoInput = useRef(null);
  const videoInput = useRef(null);
  const [error, setError] = useState("");

  const create = async () => {
    if ((!draft.trim() && !media) || posting || uploading) return;
    setPosting(true);
    setError("");
    try {
      const { post } = await postService.create(draft.trim(), media
        ? { image: media.url, mediaType: media.mediaType }
        : undefined);
      onCreated(post);
      setDraft("");
      setMedia(null);
      setExpanded(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const chooseMedia = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = await postService.uploadMedia(file);
      setMedia({ ...uploaded, preview: URL.createObjectURL(file), name: file.name });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const clearMedia = () => {
    if (media?.preview) URL.revokeObjectURL(media.preview);
    setMedia(null);
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="p-4">
        {!expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex w-full items-center gap-3 text-left"
          >
            <UserAvatar src={user?.avatar} />
            <span className="flex h-10 flex-1 items-center rounded-full bg-muted px-4 text-sm text-muted-foreground">
              What&apos;s on your mind?
            </span>
          </button>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Create post</h2>
              <button
                type="button"
                onClick={() => {
                  setExpanded(false);
                  setDraft("");
                  clearMedia();
                  setError("");
                }}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted"
                aria-label="Close post composer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 flex gap-3">
              <UserAvatar src={user?.avatar} />
              <textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`What's on your mind, ${user?.name || ""}?`}
                maxLength={1000}
                rows={4}
                className="min-h-24 flex-1 resize-none rounded-lg bg-muted p-3 text-sm outline-none"
              />
            </div>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
              <span className="mr-auto text-sm font-semibold text-secondary-foreground">
                Add to your post
              </span>
              <button type="button" onClick={() => photoInput.current?.click()} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-green-700 hover:bg-muted">
                <Image className="h-5 w-5" /> Photo
              </button>
              <button type="button" onClick={() => videoInput.current?.click()} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-muted">
                <Video className="h-5 w-5" /> Video
              </button>
            </div>
            <input ref={photoInput} type="file" accept="image/*" onChange={chooseMedia} className="hidden" />
            <input ref={videoInput} type="file" accept="video/*" onChange={chooseMedia} className="hidden" />
            {uploading && <p className="mt-2 text-xs text-muted-foreground">Uploading media...</p>}
            {media && (
              <div className="relative mt-3 overflow-hidden rounded-lg border">
                {media.mediaType === "video" ? (
                  <video src={media.preview} controls className="max-h-64 w-full bg-black object-contain" />
                ) : (
                  <img src={media.preview} alt={media.name} className="max-h-64 w-full object-contain" />
                )}
                <button
                  type="button"
                  onClick={clearMedia}
                  className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs text-white"
                >
                  Remove
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={create}
              disabled={posting || uploading || (!draft.trim() && !media)}
              className="mt-3 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {uploading ? "Uploading..." : posting ? "Posting..." : "Post"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
