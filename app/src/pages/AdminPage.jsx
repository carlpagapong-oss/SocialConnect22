import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorMessage, Loading } from "@/components/common/PageState";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/hooks/useAuth";
import { userService } from "@/services/userService";

export default function AdminPage() {
  usePageTitle("Admin — Account management");
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const loadAccounts = () => {
    setLoading(true);
    setError("");
    userService
      .getAccounts()
      .then(({ accounts: data }) => setAccounts(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const changeStatus = async (account) => {
    const status = account.account_status === "active" ? "deactivated" : "active";
    setUpdatingId(account.id);
    setError("");
    try {
      const { account: updated } = await userService.updateAccountStatus(account.id, status);
      setAccounts((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Admin</p>
          <h1 className="mt-1 text-2xl font-extrabold">Account management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Activate or deactivate existing accounts. Your own account cannot be changed here.
          </p>
        </div>
        {error && <ErrorMessage message={error} onRetry={loadAccounts} />}
        {loading ? (
          <Loading label="Loading accounts..." />
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="divide-y">
              {accounts.map((account) => {
                const isSelf = account.id === String(user.id);
                const active = account.account_status === "active";
                return (
                  <div key={account.id} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{account.name || account.username}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        @{account.username} · {account.email}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {active ? "Active" : "Deactivated"}
                      </span>
                      <button
                        type="button"
                        disabled={isSelf || updatingId === account.id}
                        onClick={() => changeStatus(account)}
                        className="rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {updatingId === account.id
                          ? "Saving..."
                          : active
                            ? "Deactivate"
                            : "Activate"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
