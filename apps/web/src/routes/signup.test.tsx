import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import SignUp from "./signup";

vi.mock("@solidjs/meta", () => ({
  Title: () => null,
}));

vi.mock("@solidjs/router", () => ({
  useSearchParams: vi.fn(() => [{ error: undefined }]),
}));

vi.mock("../lib/theme/context", () => ({
  ThemeProvider: (props: { children: unknown }) => (
    <>{props.children as never}</>
  ),
}));

vi.mock("@repo/ui-components/corvus-mark", () => ({
  CorvusMark: (props: { title?: string; class?: string }) => (
    <svg aria-label={props.title} />
  ),
}));

vi.mock("@repo/ui-components/paper-background", () => ({
  PaperBackground: () => null,
}));

vi.mock("../components/auth/GoogleAuthForm", () => ({
  GoogleAuthForm: (props: { mode: string; error?: string }) => (
    <div
      data-testid="google-auth-form"
      data-mode={props.mode}
      data-error={props.error ?? ""}
    >
      GoogleAuthForm
    </div>
  ),
}));

describe("SignUp route", () => {
  it("renders the GoogleAuthForm component in signup mode", () => {
    render(() => <SignUp />);
    expect(screen.getByTestId("google-auth-form")).toBeInTheDocument();
    expect(screen.getByTestId("google-auth-form")).toHaveAttribute(
      "data-mode",
      "signup",
    );
  });

  it("renders Corvus brand name", () => {
    render(() => <SignUp />);
    expect(screen.getByText("Corvus")).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    render(() => <SignUp />);
    expect(screen.getByText("A catalogue of desire")).toBeInTheDocument();
  });

  it("passes empty error to GoogleAuthForm when no search param present", () => {
    render(() => <SignUp />);
    expect(screen.getByTestId("google-auth-form")).toHaveAttribute(
      "data-error",
      "",
    );
  });

  it("normalizes array error param to first element", async () => {
    const { useSearchParams } = await import("@solidjs/router");
    vi.mocked(useSearchParams).mockReturnValue([
      { error: ["auth_failed", "extra"] },
      expect.any(Function),
    ]);
    render(() => <SignUp />);
    expect(screen.getByTestId("google-auth-form")).toHaveAttribute(
      "data-error",
      "auth_failed",
    );
  });
});
