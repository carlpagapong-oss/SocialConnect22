import { useState } from "react";
import { Link } from "react-router-dom";
import { UserAvatar } from "@/components/common/Avatar";
import { userService } from "@/services/userService";

export function FollowRow({ person }) {
  const [following, setFollowing] = useState(person.isFollowing);

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
    <div className="flex items-center gap-3 py-3">
      <Link to={`/user/${person.username}`}>
        <UserAvatar size={36} src={person.avatar} />
      </Link>
      <Link to={`/user/${person.username}`} className="flex-1 text-sm leading-tight">
        <p className="font-medium">{person.name}</p>
        <p className="text-xs text-muted-foreground">@{person.username}</p>
      </Link>
      <button
        onClick={toggle}
        className={
          following
            ? "rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground"
            : "rounded-lg bg-accent px-3 py-1.5 text-sm text-accent-foreground"
        }
      >
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );
}
