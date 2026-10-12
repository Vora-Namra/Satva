import { useMemo } from "react";
import { useAppSelector } from "./useAppSelector";

export function useAuth() {
  const auth = useAppSelector((state) => state.auth);

  return useMemo(
    () => ({
      ...auth,
      isAuthenticated: Boolean(auth.accessToken && auth.user),
      role: auth.user?.role,
    }),
    [auth],
  );
}
