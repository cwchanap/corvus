import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { JSX } from "solid-js";
import { AuthProvider, useAuth } from "./context";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";

// Mock the useCurrentUser hook
vi.mock("../graphql/hooks/use-auth", () => ({
  useCurrentUser: vi.fn(),
}));

import { useCurrentUser } from "../graphql/hooks/use-auth";
const mockedUseCurrentUser = vi.mocked(useCurrentUser);

function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function TestWrapper(props: { children: JSX.Element }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      <AuthProvider>{props.children}</AuthProvider>
    </QueryClientProvider>
  );
}

describe("AuthProvider", () => {
  it("provides authenticated state when user is loaded", () => {
    const mockUser = {
      id: "user-1",
      email: "alice@example.com",
      name: "Alice",
      createdAt: "",
      updatedAt: "",
    };
    mockedUseCurrentUser.mockReturnValue({
      data: mockUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useCurrentUser>);

    let capturedAuth: ReturnType<typeof useAuth> | undefined;

    function Consumer() {
      capturedAuth = useAuth();
      return <div>{capturedAuth.user()?.email}</div>;
    }

    render(() => (
      <TestWrapper>
        <Consumer />
      </TestWrapper>
    ));

    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(capturedAuth!.isAuthenticated()).toBe(true);
    expect(capturedAuth!.isLoading()).toBe(false);
  });

  it("provides unauthenticated state when user is null", () => {
    mockedUseCurrentUser.mockReturnValue({
      data: null,
      isLoading: false,
    } as unknown as ReturnType<typeof useCurrentUser>);

    let capturedAuth: ReturnType<typeof useAuth> | undefined;

    function Consumer() {
      capturedAuth = useAuth();
      return <div>no user</div>;
    }

    render(() => (
      <TestWrapper>
        <Consumer />
      </TestWrapper>
    ));

    expect(capturedAuth!.isAuthenticated()).toBe(false);
    expect(capturedAuth!.user()).toBeUndefined();
  });

  it("provides loading state while fetching user", () => {
    mockedUseCurrentUser.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useCurrentUser>);

    let capturedAuth: ReturnType<typeof useAuth> | undefined;

    function Consumer() {
      capturedAuth = useAuth();
      return <div>loading</div>;
    }

    render(() => (
      <TestWrapper>
        <Consumer />
      </TestWrapper>
    ));

    expect(capturedAuth!.isLoading()).toBe(true);
    expect(capturedAuth!.isAuthenticated()).toBe(false);
  });
});

describe("useAuth", () => {
  it("throws when used outside of AuthProvider", () => {
    function ConsumerWithoutProvider() {
      useAuth();
      return <div />;
    }

    expect(() => {
      render(() => <ConsumerWithoutProvider />);
    }).toThrow("useAuth must be used within an AuthProvider");
  });
});
