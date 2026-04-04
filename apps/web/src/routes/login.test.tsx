import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import Login from "./login";

vi.mock("@solidjs/meta", () => ({
  Title: () => null,
}));

vi.mock("../lib/theme/context", () => ({
  ThemeProvider: (props: { children: unknown }) => (
    <>{props.children as never}</>
  ),
}));

vi.mock("../components/auth/LoginForm", () => ({
  LoginForm: () => <div data-testid="login-form">LoginForm</div>,
}));

describe("Login route", () => {
  it("renders the LoginForm component", () => {
    render(() => <Login />);
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
  });

  it("renders Corvus brand name", () => {
    render(() => <Login />);
    expect(screen.getByText("Corvus")).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    render(() => <Login />);
    expect(
      screen.getByText("Your personal wishlist companion"),
    ).toBeInTheDocument();
  });
});
