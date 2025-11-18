import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@solidjs/testing-library";
import { type JSX } from "solid-js";
import { RegisterForm } from "./RegisterForm";
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

// Mock useRegister hook
vi.mock("../../lib/graphql/hooks/use-auth");

describe("RegisterForm", () => {
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Provide default mock implementation
    vi.mocked(useAuth.useRegister).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  // Helper function to fill and submit register form
  const fillAndSubmitRegisterForm = (
    name: string,
    email: string,
    password: string,
  ) => {
    const nameInput = screen.getByLabelText("Full Name");
    const emailInput = screen.getByLabelText("Email Address");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", {
      name: "Create Account",
    });

    fireEvent.input(nameInput, { target: { value: name } });
    fireEvent.input(emailInput, { target: { value: email } });
    fireEvent.input(passwordInput, { target: { value: password } });
    fireEvent.click(submitButton);
  };

  describe("Rendering", () => {
    it("should render registration form with all required fields", () => {
      render(() => <RegisterForm />);

      // "Create Account" appears exactly twice: in the heading and button
      expect(screen.getAllByText("Create Account")).toHaveLength(2);
      expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Create Account" }),
      ).toBeInTheDocument();
    });

    it("should render name input with correct attributes", () => {
      render(() => <RegisterForm />);

      const nameInput = screen.getByLabelText("Full Name") as HTMLInputElement;
      expect(nameInput.type).toBe("text");
      expect(nameInput.required).toBe(true);
      expect(nameInput.name).toBe("name");
      expect(nameInput.placeholder).toBe("Enter your full name");
    });

    it("should render email input with correct attributes", () => {
      render(() => <RegisterForm />);

      const emailInput = screen.getByLabelText(
        "Email Address",
      ) as HTMLInputElement;
      expect(emailInput.type).toBe("email");
      expect(emailInput.required).toBe(true);
      expect(emailInput.name).toBe("email");
      expect(emailInput.placeholder).toBe("your@email.com");
    });

    it("should render password input with correct attributes", () => {
      render(() => <RegisterForm />);

      const passwordInput = screen.getByLabelText(
        "Password",
      ) as HTMLInputElement;
      expect(passwordInput.type).toBe("password");
      expect(passwordInput.required).toBe(true);
      expect(passwordInput.name).toBe("password");
      expect(passwordInput.minLength).toBe(8);
      expect(passwordInput.placeholder).toBe("Min 8 characters");
    });

    it("should render link to login page", () => {
      render(() => <RegisterForm />);

      expect(screen.getByText("Already have an account?")).toBeInTheDocument();
      const loginLink = screen.getByText("Sign In");
      expect(loginLink).toBeInTheDocument();
      expect(loginLink.getAttribute("href")).toBe("/login");
    });

    it("should not show error message initially", () => {
      render(() => <RegisterForm />);

      const errorElement = screen.queryByText(/Registration failed/i);
      expect(errorElement).not.toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("should call register mutation with correct data on submit", async () => {
      mockMutateAsync.mockResolvedValue({ success: true });

      render(() => <RegisterForm />);
      fillAndSubmitRegisterForm("John Doe", "john@example.com", "password123");

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        });
      });
    });

    it("should navigate to dashboard on successful registration", async () => {
      mockMutateAsync.mockResolvedValue({ success: true });

      render(() => <RegisterForm />);
      fillAndSubmitRegisterForm("John Doe", "john@example.com", "password123");

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("should display error message when registration fails with error message", async () => {
      mockMutateAsync.mockResolvedValue({
        success: false,
        error: "Email already exists",
      });

      render(() => <RegisterForm />);
      fillAndSubmitRegisterForm(
        "John Doe",
        "existing@example.com",
        "password123",
      );

      await waitFor(() => {
        expect(screen.getByText("Email already exists")).toBeInTheDocument();
      });
    });

    it("should display generic error message when registration fails without error message", async () => {
      mockMutateAsync.mockResolvedValue({
        success: false,
      });

      render(() => <RegisterForm />);
      fillAndSubmitRegisterForm("John Doe", "john@example.com", "password123");

      await waitFor(() => {
        expect(screen.getByText("Registration failed")).toBeInTheDocument();
      });
    });

    it("should display error message when mutation throws an error", async () => {
      mockMutateAsync.mockRejectedValue(new Error("Network error"));

      render(() => <RegisterForm />);
      fillAndSubmitRegisterForm("John Doe", "john@example.com", "password123");

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("should display generic error message for non-Error exceptions", async () => {
      mockMutateAsync.mockRejectedValue("Something went wrong");

      render(() => <RegisterForm />);
      fillAndSubmitRegisterForm("John Doe", "john@example.com", "password123");

      await waitFor(() => {
        expect(screen.getByText("An error occurred")).toBeInTheDocument();
      });
    });

    it("should clear previous error message on new submission", async () => {
      // First submission fails
      mockMutateAsync.mockResolvedValueOnce({
        success: false,
        error: "Email already exists",
      });

      render(() => <RegisterForm />);
      fillAndSubmitRegisterForm(
        "John Doe",
        "existing@example.com",
        "password123",
      );

      await waitFor(() => {
        expect(screen.getByText("Email already exists")).toBeInTheDocument();
      });

      // Second submission succeeds
      mockMutateAsync.mockResolvedValueOnce({ success: true });
      fillAndSubmitRegisterForm("John Doe", "new@example.com", "password123");

      await waitFor(() => {
        expect(
          screen.queryByText("Email already exists"),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    it("should show loading text when mutation is pending", () => {
      vi.mocked(useAuth.useRegister).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      });

      render(() => <RegisterForm />);

      expect(
        screen.getByRole("button", { name: "Creating account..." }),
      ).toBeInTheDocument();
    });

    it("should disable submit button when mutation is pending", () => {
      vi.mocked(useAuth.useRegister).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      });

      render(() => <RegisterForm />);

      const submitButton = screen.getByRole("button", {
        name: "Creating account...",
      });
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when mutation is not pending", () => {
      vi.mocked(useAuth.useRegister).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
      });

      render(() => <RegisterForm />);

      const submitButton = screen.getByRole("button", {
        name: "Create Account",
      });
      expect(submitButton).not.toBeDisabled();
    });
  });
});
