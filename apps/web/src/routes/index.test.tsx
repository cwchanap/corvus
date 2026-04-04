import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@solidjs/testing-library";
import Home from "./index";

const mockNavigate = vi.fn();

vi.mock("@solidjs/router", () => ({
  useNavigate: () => mockNavigate,
}));

describe("Home route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("navigates to /login on mount with replace", () => {
    render(() => <Home />);
    expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
  });

  it("navigates exactly once", () => {
    render(() => <Home />);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it("renders null (empty container)", () => {
    const { container } = render(() => <Home />);
    expect(container.firstChild).toBeNull();
  });
});
