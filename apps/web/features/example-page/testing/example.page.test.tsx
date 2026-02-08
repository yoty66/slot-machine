import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { UseQueryResult } from "@tanstack/react-query";
import ExamplePage from "../pages/example.page";

vi.mock("../dao/example.query", () => ({
  useGetExample: vi.fn(),
}));

import { useGetExample } from "../dao/example.query";

function mockUseGetExample(
  overrides: Partial<UseQueryResult<{ message: string }>> = {}
) {
  vi.mocked(useGetExample).mockReturnValue({
    data: undefined,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: false,
    isPending: false,
    status: "pending",
    fetchStatus: "idle",
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    isFetched: false,
    isFetchedAfterMount: false,
    isRefetching: false,
    isStale: true,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isPlaceholderData: false,
    refetch: vi.fn(),
    ...overrides,
  } as UseQueryResult<{ message: string }>);
}

describe("Example page", () => {
  beforeEach(() => {
    vi.mocked(useGetExample).mockReset();
  });

  test("shows loading state when data is loading", () => {
    mockUseGetExample({ isLoading: true, isPending: true, status: "pending" });

    render(<ExamplePage />);
    expect(screen.getByTestId("example-loading")).toBeInTheDocument();
  });

  test("shows error state when request fails", () => {
    mockUseGetExample({
      error: new Error("Network error"),
      isError: true,
      status: "error",
    });

    render(<ExamplePage />);
    expect(screen.getByTestId("example-error")).toBeInTheDocument();
    expect(screen.getByTestId("example-error-message")).toHaveTextContent(
      "Network error"
    );
  });

  test("shows example message when data loads successfully", () => {
    mockUseGetExample({
      data: { message: "Hello from getExample" },
      isSuccess: true,
      status: "success",
    });

    render(<ExamplePage />);
    expect(screen.getByTestId("example-heading")).toBeInTheDocument();
    expect(screen.getByTestId("example-message")).toHaveTextContent(
      "Hello from getExample"
    );
    expect(screen.getByTestId("example-refresh")).toBeInTheDocument();
  });
});
