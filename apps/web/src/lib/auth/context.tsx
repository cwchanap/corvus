import {
  createContext,
  useContext,
  ParentComponent,
  createMemo,
} from "solid-js";
import type { GraphQLUser } from "@repo/common/graphql/types";
import { useCurrentUser } from "../graphql/hooks/use-auth.js";

interface AuthContextValue {
  user: () => GraphQLUser | undefined;
  isAuthenticated: () => boolean;
  isLoading: () => boolean;
}

const AuthContext = createContext<AuthContextValue>();

export const AuthProvider: ParentComponent = (props) => {
  const userQuery = useCurrentUser();

  const user = createMemo(() => userQuery.data ?? undefined);
  const isAuthenticated = createMemo(() => !!userQuery.data);

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    isLoading: () => userQuery.isLoading,
  };

  return (
    <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
