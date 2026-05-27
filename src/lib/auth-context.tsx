import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

export type AppRole = "contributor" | "moderator" | "admin";

interface AuthState {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null, user: null, roles: [], loading: true,
  isAdmin: false, isModerator: false, signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const syncAuthState = async (nextSession: Session | null) => {
      if (!active) return;
      setLoading(true);
      setSession(nextSession);

      if (nextSession?.user) {
        await loadRoles(nextSession.user.id);
      } else {
        setRoles([]);
      }

      if (!active) return;
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      router.invalidate();
      qc.invalidateQueries();
      void syncAuthState(s);
    });

    supabase.auth.getSession().then(({ data }) => {
      void syncAuthState(data.session);
    });

    return () => { active = false; subscription.unsubscribe(); };
  }, [qc, router]);

  const loadRoles = async (uid: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setRoles((data ?? []).map((r) => r.role as AppRole));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
  };

  const value: AuthState = {
    session,
    user: session?.user ?? null,
    roles,
    loading,
    isAdmin: roles.includes("admin"),
    isModerator: roles.includes("moderator") || roles.includes("admin"),
    signOut,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
