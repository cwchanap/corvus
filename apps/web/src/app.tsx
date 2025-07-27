import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { AuthProvider } from "./lib/auth/context";
import "./app.css";
import "@repo/ui-components/styles";

export default function App() {
  return (
    <AuthProvider>
      <Router
        root={(props) => (
          <Suspense fallback={<div>Loading...</div>}>{props.children}</Suspense>
        )}
      >
        <FileRoutes />
      </Router>
    </AuthProvider>
  );
}
