import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@solidjs/testing-library";
import Profile from "./profile";

const mockNavigate = vi.fn();

vi.mock("@solidjs/router", () => ({
  useNavigate: () => mockNavigate,
  A: (props: { href: string; children: unknown }) => (
    <a href={props.href}>{props.children as never}</a>
  ),
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

vi.mock("../lib/graphql/hooks/use-auth", () => ({
  useLogout: vi.fn(),
}));

import { useAuth } from "../lib/auth/context";
import { useLogout } from "../lib/graphql/hooks/use-auth";
const mockedUseAuth = vi.mocked(useAuth);
const mockedUseLogout = vi.mocked(useLogout);

const mockMutateAsync = vi.fn();

const mockUser = {
  id: "user-1",
  email: "alice@example.com",
  name: "Alice",
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-06-20T15:45:00Z",
};

describe("Profile route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseLogout.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useLogout>);
  });

  describe("unauthenticated state", () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        isLoading: () => false,
        isAuthenticated: () => false,
        user: () => undefined,
      });
    });

    it("shows Access Denied heading when no user", () => {
      render(() => <Profile />);
      expect(screen.getByText("Access Denied")).toBeInTheDocument();
    });

    it("shows sign in prompt message", () => {
      render(() => <Profile />);
      expect(
        screen.getByText("Please sign in to view your profile."),
      ).toBeInTheDocument();
    });

    it("shows Sign In link", () => {
      render(() => <Profile />);
      const signInLink = screen.getByText("Sign In");
      expect(signInLink).toBeInTheDocument();
      expect(signInLink.closest("a")).toHaveAttribute("href", "/login");
    });

    it("shows Create Account link", () => {
      render(() => <Profile />);
      const createLink = screen.getByText("Create Account");
      expect(createLink).toBeInTheDocument();
      expect(createLink.closest("a")).toHaveAttribute("href", "/register");
    });

    it("does not show user details when unauthenticated", () => {
      render(() => <Profile />);
      expect(screen.queryByText("Account Details")).not.toBeInTheDocument();
    });
  });

  describe("authenticated state", () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        isLoading: () => false,
        isAuthenticated: () => true,
        user: () => mockUser,
      });
    });

    it("renders Account Details heading", () => {
      render(() => <Profile />);
      expect(screen.getByText("Account Details")).toBeInTheDocument();
    });

    it("displays user name", () => {
      render(() => <Profile />);
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    it("displays user email", () => {
      render(() => <Profile />);
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    });

    it("displays Member Since label", () => {
      render(() => <Profile />);
      expect(screen.getByText("Member Since")).toBeInTheDocument();
    });

    it("displays Last Updated label", () => {
      render(() => <Profile />);
      expect(screen.getByText("Last Updated")).toBeInTheDocument();
    });

    it("shows formatted createdAt date", () => {
      render(() => <Profile />);
      // The date is formatted via toLocaleString — just verify it doesn't show "—"
      const memberSince = screen
        .getByText("Member Since")
        .closest("div")?.parentElement;
      expect(memberSince?.textContent).not.toContain("—");
    });

    it("renders Back to Dashboard link", () => {
      render(() => <Profile />);
      const link = screen.getByText("Back to Dashboard");
      expect(link).toBeInTheDocument();
      expect(link.closest("a")).toHaveAttribute("href", "/dashboard");
    });

    it("renders Sign Out button", () => {
      render(() => <Profile />);
      expect(screen.getByText("Sign Out")).toBeInTheDocument();
    });

    it("shows Signing Out... text when logout is pending", () => {
      mockedUseLogout.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as unknown as ReturnType<typeof useLogout>);

      render(() => <Profile />);

      expect(screen.getByText("Signing Out...")).toBeInTheDocument();
    });

    it("disables sign out button when logout is pending", () => {
      mockedUseLogout.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as unknown as ReturnType<typeof useLogout>);

      render(() => <Profile />);

      const button = screen.getByText("Signing Out...").closest("button");
      expect(button).toBeDisabled();
    });

    it("calls logout mutation and navigates on sign out", async () => {
      mockMutateAsync.mockResolvedValue(undefined);

      render(() => <Profile />);
      fireEvent.click(screen.getByText("Sign Out"));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });
  });

  describe("formatDate function", () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue({
        isLoading: () => false,
        isAuthenticated: () => true,
        user: () => ({
          ...mockUser,
          createdAt: null as unknown as string,
          updatedAt: "invalid-date",
        }),
      });
    });

    it("shows dash for null date values", () => {
      render(() => <Profile />);
      // null createdAt → "—"
      const memberSinceSection = screen
        .getByText("Member Since")
        .closest(".grid");
      expect(memberSinceSection?.textContent).toContain("—");
    });

    it("shows dash for invalid date strings", () => {
      render(() => <Profile />);
      // "invalid-date" updatedAt → "—"
      const lastUpdatedSection = screen
        .getByText("Last Updated")
        .closest(".grid");
      expect(lastUpdatedSection?.textContent).toContain("—");
    });
  });

  describe("formatDate with numeric timestamp", () => {
    it("formats a numeric timestamp", () => {
      mockedUseAuth.mockReturnValue({
        isLoading: () => false,
        isAuthenticated: () => true,
        user: () => ({
          ...mockUser,
          createdAt: 1705312200000 as unknown as string,
          updatedAt: new Date("2024-06-20") as unknown as string,
        }),
      });

      render(() => <Profile />);
      // Both numeric and Date object should format (not "—")
      expect(screen.queryAllByText("—").length).toBe(0);
    });
  });

  describe("formatDate unknown value types", () => {
    it("formats an arbitrary object via String() conversion (shows dash for invalid date)", () => {
      mockedUseAuth.mockReturnValue({
        isLoading: () => false,
        isAuthenticated: () => true,
        user: () => ({
          ...mockUser,
          createdAt: {} as unknown as string,
          updatedAt: mockUser.updatedAt,
        }),
      });

      render(() => <Profile />);
      // {} → new Date("[object Object]") → invalid date → "—"
      const memberSinceSection = screen
        .getByText("Member Since")
        .closest(".grid");
      expect(memberSinceSection?.textContent).toContain("—");
    });

    it("returns dash when value conversion throws (covers catch block)", () => {
      const throwing = {
        [Symbol.toPrimitive]() {
          throw new Error("boom");
        },
        toString() {
          throw new Error("boom");
        },
      };
      mockedUseAuth.mockReturnValue({
        isLoading: () => false,
        isAuthenticated: () => true,
        user: () => ({
          ...mockUser,
          createdAt: throwing as unknown as string,
          updatedAt: mockUser.updatedAt,
        }),
      });

      render(() => <Profile />);
      // new Date(throwing) calls Symbol.toPrimitive which throws → catch returns "—"
      const memberSinceSection = screen
        .getByText("Member Since")
        .closest(".grid");
      expect(memberSinceSection?.textContent).toContain("—");
    });
  });
});
