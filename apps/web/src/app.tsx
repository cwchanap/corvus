import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { MetaProvider } from "@solidjs/meta";
import { AuthProvider } from "./lib/auth/context.jsx";
import "./app.css";
import "@repo/ui-components/styles";

// Suppress ResizeObserver loop warnings
if (typeof window !== "undefined") {
  const resizeObserverError = (e: ErrorEvent) => {
    if (
      e.message ===
      "ResizeObserver loop completed with undelivered notifications."
    ) {
      e.stopImmediatePropagation();
      return false;
    }
    return true;
  };
  window.addEventListener("error", resizeObserverError);
}

export default function App() {
  return (
    <MetaProvider>
      <AuthProvider>
        <Router
          root={(props) => (
            <Suspense fallback={<div>Loading...</div>}>
              {props.children}
            </Suspense>
          )}
        >
          <FileRoutes />
        </Router>
      </AuthProvider>
    </MetaProvider>
  );
}
