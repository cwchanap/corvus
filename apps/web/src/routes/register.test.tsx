import { describe, expect, it, vi, beforeEach } from "vitest";
import { render } from "@solidjs/testing-library";
import Register from "./register";

const mockNavigate = vi.fn();

vi.mock("@solidjs/router", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@solidjs/meta", () => ({
  Title: () => null,
}));

describe("Register route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to login without rendering a signup form", () => {
    render(() => <Register />);

    expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
  });
});
