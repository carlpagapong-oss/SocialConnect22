import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileView } from "@/components/profile/ProfileView";
import { ErrorMessage, Loading } from "@/components/common/PageState";
import { useAuth } from "@/hooks/useAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { usePosts } from "@/hooks/usePosts";
import { userService } from "@/services/userService";

export default function UserProfilePage() {
  const { username } = useParams();
  const { user: me } = useAuth();
  usePageTitle(`@${username} — Social Connect`);

  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState("");
  const { posts, loading, error, updatePost } = usePosts(
    () => userService.getPosts(username),
    [username],
  );

  useEffect(() => {
    setProfile(null);
    setProfileError("");
    userService
      .getProfile(username)
      .then((data) => setProfile(data.user))
      .catch((err) => setProfileError(err.message));
  }, [username]);

  if (me?.username === username.toLowerCase()) return <Navigate to="/profile" replace />;

  const toggleFollow = async () => {
    try {
      const { user } = await userService.toggleFollow(username);
      setProfile(user);
    } catch (err) {
      setProfileError(err.message);
    }
  };

  return (
    <AppShell>
      {profileError && <ErrorMessage message={profileError} />}
      {!profileError && (!profile || loading) && <Loading label="Loading profile..." />}
      {!profileError && profile && !loading && (
        <>
          {error && <ErrorMessage message={error} />}
          <ProfileView
            own={false}
            profile={profile}
            posts={posts}
            onPostChange={updatePost}
            onFollowToggle={toggleFollow}
          />
        </>
      )}
    </AppShell>
  );
}
