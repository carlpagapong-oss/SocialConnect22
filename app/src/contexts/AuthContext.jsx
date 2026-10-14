import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { authService } from "@/services/authService";
import { tokenStore, UNAUTHORIZED_EVENT } from "@/services/api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  // Restore the session on first load.
  useEffect(() => {
    if (!tokenStore.get()) return;
    authService
      .me()
      .then(({ user }) => setUser(user))
      .catch(signOut)
      .finally(() => setLoading(false));
  }, [signOut]);

  // Sign out automatically when any request comes back 401.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, signOut);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, signOut);
  }, [signOut]);

  const handleAuthSuccess = useCallback(({ token, user }) => {
    tokenStore.set(token);
    setUser(user);
    return user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login: async (identifier, password) =>
        handleAuthSuccess(await authService.login(identifier, password)),
      register: async (payload) => handleAuthSuccess(await authService.register(payload)),
      logout: signOut,
      updateUser: setUser,
    }),
    [user, loading, handleAuthSuccess, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
