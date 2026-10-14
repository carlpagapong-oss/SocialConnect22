import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileView } from "@/components/profile/ProfileView";
import { ErrorMessage, Loading } from "@/components/common/PageState";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { usePosts } from "@/hooks/usePosts";
import { userService } from "@/services/userService";

export default function ProfilePage() {
  usePageTitle("My profile — Social Connect");
  const { user } = useAuth();
  const [profile, setProfile] = useState(user);
  const { posts, loading, error, reload, updatePost } = usePosts(
    () => userService.getPosts(user.username),
    [user.username],
  );

  // Refresh follower counts etc. from the server.
  useEffect(() => {
    userService
      .getProfile(user.username)
      .then((data) => setProfile(data.user))
      .catch(() => {});
  }, [user.username]);

  return (
    <AppShell>
      {loading && <Loading label="Loading your profile..." />}
      {error && <ErrorMessage message={error} onRetry={reload} />}
      {!loading && !error && (
        <ProfileView own profile={profile} posts={posts} onPostChange={updatePost} />
      )}
    </AppShell>
  );
}
