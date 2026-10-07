"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import { makeQueryClient } from "../../lib/query/client";

// Devtools are loaded only in development, never shipped to production users.
const Devtools =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("@tanstack/react-query-devtools").then((m) => m.ReactQueryDevtools), { ssr: false })
    : () => null;

/** One QueryClient per browser session for the signed-in app. Mounted in src/app/dashboard/layout.tsx. */
export default function QueryProvider({ children }: { children: ReactNode }) {
  // useState (not a module-level singleton) so a client is never shared between users/requests on the server.
  const [client] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={client}>
      {children}
      <Devtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
