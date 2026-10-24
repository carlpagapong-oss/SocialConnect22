import { useState } from "react";
import { Link } from "react-router-dom";
import { UserAvatar } from "@/components/common/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { userService } from "@/services/userService";

export function FollowRow({ person }) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(person.isFollowing);
  const canFollow = user?.role !== "admin" && person.role !== "admin";

  const toggle = async () => {
    setFollowing(!following);
    try {
      const { user } = await userService.toggleFollow(person.username);
      setFollowing(user.isFollowing);
    } catch {
      setFollowing(following);
    }
  };

  return (
    <div className="grid grid-cols-[36px_minmax(0,1fr)_88px] items-center gap-3 py-3">
      <Link to={`/user/${person.username}`}>
        <UserAvatar size={36} src={person.avatar} />
      </Link>
      <Link to={`/user/${person.username}`} className="min-w-0 text-sm leading-tight">
        <p className="truncate font-medium">{person.name}</p>
        <p className="text-xs text-muted-foreground">@{person.username}</p>
      </Link>
      {canFollow && (
        <button
          onClick={toggle}
          className={
            following
              ? "w-[88px] justify-self-end rounded-lg bg-primary px-2 py-1.5 text-center text-sm text-primary-foreground"
              : "w-[88px] justify-self-end rounded-lg bg-accent px-2 py-1.5 text-center text-sm text-accent-foreground"
          }
        >
          {following ? "Following" : "Follow"}
        </button>
      )}
    </div>
  );
}
