import { useEffect, useRef, useState } from "react";
import { Camera, Check, Move, Pencil, Trash2, Upload, X } from "lucide-react";
import { UserAvatar } from "@/components/common/Avatar";
import { EmptyState } from "@/components/common/PageState";
import { PostCard } from "@/components/post/PostCard";
import { userService } from "@/services/userService";
import { ageFromBirthday, formatBirthday, formatCount } from "@/utils/formatters";

const RELATIONSHIP_STATUSES = ["Single", "Married", "Prefer not to say"];

function buildAbout(profile) {
  const age = ageFromBirthday(profile.birthday);
  return [
    ["Age", age != null ? `${age} years old` : ""],
    ["Birthday", formatBirthday(profile.birthday)],
    ["Gender", profile.gender],
    ["Relationship status", profile.relationshipStatus],
  ].filter(([, value]) => value);
}

export function ProfileView({
  own,
  profile,
  posts,
  onPostChange,
  onPostDelete,
  onFollowToggle,
  onProfileChange,
}) {
  const about = buildAbout(profile);
  const [editing, setEditing] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [error, setError] = useState("");
  const [coverMenuOpen, setCoverMenuOpen] = useState(false);
  const [coverEditor, setCoverEditor] = useState(null);
  const [savedCoverOverride, setSavedCoverOverride] = useState(null);
  const [coverDragging, setCoverDragging] = useState(false);
  const [removingCover, setRemovingCover] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [bio, setBio] = useState(profile.bio || "");
  const [aboutForm, setAboutForm] = useState({
    birthday: profile.birthday ? String(profile.birthday).slice(0, 10) : "",
    gender: profile.gender || "",
    relationshipStatus: profile.relationshipStatus || "Prefer not to say",
  });
  const coverInput = useRef(null);
  const avatarInput = useRef(null);
  const coverDrag = useRef(null);
  const coverMenuRef = useRef(null);
  const avatarMenuRef = useRef(null);

  useEffect(() => {
    const handleOutsideMenus = (event) => {
      if (!coverMenuRef.current?.contains(event.target)) setCoverMenuOpen(false);
      if (!avatarMenuRef.current?.contains(event.target)) setAvatarMenuOpen(false);
    };
    document.addEventListener("pointerdown", handleOutsideMenus);
    return () => document.removeEventListener("pointerdown", handleOutsideMenus);
  }, []);

  const updatePhoto = async (event, field) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(field);
    setError("");
    if (field === "avatar") setAvatarMenuOpen(false);
    try {
      const uploaded = await userService.uploadMedia(file);
      await onProfileChange({ [field]: uploaded.url });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading("");
    }
  };

  const confirmRemoveAvatar = async () => {
    setSaving(true);
    setError("");
    try {
      await onProfileChange({ avatar: "" });
      setRemovingAvatar(false);
      setAvatarMenuOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openCoverEditor = (file = null) => {
    const source = file ? URL.createObjectURL(file) : profile.cover;
    if (!source) return;
    setCoverMenuOpen(false);
    setCoverEditor({
      file,
      source,
      position: file ? "50% 50%" : profile.coverPosition || "50% 50%",
    });
  };

  const selectCover = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) openCoverEditor(file);
  };

  const closeCoverEditor = () => {
    if (coverEditor?.file) URL.revokeObjectURL(coverEditor.source);
    setCoverEditor(null);
    setCoverDragging(false);
  };

  const setCoverPosition = (axis, value) => {
    const [x, y] = (coverEditor?.position || "50% 50%").split(" ");
    setCoverEditor((current) => ({
      ...current,
      position: axis === "x" ? `${value}% ${y}` : `${x} ${value}%`,
    }));
  };

  const startCoverDrag = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    const [x, y] = (coverEditor?.position || "50% 50%").split(" ").map((value) => Number.parseInt(value, 10));
    coverDrag.current = {
      startX: event.clientX,
      startY: event.clientY,
      startPositionX: x,
      startPositionY: y,
    };
    setCoverDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const dragCover = (event) => {
    if (!coverDrag.current) return;
    event.preventDefault();
    const deltaX = ((event.clientX - coverDrag.current.startX) / event.currentTarget.clientWidth) * 100;
    const deltaY = ((event.clientY - coverDrag.current.startY) / event.currentTarget.clientHeight) * 100;
    const x = Math.max(0, Math.min(100, coverDrag.current.startPositionX - deltaX));
    const y = Math.max(0, Math.min(100, coverDrag.current.startPositionY - deltaY));
    setCoverEditor((current) => ({ ...current, position: `${x}% ${y}%` }));
  };

  const stopCoverDrag = () => {
    coverDrag.current = null;
    setCoverDragging(false);
  };

  const nudgeCover = (event) => {
    const increments = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const increment = increments[event.key];
    if (!increment) return;
    event.preventDefault();
    const [x, y] = (coverEditor?.position || "50% 50%")
      .split(" ")
      .map((value) => Number.parseInt(value, 10));
    const nextX = Math.max(0, Math.min(100, x + increment[0]));
    const nextY = Math.max(0, Math.min(100, y + increment[1]));
    setCoverEditor((current) => ({ ...current, position: `${nextX}% ${nextY}%` }));
  };

  const saveCover = async () => {
    if (!coverEditor) return;
    setSaving(true);
    setError("");
    try {
      const cover = coverEditor.file
        ? (await userService.uploadMedia(coverEditor.file)).url
        : profile.cover;
      await onProfileChange({ cover, coverPosition: coverEditor.position });
      setSavedCoverOverride({ source: cover, position: coverEditor.position });
      closeCoverEditor();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmRemoveCover = async () => {
    setSaving(true);
    setError("");
    try {
      await onProfileChange({ cover: "", coverPosition: "50% 50%" });
      setSavedCoverOverride(null);
      setRemovingCover(false);
      setCoverMenuOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onProfileChange({ bio });
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openAboutEditor = () => {
    setAboutForm({
      birthday: profile.birthday ? String(profile.birthday).slice(0, 10) : "",
      gender: profile.gender || "",
      relationshipStatus: profile.relationshipStatus || "Prefer not to say",
    });
    setError("");
    setEditingAbout(true);
  };

  const saveAbout = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onProfileChange(aboutForm);
      setEditingAbout(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const displayedCover = coverEditor?.source || savedCoverOverride?.source || profile.cover;
  const displayedCoverPosition =
    coverEditor?.position ||
    savedCoverOverride?.position ||
    profile.coverPosition ||
    "50% 50%";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="relative h-56">
          {displayedCover ? (
            <img
              src={displayedCover}
              alt=""
              width={1600}
              height={560}
              className="h-full w-full object-cover"
              style={{ objectPosition: displayedCoverPosition }}
            />
          ) : (
            <div
              className="h-full w-full bg-gradient-to-br from-primary via-violet-500 to-cyan-400"
              aria-label="Default cover background"
            />
          )}
          {own && (
            <div ref={coverMenuRef} className="absolute right-4 top-4">
              <button
                type="button"
                onClick={() => setCoverMenuOpen((open) => !open)}
                disabled={Boolean(uploading) || saving}
                className="flex items-center gap-2 rounded-lg bg-ink/60 px-3 py-2 text-sm text-ink-foreground disabled:opacity-60"
              >
                <Camera className="h-4 w-4" /> Edit cover
              </button>
              {coverMenuOpen && (
                <div className="absolute right-0 top-full z-10 mt-2 w-44 rounded-lg border bg-card p-1 text-sm text-foreground shadow-lg">
                  <button
                    type="button"
                    onClick={() => coverInput.current?.click()}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-muted"
                  >
                    <Upload className="h-4 w-4" /> Upload photo
                  </button>
                  <button
                    type="button"
                    onClick={() => openCoverEditor()}
                    disabled={!profile.cover}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-muted disabled:opacity-50"
                  >
                    <Move className="h-4 w-4" /> Reposition
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCoverMenuOpen(false);
                      setRemovingCover(true);
                    }}
                    disabled={!profile.cover}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-destructive hover:bg-muted disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                </div>
              )}
            </div>
          )}
          {own && (
            <input
              ref={coverInput}
              type="file"
              accept="image/*"
              onChange={selectCover}
              className="hidden"
            />
          )}
        </div>
        <div className="relative px-7 pb-6">
          <div className="-mt-12 flex items-end justify-between">
            <div className="relative">
              <UserAvatar
                size={100}
                src={profile.avatar}
                className="rounded-2xl border-4 border-card"
              />
              {own && (
                <div ref={avatarMenuRef} className="absolute -bottom-1 -right-1">
                  <button
                    type="button"
                    onClick={() => setAvatarMenuOpen((open) => !open)}
                    disabled={Boolean(uploading) || saving}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-card disabled:opacity-60"
                    aria-label="Edit profile picture"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  {avatarMenuOpen && (
                    <div className="absolute left-0 top-full z-10 mt-2 w-44 rounded-lg border bg-card p-1 text-sm text-foreground shadow-lg">
                      <button
                        type="button"
                        onClick={() => avatarInput.current?.click()}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-muted"
                      >
                        <Upload className="h-4 w-4" /> Upload photo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarMenuOpen(false);
                          setRemovingAvatar(true);
                        }}
                        disabled={!profile.avatar}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-destructive hover:bg-muted disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" /> Remove photo
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {own && (
              <input
                ref={avatarInput}
                type="file"
                accept="image/*"
                onChange={(event) => updatePhoto(event, "avatar")}
                className="hidden"
              />
            )}
            {own ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit bio
              </button>
            ) : profile.role !== "admin" && onFollowToggle ? (
              <button
                onClick={onFollowToggle}
                className={
                  profile.isFollowing
                    ? "rounded-lg border px-5 py-2 text-sm font-medium"
                    : "rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-button"
                }
              >
                {profile.isFollowing ? "Following" : "Follow"}
              </button>
            ) : null}
          </div>
          <h1 className="mt-4 text-2xl font-extrabold">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">
            @{profile.username} · <span className="text-success">Active</span>
          </p>
          {profile.bio && <p className="mt-3 text-sm text-secondary-foreground">{profile.bio}</p>}
          {uploading && <p className="mt-2 text-xs text-muted-foreground">Uploading photo...</p>}
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          <p className="mt-3 flex gap-5 text-sm text-muted-foreground">
            <span>
              <b className="text-foreground">{formatCount(profile.followingCount)}</b> Following
            </span>
            <span>
              <b className="text-foreground">{formatCount(profile.followersCount)}</b> Followers
            </span>
          </p>
        </div>
      </section>
      <div className="grid gap-6 md:grid-cols-[1fr_250px]">
        <div className="space-y-5">
          <div className="border-b">
            <span className="inline-block border-b-2 border-primary pb-2 text-sm font-semibold text-primary">
              Posts
            </span>
          </div>
          {posts.length === 0 && (
            <EmptyState
              title="No posts yet"
              hint={own ? "Share something from the Home page." : undefined}
            />
          )}
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onChange={onPostChange} onDelete={onPostDelete} />
          ))}
        </div>
        <aside className="h-fit rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">About</h2>
            {own && (
              <button
                type="button"
                onClick={openAboutEditor}
                className="rounded p-1 text-primary hover:bg-muted"
                aria-label="Edit about information"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <dl className="mt-3 space-y-3">
            {about.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="text-sm font-medium">{v}</dd>
              </div>
            ))}
            {about.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing here yet.</p>
            )}
          </dl>
        </aside>
      </div>
      {editing && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setEditing(false)}
        >
          <form
            onSubmit={saveProfile}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Edit bio</h2>
              <button type="button" onClick={() => setEditing(false)} aria-label="Close edit bio">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium">
                Bio
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background p-2.5"
                  rows={3}
                  maxLength={500}
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="mt-5 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>
      )}
      {coverEditor && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4"
          onClick={closeCoverEditor}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {coverEditor.file ? "Upload cover photo" : "Reposition cover photo"}
              </h2>
              <button type="button" onClick={closeCoverEditor} aria-label="Cancel cover editing">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div
                      className="relative mt-4 cursor-grab select-none touch-none overflow-hidden rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
              role="application"
              tabIndex={0}
              aria-label="Cover photo reposition area. Drag the image or use the arrow keys."
              onPointerDown={startCoverDrag}
              onPointerMove={dragCover}
              onPointerUp={stopCoverDrag}
              onPointerCancel={stopCoverDrag}
              onKeyDown={nudgeCover}
            >
              <img
                src={coverEditor.source}
                alt="Cover preview"
                draggable="false"
                className="h-56 w-full select-none object-cover"
                style={{ objectPosition: coverEditor.position }}
              />
              <div
                className={`pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-lg bg-black/70 px-3 py-2 text-sm font-semibold text-white transition-opacity duration-200 ${
                  coverDragging ? "opacity-0" : "opacity-100"
                }`}
              >
                <Move className="h-4 w-4" />
                Drag to reposition the image
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Click the preview first if you want to use the arrow keys.
            </p>
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeCoverEditor}
                disabled={saving}
                className="rounded-lg border px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCover}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                <Check className="h-4 w-4" /> {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
      {removingCover && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setRemovingCover(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-bold">Remove cover photo</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Are you sure you want to delete cover photo?
            </p>
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRemovingCover(false)}
                disabled={saving}
                className="rounded-lg border px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveCover}
                disabled={saving}
                className="rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Removing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
      {removingAvatar && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setRemovingAvatar(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-bold">Remove profile photo</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Are you sure you want to remove your profile photo?
            </p>
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRemovingAvatar(false)}
                disabled={saving}
                className="rounded-lg border px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveAvatar}
                disabled={saving}
                className="rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Removing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
      {editingAbout && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setEditingAbout(false)}
        >
          <form
            onSubmit={saveAbout}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Edit about</h2>
              <button
                type="button"
                onClick={() => setEditingAbout(false)}
                aria-label="Close edit about"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium">
                Birthday
                <input
                  type="date"
                  value={aboutForm.birthday}
                  onChange={(event) => setAboutForm({ ...aboutForm, birthday: event.target.value })}
                  className="mt-1 w-full rounded-lg border bg-background p-2.5"
                />
              </label>
              <label className="block text-sm font-medium">
                Gender
                <input
                  value={aboutForm.gender}
                  onChange={(event) => setAboutForm({ ...aboutForm, gender: event.target.value })}
                  className="mt-1 w-full rounded-lg border bg-background p-2.5"
                />
              </label>
              <label className="block text-sm font-medium">
                Relationship status
                <select
                  value={aboutForm.relationshipStatus}
                  onChange={(event) =>
                    setAboutForm({ ...aboutForm, relationshipStatus: event.target.value })
                  }
                  className="mt-1 w-full rounded-lg border bg-background p-2.5"
                >
                  {RELATIONSHIP_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="mt-5 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save about"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
