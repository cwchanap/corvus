import { createContext, useContext, ParentComponent } from "solid-js";
import { createAsync } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";
import { createDatabase } from "../db";
import { AuthService } from "./service";
import { getSessionCookie } from "./session";
import type { User } from "../db/types";

interface AuthContextValue {
  user: () => User | undefined;
  isAuthenticated: () => boolean;
  isLoading: () => boolean;
}

const AuthContext = createContext<AuthContextValue>();

async function getCurrentUser(): Promise<User | null> {
  "use server";

  const sessionId = getSessionCookie();

  if (!sessionId) {
    return null;
  }

  const event = getRequestEvent();
  const d1Database = event?.nativeEvent.context?.cloudflare?.env?.DB;

  const db = createDatabase(d1Database);
  const authService = new AuthService(db);

  return await authService.validateSession(sessionId);
}

export const AuthProvider: ParentComponent = (props) => {
  const user = createAsync(() => getCurrentUser());

  const contextValue: AuthContextValue = {
    user: () => user() || undefined,
    isAuthenticated: () => !!user(),
    isLoading: () => user.loading,
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
