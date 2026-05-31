import { useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const fetchUserRole = useCallback(async (userId: string): Promise<AppRole | null> => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role:", error);
        return null;
      }

      return data?.role || null;
    } catch (error) {
      console.error("Error in fetchUserRole:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    const isMountedRef = { current: true };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMountedRef.current) return;

        // Only synchronous state updates here
        setAuthState((prev) => ({
          ...prev,
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session?.user,
        }));

        // Defer Supabase calls with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(async () => {
            if (!isMountedRef.current) return;
            const role = await fetchUserRole(session.user.id);
            if (!isMountedRef.current) return;
            setAuthState((prev) => ({
              ...prev,
              role,
              isLoading: false,
            }));
          }, 0);
        } else {
          setAuthState((prev) => ({
            ...prev,
            role: null,
            isLoading: false,
          }));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMountedRef.current) return;
      
      if (session?.user) {
        const role = await fetchUserRole(session.user.id);
        if (!isMountedRef.current) return;
        setAuthState({
          session,
          user: session.user,
          role,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setAuthState({
          session: null,
          user: null,
          role: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { data: null, error };
    }

    // Fetch role after successful sign in
    if (data.user) {
      const role = await fetchUserRole(data.user.id);
      return { data: { ...data, role }, error: null };
    }

    return { data, error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setAuthState({
        user: null,
        session: null,
        role: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
    return { error };
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata,
      },
    });

    return { data, error };
  };

  return {
    ...authState,
    signIn,
    signOut,
    signUp,
    isAdmin: authState.role === "admin",
    isStudent: authState.role === "student",
    isHOD: authState.role === "hod",
    isAuthority: authState.role === "authority",
  };
}
