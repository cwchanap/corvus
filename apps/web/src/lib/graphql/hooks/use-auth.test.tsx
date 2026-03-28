import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@solidjs/testing-library";
import { JSX } from "solid-js";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { useCurrentUser, useRegister, useLogin, useLogout } from "./use-auth";

// Mock the auth operations
vi.mock("../auth", () => ({
  getCurrentUser: vi.fn(),
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

import { getCurrentUser, register, login, logout } from "../auth";

const mockedGetCurrentUser = vi.mocked(getCurrentUser);
const mockedRegister = vi.mocked(register);
const mockedLogin = vi.mocked(login);
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

    // Should have only been called once (no retry)
    expect(mockedGetCurrentUser).toHaveBeenCalledTimes(1);
  });
});

describe("useRegister", () => {
  it("registers a user and updates the cache on success", async () => {
    const mockUser = {
      id: "user-1",
      email: "alice@example.com",
      name: "Alice",
      createdAt: "",
      updatedAt: "",
    };
    const mockPayload = { success: true, user: mockUser, error: null };
    mockedRegister.mockResolvedValueOnce(mockPayload);

    const testClient = createTestQueryClient();
    const registerInput = {
      email: "alice@example.com",
      password: "pw",
      name: "Alice",
    };

    function Component() {
      const mutation = useRegister();
      return (
        <div>
          <button onClick={() => mutation.mutate(registerInput)}>
            Register
          </button>
          <span>{mutation.isSuccess ? "success" : "idle"}</span>
        </div>
      );
    }

    render(() => (
      <Wrapper client={testClient}>
        <Component />
      </Wrapper>
    ));

    screen.getByText("Register").click();

    await waitFor(() => {
      expect(screen.getByText("success")).toBeInTheDocument();
    });

    expect(mockedRegister).toHaveBeenCalledWith(registerInput);

    // Cache should be updated with user
    const cachedUser = testClient.getQueryData(["auth", "me"]);
    expect(cachedUser).toEqual(mockUser);
  });

  it("does not update cache when registration fails", async () => {
    const mockPayload = {
      success: false,
      user: null,
      error: "Email taken",
    };
    mockedRegister.mockResolvedValueOnce(mockPayload);

    const testClient = createTestQueryClient();

    function Component() {
      const mutation = useRegister();
      return (
        <button
          onClick={() =>
            mutation.mutate({
              email: "taken@example.com",
              password: "pw",
              name: "Test",
            })
          }
        >
          Register
        </button>
      );
    }

    render(() => (
      <Wrapper client={testClient}>
        <Component />
      </Wrapper>
    ));

    screen.getByText("Register").click();

    await waitFor(() => {
      expect(mockedRegister).toHaveBeenCalled();
    });

    // Cache should NOT be updated when success is false
    const cachedUser = testClient.getQueryData(["auth", "me"]);
    expect(cachedUser).toBeUndefined();
  });
});

describe("useLogin", () => {
  it("logs in user and updates cache on success", async () => {
    const mockUser = {
      id: "user-1",
      email: "alice@example.com",
      name: "Alice",
      createdAt: "",
      updatedAt: "",
    };
    const mockPayload = { success: true, user: mockUser, error: null };
    mockedLogin.mockResolvedValueOnce(mockPayload);

    const testClient = createTestQueryClient();

    function Component() {
      const mutation = useLogin();
      return (
        <div>
          <button
            onClick={() =>
              mutation.mutate({
                email: "alice@example.com",
                password: "pw",
              })
            }
          >
            Login
          </button>
          <span>{mutation.isSuccess ? "success" : "idle"}</span>
        </div>
      );
    }

    render(() => (
      <Wrapper client={testClient}>
        <Component />
      </Wrapper>
    ));

    screen.getByText("Login").click();

    await waitFor(() => {
      expect(screen.getByText("success")).toBeInTheDocument();
    });

    const cachedUser = testClient.getQueryData(["auth", "me"]);
    expect(cachedUser).toEqual(mockUser);
  });

  it("does not update cache when login fails", async () => {
    const mockPayload = {
      success: false,
      user: null,
      error: "Invalid credentials",
    };
    mockedLogin.mockResolvedValueOnce(mockPayload);

    const testClient = createTestQueryClient();

    function Component() {
      const mutation = useLogin();
      return (
        <button
          onClick={() =>
            mutation.mutate({
              email: "bad@example.com",
              password: "wrong",
            })
          }
        >
          Login
        </button>
      );
    }

    render(() => (
      <Wrapper client={testClient}>
        <Component />
      </Wrapper>
    ));

    screen.getByText("Login").click();

    await waitFor(() => {
      expect(mockedLogin).toHaveBeenCalled();
    });

    const cachedUser = testClient.getQueryData(["auth", "me"]);
    expect(cachedUser).toBeUndefined();
  });
});

describe("useLogout", () => {
  it("clears user cache and invalidates queries on logout", async () => {
    mockedLogout.mockResolvedValueOnce(true);

    const testClient = createTestQueryClient();
    // Pre-populate user cache
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

    // Cache should be cleared
    const cachedUser = testClient.getQueryData(["auth", "me"]);
    expect(cachedUser).toBeNull();
    expect(invalidateSpy).toHaveBeenCalled();
  });
});
