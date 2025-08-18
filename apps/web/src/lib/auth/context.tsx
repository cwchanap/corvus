import { createContext, useContext, ParentComponent } from "solid-js";
import { createAsync } from "@solidjs/router";
import { createDatabase } from "../db.js";
import { AuthService } from "./service.js";
import { getSessionCookie } from "./session.js";
import { getD1 } from "../cloudflare.js";
import type { PublicUser } from "../db/types.js";

interface AuthContextValue {
  user: () => PublicUser | undefined;
  isAuthenticated: () => boolean;
  isLoading: () => boolean;
}

const AuthContext = createContext<AuthContextValue>();

async function getCurrentUser(): Promise<PublicUser | null> {
  "use server";

  const sessionId = getSessionCookie();

  if (!sessionId) {
    return null;
  }

  const db = createDatabase(getD1());
  const authService = new AuthService(db);

  return await authService.validateSession(sessionId);
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
