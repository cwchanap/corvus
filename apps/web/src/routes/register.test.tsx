import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import Register from "./register";

vi.mock("@solidjs/meta", () => ({
  Title: () => null,
}));

vi.mock("../lib/theme/context", () => ({
  ThemeProvider: (props: { children: unknown }) => (
    <>{props.children as never}</>
  ),
}));

vi.mock("../components/auth/RegisterForm", () => ({
  RegisterForm: () => <div data-testid="register-form">RegisterForm</div>,
}));

describe("Register route", () => {
  it("renders the RegisterForm component", () => {
    render(() => <Register />);
    expect(screen.getByTestId("register-form")).toBeInTheDocument();
  });

  it("renders Corvus brand name", () => {
    render(() => <Register />);
    expect(screen.getByText("Corvus")).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    render(() => <Register />);
    expect(
      screen.getByText("Your personal wishlist companion"),
    ).toBeInTheDocument();
  });
});
