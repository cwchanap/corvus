import { describe, expect, it } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { GoogleAuthForm } from "./GoogleAuthForm";

describe("GoogleAuthForm (signin)", () => {
  it("renders Google-only sign in", () => {
    render(() => <GoogleAuthForm mode="signin" />);

    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Continue with Google" }),
    ).toHaveAttribute("href", `${window.location.origin}/auth/google/start`);
    expect(
      screen.getByRole("link", { name: "Continue with Google" }),
    ).toHaveAttribute("target", "_self");
  });

  it("does not render password auth fields or signup links", () => {
    render(() => <GoogleAuthForm mode="signin" />);

    expect(screen.queryByLabelText("Email Address")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
    expect(screen.queryByText("Create Account")).not.toBeInTheDocument();
  });

  it("does not show an error message when no error prop is provided", () => {
    render(() => <GoogleAuthForm mode="signin" />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an error message when error prop is auth_failed", () => {
    render(() => <GoogleAuthForm mode="signin" error="auth_failed" />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("alert").textContent).toContain("Sign-in failed");
  });

  it("shows a generic error message for unknown error codes", () => {
    render(() => <GoogleAuthForm mode="signin" error="unknown_error" />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("alert").textContent).toContain(
      "An unexpected error occurred",
    );
  });

  it("does not show an error message when error prop is null", () => {
    render(() => <GoogleAuthForm mode="signin" error={null} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("GoogleAuthForm (signup)", () => {
  it("renders Google-only sign up", () => {
    render(() => <GoogleAuthForm mode="signup" />);

    expect(screen.getByText("Get Started")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Sign up with Google" }),
    ).toHaveAttribute("href", `${window.location.origin}/auth/google/start`);
  });

  it("shows an error message when error prop is provided", () => {
    render(() => <GoogleAuthForm mode="signup" error="auth_canceled" />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("alert").textContent).toContain("canceled");
  });
});
