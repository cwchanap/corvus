import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@solidjs/testing-library";
import { type JSX } from "solid-js";
import { RegisterForm } from "./RegisterForm";

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
const mockMutateAsync = vi.fn();
const mockRegisterState = {
  mutateAsync: mockMutateAsync,
  isPending: false,
};

vi.mock("../../lib/graphql/hooks/use-auth", () => ({
  useRegister: vi.fn(() => mockRegisterState),
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state to prevent test isolation issues
    mockRegisterState.isPending = false;
  });

  describe("Rendering", () => {
    it("should render registration form with all required fields", () => {
      render(() => <RegisterForm />);

      // The title "Create Account" appears in both the heading and button
      expect(screen.getAllByText("Create Account").length).toBeGreaterThan(0);
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

      const nameInput = screen.getByLabelText("Full Name");
      const emailInput = screen.getByLabelText("Email Address");
      const passwordInput = screen.getByLabelText("Password");
      const submitButton = screen.getByRole("button", {
        name: "Create Account",
      });

      fireEvent.input(nameInput, { target: { value: "John Doe" } });
      fireEvent.input(emailInput, { target: { value: "john@example.com" } });
      fireEvent.input(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

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

      const nameInput = screen.getByLabelText("Full Name");
      const emailInput = screen.getByLabelText("Email Address");
      const passwordInput = screen.getByLabelText("Password");
      const submitButton = screen.getByRole("button", {
        name: "Create Account",
      });

      fireEvent.input(nameInput, { target: { value: "John Doe" } });
      fireEvent.input(emailInput, { target: { value: "john@example.com" } });
      fireEvent.input(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

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

      const nameInput = screen.getByLabelText("Full Name");
      const emailInput = screen.getByLabelText("Email Address");
      const passwordInput = screen.getByLabelText("Password");
      const submitButton = screen.getByRole("button", {
        name: "Create Account",
      });

      fireEvent.input(nameInput, { target: { value: "John Doe" } });
      fireEvent.input(emailInput, {
        target: { value: "existing@example.com" },
      });
      fireEvent.input(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Email already exists")).toBeInTheDocument();
      });
    });

    it("should display generic error message when registration fails without error message", async () => {
      mockMutateAsync.mockResolvedValue({
        success: false,
      });

      render(() => <RegisterForm />);

      const nameInput = screen.getByLabelText("Full Name");
      const emailInput = screen.getByLabelText("Email Address");
      const passwordInput = screen.getByLabelText("Password");
      const submitButton = screen.getByRole("button", {
        name: "Create Account",
      });

      fireEvent.input(nameInput, { target: { value: "John Doe" } });
      fireEvent.input(emailInput, { target: { value: "john@example.com" } });
      fireEvent.input(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Registration failed")).toBeInTheDocument();
      });
    });

    it("should display error message when mutation throws an error", async () => {
      mockMutateAsync.mockRejectedValue(new Error("Network error"));

      render(() => <RegisterForm />);

      const nameInput = screen.getByLabelText("Full Name");
      const emailInput = screen.getByLabelText("Email Address");
      const passwordInput = screen.getByLabelText("Password");
      const submitButton = screen.getByRole("button", {
        name: "Create Account",
      });

      fireEvent.input(nameInput, { target: { value: "John Doe" } });
      fireEvent.input(emailInput, { target: { value: "john@example.com" } });
      fireEvent.input(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("should display generic error message for non-Error exceptions", async () => {
      mockMutateAsync.mockRejectedValue("Something went wrong");

      render(() => <RegisterForm />);

      const nameInput = screen.getByLabelText("Full Name");
      const emailInput = screen.getByLabelText("Email Address");
      const passwordInput = screen.getByLabelText("Password");
      const submitButton = screen.getByRole("button", {
        name: "Create Account",
      });

      fireEvent.input(nameInput, { target: { value: "John Doe" } });
      fireEvent.input(emailInput, { target: { value: "john@example.com" } });
      fireEvent.input(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

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

      const nameInput = screen.getByLabelText("Full Name");
      const emailInput = screen.getByLabelText("Email Address");
      const passwordInput = screen.getByLabelText("Password");
      const submitButton = screen.getByRole("button", {
        name: "Create Account",
      });

      fireEvent.input(nameInput, { target: { value: "John Doe" } });
      fireEvent.input(emailInput, {
        target: { value: "existing@example.com" },
      });
      fireEvent.input(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Email already exists")).toBeInTheDocument();
      });

      // Second submission succeeds
      mockMutateAsync.mockResolvedValueOnce({ success: true });

      fireEvent.input(emailInput, { target: { value: "new@example.com" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByText("Email already exists"),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    it("should show loading text when mutation is pending", () => {
      mockRegisterState.isPending = true;

      render(() => <RegisterForm />);

      expect(
        screen.getByRole("button", { name: "Creating account..." }),
      ).toBeInTheDocument();
    });

    it("should disable submit button when mutation is pending", () => {
      mockRegisterState.isPending = true;

      render(() => <RegisterForm />);

      const submitButton = screen.getByRole("button", {
        name: "Creating account...",
      });
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when mutation is not pending", () => {
      mockRegisterState.isPending = false;

      render(() => <RegisterForm />);

      const submitButton = screen.getByRole("button", {
        name: "Create Account",
      });
      expect(submitButton).not.toBeDisabled();
    });
  });
});
