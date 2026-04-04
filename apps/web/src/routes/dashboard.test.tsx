import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import Dashboard from "./dashboard";

const mockNavigate = vi.fn();

vi.mock("@solidjs/router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@solidjs/meta", () => ({
  Title: () => null,
}));

vi.mock("../lib/theme/context", () => ({
  ThemeProvider: (props: { children: unknown }) => (
    <>{props.children as never}</>
  ),
}));

vi.mock("../lib/auth/context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../components/WishlistDashboard", () => ({
  WishlistDashboard: (props: { user: unknown }) => (
    <div
      data-testid="wishlist-dashboard"
      data-user-id={(props.user as { id: string })?.id}
    >
      Dashboard
    </div>
  ),
}));

import { useAuth } from "../lib/auth/context";
const mockedUseAuth = vi.mocked(useAuth);

const mockUser = {
  id: "user-1",
  email: "alice@example.com",
  name: "Alice",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-02",
};

describe("Dashboard route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("shows loading spinner while auth is resolving", () => {
      mockedUseAuth.mockReturnValue({
        isLoading: () => true,
        isAuthenticated: () => false,
        user: () => undefined,
      });

      render(() => <Dashboard />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("does not render WishlistDashboard while loading", () => {
      mockedUseAuth.mockReturnValue({
        isLoading: () => true,
        isAuthenticated: () => false,
        user: () => undefined,
      });

      render(() => <Dashboard />);

      expect(
        screen.queryByTestId("wishlist-dashboard"),
      ).not.toBeInTheDocument();
    });
  });

  describe("unauthenticated state", () => {
    it("redirects to /login when not authenticated", () => {
      mockedUseAuth.mockReturnValue({
        isLoading: () => false,
        isAuthenticated: () => false,
        user: () => undefined,
      });

      render(() => <Dashboard />);

      expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
    });

    it("shows redirecting state when not authenticated and not loading", () => {
      mockedUseAuth.mockReturnValue({
        isLoading: () => false,
        isAuthenticated: () => false,
        user: () => undefined,
      });

      render(() => <Dashboard />);

      expect(screen.getByText("Redirecting...")).toBeInTheDocument();
    });

    it("does not render WishlistDashboard when unauthenticated", () => {
      mockedUseAuth.mockReturnValue({
        isLoading: () => false,
        isAuthenticated: () => false,
        user: () => undefined,
      });

      render(() => <Dashboard />);

      expect(
        screen.queryByTestId("wishlist-dashboard"),
      ).not.toBeInTheDocument();
    });
  });

  describe("authenticated state", () => {
    it("renders WishlistDashboard when authenticated", () => {
      mockedUseAuth.mockReturnValue({
        isLoading: () => false,
        isAuthenticated: () => true,
        user: () => mockUser,
      });

      render(() => <Dashboard />);

      expect(screen.getByTestId("wishlist-dashboard")).toBeInTheDocument();
    });

    it("passes user prop to WishlistDashboard", () => {
      mockedUseAuth.mockReturnValue({
        isLoading: () => false,
        isAuthenticated: () => true,
        user: () => mockUser,
      });

      render(() => <Dashboard />);

      const dashboard = screen.getByTestId("wishlist-dashboard");
      expect(dashboard.getAttribute("data-user-id")).toBe("user-1");
    });

    it("does not redirect when authenticated", () => {
      mockedUseAuth.mockReturnValue({
        isLoading: () => false,
        isAuthenticated: () => true,
        user: () => mockUser,
      });

      render(() => <Dashboard />);

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
