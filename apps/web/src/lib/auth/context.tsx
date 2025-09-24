import {
  createContext,
  useContext,
  ParentComponent,
  createSignal,
  onMount,
} from "solid-js";
import { isServer } from "solid-js/web";
import type { PublicUser } from "../db/types.js";

interface AuthContextValue {
  user: () => PublicUser | undefined;
  isAuthenticated: () => boolean;
  isLoading: () => boolean;
}

const AuthContext = createContext<AuthContextValue>();

async function getCurrentUser(): Promise<PublicUser | null> {
  console.log("getCurrentUser: Called");

  // Skip during SSR to avoid cookie domain issues
  if (isServer) {
    console.log("getCurrentUser: Skipping during SSR to avoid cookie issues");
    return null;
  }

  // Use the relative path which will be proxied to the API server
  const url = "/api/auth/me";

  console.log("getCurrentUser: Fetching user from", url);

  try {
    const response = await fetch(url, {
      credentials: "include", // Include cookies in the request
    });

    console.log("getCurrentUser: Response status", response.status);
    console.log("getCurrentUser: Response headers", [
      ...response.headers.entries(),
    ]);

    if (!response.ok) {
      console.log("getCurrentUser: Response not ok");
      return null;
    }

    const text = await response.text();
    console.log("getCurrentUser: Response text", text);

    const data = JSON.parse(text) as { user: PublicUser | null };
    console.log("getCurrentUser: Response data", data);
    return data.user;
  } catch (e) {
    console.log("getCurrentUser: Failed to fetch", e);
    return null;
  }
}

export const AuthProvider: ParentComponent = (props) => {
  const [user, setUser] = createSignal<PublicUser | null | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = createSignal(true);

  onMount(async () => {
    console.log("AuthProvider: onMount - fetching user");
    setIsLoading(true);
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
    console.log("AuthProvider: onMount - user set to", currentUser);
  });

  const contextValue: AuthContextValue = {
    user: () => {
      const u = user();
      console.log("AuthProvider: contextValue.user()", u);
      return u || undefined;
    },
    isAuthenticated: () => {
      const u = user();
      const authenticated = !!u;
      console.log(
        "AuthProvider: contextValue.isAuthenticated()",
        authenticated,
      );
      return authenticated;
    },
    isLoading: () => isLoading(),
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
