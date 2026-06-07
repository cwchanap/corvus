import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@solidjs/testing-library";
import RegisterRedirect from "./register";

const mockNavigate = vi.fn();
const mockLocation = {
  pathname: "/register",
  search: "",
  hash: "",
};

vi.mock("@solidjs/router", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

describe("Register route (legacy redirect)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.search = "";
    mockLocation.hash = "";
  });

  it("redirects to /signup with replace", () => {
    render(() => <RegisterRedirect />);
    expect(mockNavigate).toHaveBeenCalledWith("/signup", { replace: true });
  });

  it("preserves query string when redirecting", () => {
    mockLocation.search = "?source=extension";
    render(() => <RegisterRedirect />);
    expect(mockNavigate).toHaveBeenCalledWith("/signup?source=extension", {
      replace: true,
    });
  });

  it("forwards the hash fragment", () => {
    mockLocation.hash = "#invite";
    render(() => <RegisterRedirect />);
    expect(mockNavigate).toHaveBeenCalledWith("/signup#invite", {
      replace: true,
    });
  });

  it("navigates exactly once", () => {
    render(() => <RegisterRedirect />);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it("renders null (empty container)", () => {
    const { container } = render(() => <RegisterRedirect />);
    expect(container.firstChild).toBeNull();
  });
});
