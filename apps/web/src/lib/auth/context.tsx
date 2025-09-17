import { createContext, useContext, ParentComponent } from "solid-js";
import { createAsync } from "@solidjs/router";
import { isServer } from "solid-js/web";
import type { PublicUser } from "../db/types.js";

interface AuthContextValue {
  user: () => PublicUser | undefined;
  isAuthenticated: () => boolean;
  isLoading: () => boolean;
}

const AuthContext = createContext<AuthContextValue>();

async function getCurrentUser(): Promise<PublicUser | null> {
  "use server";
  const url = isServer ? "http://localhost:8787/api/auth/me" : "/api/auth/me";
  const response = await fetch(url);
  const data = (await response.json()) as { user: PublicUser | null };
  return data.user;
}

export const AuthProvider: ParentComponent = (props) => {
  const user = createAsync(() => getCurrentUser());

  const contextValue: AuthContextValue = {
    user: () => user() || undefined,
    isAuthenticated: () => !!user(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isLoading: () => (user as any).state === "pending",
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {props.children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
