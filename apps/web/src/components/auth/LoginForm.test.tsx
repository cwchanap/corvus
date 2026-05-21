import { describe, expect, it } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { LoginForm } from "./LoginForm";

describe("LoginForm", () => {
  it("renders Google-only sign in", () => {
    render(() => <LoginForm />);

    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Continue with Google" }),
    ).toHaveAttribute("href", "http://localhost:5002/auth/google/start");
    expect(
      screen.getByRole("link", { name: "Continue with Google" }),
    ).toHaveAttribute("target", "_self");
  });

  it("does not render password auth fields or signup links", () => {
    render(() => <LoginForm />);

    expect(screen.queryByLabelText("Email Address")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
    expect(screen.queryByText("Create Account")).not.toBeInTheDocument();
  });
});
