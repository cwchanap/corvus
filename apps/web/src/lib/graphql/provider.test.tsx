import { describe, it, expect } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { GraphQLProvider } from "./provider";
import { useQueryClient } from "@tanstack/solid-query";

describe("GraphQLProvider", () => {
  it("renders children", () => {
    render(() => (
      <GraphQLProvider>
        <div data-testid="child">Child content</div>
      </GraphQLProvider>
    ));

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("provides a QueryClient to children", () => {
    let queryClientAvailable = false;

    function Consumer() {
      try {
        useQueryClient();
        queryClientAvailable = true;
      } catch {
        queryClientAvailable = false;
      }
      return <div>consumer</div>;
    }

    render(() => (
      <GraphQLProvider>
        <Consumer />
      </GraphQLProvider>
    ));

    expect(queryClientAvailable).toBe(true);
  });

  it("throws when QueryClient is used outside of GraphQLProvider", () => {
    function ConsumerWithoutProvider() {
      useQueryClient();
      return <div />;
    }

    expect(() => {
      render(() => <ConsumerWithoutProvider />);
    }).toThrow();
  });
});
