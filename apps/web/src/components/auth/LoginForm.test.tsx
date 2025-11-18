import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@solidjs/testing-library";
import { type JSX } from "solid-js";
import { LoginForm } from "./LoginForm";
import * as useAuth from "../../lib/graphql/hooks/use-auth";

// Mock @solidjs/router
const mockNavigate = vi.fn();
vi.mock("@solidjs/router", async () => {
  const actual = await vi.importActual("@solidjs/router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    A: (props: JSX.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />,
  };
});

// Mock useLogin hook
vi.mock("../../lib/graphql/hooks/use-auth");

describe("LoginForm", () => {
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Provide default mock implementation
    vi.mocked(useAuth.useLogin).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  // Helper function to fill and submit login form
  const fillAndSubmitLoginForm = (email: string, password: string) => {
    const emailInput = screen.getByLabelText("Email Address");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.input(emailInput, { target: { value: email } });
    fireEvent.input(passwordInput, { target: { value: password } });
    fireEvent.click(submitButton);
  };

  describe("Rendering", () => {
    it("should render login form with all required fields", () => {
      render(() => <LoginForm />);

      expect(screen.getByText("Welcome Back")).toBeInTheDocument();
      expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Sign In" }),
      ).toBeInTheDocument();
    });

    it("should render email input with correct attributes", () => {
      render(() => <LoginForm />);

      const emailInput = screen.getByLabelText(
        "Email Address",
      ) as HTMLInputElement;
      expect(emailInput.type).toBe("email");
      expect(emailInput.required).toBe(true);
      expect(emailInput.name).toBe("email");
      expect(emailInput.placeholder).toBe("your@email.com");
    });

    it("should render password input with correct attributes", () => {
      render(() => <LoginForm />);

      const passwordInput = screen.getByLabelText(
        "Password",
      ) as HTMLInputElement;
      expect(passwordInput.type).toBe("password");
      expect(passwordInput.required).toBe(true);
      expect(passwordInput.name).toBe("password");
      expect(passwordInput.placeholder).toBe("••••••••");
    });

    it("should render link to register page", () => {
      render(() => <LoginForm />);

      expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
      const registerLink = screen.getByText("Create Account");
      expect(registerLink).toBeInTheDocument();
      expect(registerLink.getAttribute("href")).toBe("/register");
    });

    it("should not show error message initially", () => {
      render(() => <LoginForm />);

      const errorElement = screen.queryByText(/Login failed/i);
      expect(errorElement).not.toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("should call login mutation with correct credentials on submit", async () => {
      mockMutateAsync.mockResolvedValue({ success: true });

      render(() => <LoginForm />);
      fillAndSubmitLoginForm("test@example.com", "password123");

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });
    });

    it("should navigate to dashboard on successful login", async () => {
      mockMutateAsync.mockResolvedValue({ success: true });

      render(() => <LoginForm />);
      fillAndSubmitLoginForm("test@example.com", "password123");

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("should display error message when login fails with error message", async () => {
      mockMutateAsync.mockResolvedValue({
        success: false,
        error: "Invalid credentials",
      });

      render(() => <LoginForm />);
      fillAndSubmitLoginForm("test@example.com", "wrongpassword");

      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      });
    });

    it("should display generic error message when login fails without error message", async () => {
      mockMutateAsync.mockResolvedValue({
        success: false,
      });

      render(() => <LoginForm />);
      fillAndSubmitLoginForm("test@example.com", "password123");

      await waitFor(() => {
        expect(screen.getByText("Login failed")).toBeInTheDocument();
      });
    });

    it("should display error message when mutation throws an error", async () => {
      mockMutateAsync.mockRejectedValue(new Error("Network error"));

      render(() => <LoginForm />);
      fillAndSubmitLoginForm("test@example.com", "password123");

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("should display generic error message for non-Error exceptions", async () => {
      mockMutateAsync.mockRejectedValue("Something went wrong");

      render(() => <LoginForm />);
      fillAndSubmitLoginForm("test@example.com", "password123");

      await waitFor(() => {
        expect(screen.getByText("An error occurred")).toBeInTheDocument();
      });
    });

    it("should clear previous error message on new submission", async () => {
      // First submission fails
      mockMutateAsync.mockResolvedValueOnce({
        success: false,
        error: "Invalid credentials",
      });

      render(() => <LoginForm />);
      fillAndSubmitLoginForm("test@example.com", "wrongpassword");

      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      });

      // Second submission succeeds
      mockMutateAsync.mockResolvedValueOnce({ success: true });
      fillAndSubmitLoginForm("test@example.com", "correctpassword");

      await waitFor(() => {
        expect(
          screen.queryByText("Invalid credentials"),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    it("should show loading text when mutation is pending", () => {
      vi.mocked(useAuth.useLogin).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      });

      render(() => <LoginForm />);

      expect(
        screen.getByRole("button", { name: "Signing in..." }),
      ).toBeInTheDocument();
    });

    it("should disable submit button when mutation is pending", () => {
      vi.mocked(useAuth.useLogin).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      });

      render(() => <LoginForm />);

      const submitButton = screen.getByRole("button", {
        name: "Signing in...",
      });
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when mutation is not pending", () => {
      vi.mocked(useAuth.useLogin).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      render(() => <LoginForm />);

      const submitButton = screen.getByRole("button", { name: "Sign In" });
      expect(submitButton).not.toBeDisabled();
    });
  });
});
