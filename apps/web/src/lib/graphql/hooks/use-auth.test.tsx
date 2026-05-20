import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@solidjs/testing-library";
import { type JSX } from "solid-js";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { useCurrentUser, useLogout } from "./use-auth";

vi.mock("../auth", () => ({
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
}));

import { getCurrentUser, logout } from "../auth";

const mockedGetCurrentUser = vi.mocked(getCurrentUser);
const mockedLogout = vi.mocked(logout);

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function Wrapper(props: { children: JSX.Element; client?: QueryClient }) {
  return (
    <QueryClientProvider client={props.client ?? createTestQueryClient()}>
      {props.children}
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCurrentUser", () => {
  it("fetches current user and displays result", async () => {
    const mockUser = {
      id: "user-1",
      email: "alice@example.com",
      name: "Alice",
      createdAt: "",
      updatedAt: "",
    };
    mockedGetCurrentUser.mockResolvedValueOnce(mockUser);

    function Component() {
      const query = useCurrentUser();
      return (
        <div>
          {query.isLoading ? "Loading..." : (query.data?.email ?? "no user")}
        </div>
      );
    }

    render(() => (
      <Wrapper>
        <Component />
      </Wrapper>
    ));

    await waitFor(() => {
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    });

    expect(mockedGetCurrentUser).toHaveBeenCalled();
  });

  it("returns null when not authenticated", async () => {
    mockedGetCurrentUser.mockResolvedValueOnce(null);

    function Component() {
      const query = useCurrentUser();
      return (
        <div>
          {query.isLoading
            ? "Loading..."
            : query.data === null
              ? "no user"
              : "has user"}
        </div>
      );
    }

    render(() => (
      <Wrapper>
        <Component />
      </Wrapper>
    ));

    await waitFor(() => {
      expect(screen.getByText("no user")).toBeInTheDocument();
    });
  });

  it("does not retry on error", async () => {
    mockedGetCurrentUser.mockRejectedValue(new Error("Unauthorized"));

    function Component() {
      const query = useCurrentUser();
      return <div>{query.isError ? "error" : "ok"}</div>;
    }

    render(() => (
      <Wrapper>
        <Component />
      </Wrapper>
    ));

    await waitFor(() => {
      expect(screen.getByText("error")).toBeInTheDocument();
    });

    expect(mockedGetCurrentUser).toHaveBeenCalledTimes(1);
  });
});

describe("useLogout", () => {
  it("clears user cache and invalidates queries on logout", async () => {
    mockedLogout.mockResolvedValueOnce(true);

    const testClient = createTestQueryClient();
    testClient.setQueryData(["auth", "me"], { id: "user-1" });
    const invalidateSpy = vi.spyOn(testClient, "invalidateQueries");

    function Component() {
      const mutation = useLogout();
      return (
        <div>
          <button onClick={() => mutation.mutate()}>Logout</button>
          <span>{mutation.isSuccess ? "logged out" : "idle"}</span>
        </div>
      );
    }

    render(() => (
      <Wrapper client={testClient}>
        <Component />
      </Wrapper>
    ));

    screen.getByText("Logout").click();

    await waitFor(() => {
      expect(screen.getByText("logged out")).toBeInTheDocument();
    });

    expect(testClient.getQueryData(["auth", "me"])).toBeNull();
    expect(invalidateSpy).toHaveBeenCalled();
  });
});
