import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { ProtectedRoute } from "./ProtectedRoute";

// Mock router
vi.mock("@solidjs/router", () => ({
  Navigate: (props: { href: string }) => (
    <div data-testid="navigate" data-href={props.href} />
  ),
}));

// Mock auth context
vi.mock("../../lib/auth/context", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../../lib/auth/context";
const mockedUseAuth = vi.mocked(useAuth);

describe("ProtectedRoute", () => {
  it("shows loading spinner while auth is loading", () => {
    mockedUseAuth.mockReturnValue({
      isLoading: () => true,
      isAuthenticated: () => false,
      user: () => undefined,
    });

    render(() => (
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    ));

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("redirects to login when not authenticated", () => {
    mockedUseAuth.mockReturnValue({
      isLoading: () => false,
      isAuthenticated: () => false,
      user: () => undefined,
    });

    render(() => (
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    ));

    const navigate = screen.getByTestId("navigate");
    expect(navigate).toBeInTheDocument();
    expect(navigate.getAttribute("data-href")).toBe("/login");
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    mockedUseAuth.mockReturnValue({
      isLoading: () => false,
      isAuthenticated: () => true,
      user: () => ({
        id: "user-1",
        email: "alice@example.com",
        name: "Alice",
        createdAt: "",
        updatedAt: "",
      }),
    });

    render(() => (
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    ));

    expect(screen.getByText("Protected content")).toBeInTheDocument();
    expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
  });
});
