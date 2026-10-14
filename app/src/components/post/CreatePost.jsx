import { useState } from "react";
import { Calendar, Image, Smile, Video } from "lucide-react";
import { UserAvatar } from "@/components/common/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { postService } from "@/services/postService";

const attachments = [
  { icon: Image, label: "Photo" },
  { icon: Video, label: "Video" },
  { icon: Smile, label: "Feeling" },
  { icon: Calendar, label: "Event" },
];

export function CreatePost({ onCreated }) {
  const { user } = useAuth();
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const create = async () => {
    if (!draft.trim() || posting) return;
    setPosting(true);
    setError("");
    try {
      const { post } = await postService.create(draft.trim());
      onCreated(post);
      setDraft("");
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="h-1 bg-strip" />
      <div className="p-4">
        <div className="flex gap-3">
          <UserAvatar src={user?.avatar} />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="What's happening in your world?"
            maxLength={1000}
            className="h-10 flex-1 rounded-lg bg-muted px-3.5 text-sm outline-none"
          />
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <div className="mt-3 flex items-center gap-5 border-t pt-3 text-sm text-secondary-foreground">
          {attachments.map(({ icon: Icon, label }) => (
            <span key={label} className="hidden items-center gap-1.5 sm:flex">
              <Icon className="h-4 w-4" />
              {label}
            </span>
          ))}
          <button
            onClick={create}
            disabled={posting}
            className="ml-auto rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {posting ? "Posting..." : "Create post"}
          </button>
        </div>
      </div>
    </div>
  );
}
