import { AppShell } from "@/components/layout/AppShell";
import { FollowRow } from "@/components/profile/FollowRow";
import { EmptyState, ErrorMessage, Loading } from "@/components/common/PageState";
import { usePageTitle } from "@/hooks/usePageTitle";
import { userService } from "@/services/userService";
import { useEffect, useState } from "react";

export default function PeoplePage() {
  usePageTitle("People — Social Connect");
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPeople = () => {
    setLoading(true);
    setError("");
    userService
      .getDirectory()
      .then((data) => setPeople(data.users))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPeople();
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold">People</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Discover everyone with an active Social Connect account.
          </p>
        </div>
        {loading && <Loading label="Loading people..." />}
        {error && <ErrorMessage message={error} onRetry={loadPeople} />}
        {!loading && !error && people.length === 0 && (
          <EmptyState title="No other accounts yet" hint="Invite someone to join Social Connect." />
        )}
        {!loading && !error && people.length > 0 && (
          <section className="rounded-2xl border bg-card px-5">
            {people.map((person) => (
              <FollowRow key={person.id} person={person} />
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
