import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@solidjs/testing-library";
import LoginRedirect from "./login";

const mockNavigate = vi.fn();
const mockLocation = {
  pathname: "/login",
  search: "",
  hash: "",
};

vi.mock("@solidjs/router", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

describe("Login route (legacy redirect)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.search = "";
    mockLocation.hash = "";
  });

  it("redirects to /signin with replace", () => {
    render(() => <LoginRedirect />);
    expect(mockNavigate).toHaveBeenCalledWith("/signin", { replace: true });
  });

  it("preserves the source query param used by the extension", () => {
    mockLocation.search = "?source=extension";
    render(() => <LoginRedirect />);
    expect(mockNavigate).toHaveBeenCalledWith("/signin?source=extension", {
      replace: true,
    });
  });

  it("forwards OAuth error params emitted by the API", () => {
    mockLocation.search = "?error=auth_failed&source=extension";
    render(() => <LoginRedirect />);
    expect(mockNavigate).toHaveBeenCalledWith(
      "/signin?error=auth_failed&source=extension",
      { replace: true },
    );
  });

  it("forwards the hash fragment", () => {
    mockLocation.hash = "#reset";
    render(() => <LoginRedirect />);
    expect(mockNavigate).toHaveBeenCalledWith("/signin#reset", {
      replace: true,
    });
  });

  it("navigates exactly once", () => {
    render(() => <LoginRedirect />);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it("renders null (empty container)", () => {
    const { container } = render(() => <LoginRedirect />);
    expect(container.firstChild).toBeNull();
  });
});
