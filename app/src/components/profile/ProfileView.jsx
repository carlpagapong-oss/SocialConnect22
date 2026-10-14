import { Camera, Pencil } from "lucide-react";
import defaultCover from "@/assets/cover-friends.jpg";
import { UserAvatar } from "@/components/common/Avatar";
import { EmptyState } from "@/components/common/PageState";
import { PostCard } from "@/components/post/PostCard";
import { ageFromBirthday, formatBirthday, formatCount } from "@/utils/formatters";

function buildAbout(profile) {
  const age = ageFromBirthday(profile.birthday);
  return [
    ["Age", age != null ? `${age} years old` : ""],
    ["Birthday", formatBirthday(profile.birthday)],
    ["Gender", profile.gender],
    ["Relationship status", profile.relationshipStatus],
  ].filter(([, value]) => value);
}

export function ProfileView({ own, profile, posts, onPostChange, onFollowToggle }) {
  const about = buildAbout(profile);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="relative h-56">
          <img
            src={profile.cover || defaultCover}
            alt=""
            width={1600}
            height={560}
            className="h-full w-full object-cover"
          />
          {own && (
            <button className="absolute right-4 top-4 flex items-center gap-2 rounded-lg bg-ink/60 px-3 py-2 text-sm text-ink-foreground">
              <Camera className="h-4 w-4" /> Edit cover
            </button>
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
                <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-card">
                  <Camera className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
            {own ? (
              <button className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm">
                <Pencil className="h-3.5 w-3.5" /> Edit profile
              </button>
            ) : (
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
            )}
          </div>
          <h1 className="mt-4 text-2xl font-extrabold">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">
            @{profile.username} · <span className="text-success">Active</span>
          </p>
          {profile.bio && <p className="mt-3 text-sm text-secondary-foreground">{profile.bio}</p>}
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
            <PostCard key={p.id} post={p} onChange={onPostChange} />
          ))}
        </div>
        <aside className="h-fit rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">About</h2>
            {own && <Pencil className="h-3.5 w-3.5 text-primary" />}
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
    </div>
  );
}
