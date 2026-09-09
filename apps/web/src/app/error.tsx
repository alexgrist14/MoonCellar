"use client";
import { useEffect } from "react";
import { logger } from "@/src/lib/shared/utils/logger.utils";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Логируем ошибку в Grafana
    logger.error("Next.js route error", error, {
      digest: error.digest,
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <h2 style={{ fontSize: "24px", marginBottom: "16px" }}>
        Something went wrong!
      </h2>
      <p style={{ marginBottom: "24px", color: "#888" }}>
        {error.message || "An unexpected error occurred"}
      </p>
      <button
        onClick={reset}
        style={{
          padding: "10px 20px",
          backgroundColor: "#0070f3",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        Try again
      </button>
    </div>
  );
}
