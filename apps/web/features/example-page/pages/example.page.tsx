"use client";
import { useGetExample } from "../dao/example.query";
import { Button } from "@/components/ui/button";

export default function ExamplePage() {
  const { data, isLoading, error } = useGetExample();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <p className="text-muted-foreground" data-testid="example-loading">
          Loading...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div
          className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive"
          data-testid="example-error"
        >
          <p className="font-medium">Error loading example</p>
          <p className="text-sm mt-1" data-testid="example-error-message">
            {String(error.message)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-6">
      <div className="rounded-lg border border-border bg-card text-card-foreground p-6 max-w-md w-full shadow-sm">
        <h1
          className="text-lg font-semibold mb-2"
          data-testid="example-heading"
        >
          Example
        </h1>
        <p
          className="text-muted-foreground"
          data-testid="example-message"
        >
          {data?.message ?? "—"}
        </p>
      </div>
      <Button
        variant="default"
        onClick={() => window.location.reload()}
        data-testid="example-refresh"
      >
        Refresh
      </Button>
    </div>
  );
}
