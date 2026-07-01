"use client";

import { clearToken, getToken, syncToken } from "@/services/api-client";
import { handleError } from "@/utils/errors";
import { getMe, type PortalMeResponse } from "@/services/auth/auth";
import DialogHost from "@/components/util/DialogHost";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AppContextValue = {
  authStatus: AuthStatus;
  me: PortalMeResponse | null;
  isAuthenticated: boolean;
  fetchMe: () => Promise<PortalMeResponse | null>;
};

const AppContext = createContext<AppContextValue | null>(null);

export default function AppProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [me, setMe] = useState<PortalMeResponse | null>(null);
  const meRef = useRef<PortalMeResponse | null>(null);

  const fetchMe = useCallback(async () => {
    if (!getToken()) {
      meRef.current = null;
      setMe(null);
      setAuthStatus("unauthenticated");
      return null;
    }

    if (!meRef.current) {
      setAuthStatus("loading");
    }

    try {
      const profile = await getMe();
      meRef.current = profile;
      setMe(profile);
      setAuthStatus("authenticated");
      return profile;
    } catch (error) {
      if (handleError(error).status === 401) {
        clearToken();
      }
      meRef.current = null;
      setMe(null);
      setAuthStatus("unauthenticated");
      return null;
    }
  }, []);

  useEffect(() => {
    syncToken();
    void fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      void fetchMe();
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [fetchMe]);

  const value = useMemo<AppContextValue>(
    () => ({
      authStatus,
      me,
      isAuthenticated: authStatus === "authenticated" || Boolean(me),
      fetchMe,
    }),
    [authStatus, fetchMe, me],
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <DialogHost />
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};
