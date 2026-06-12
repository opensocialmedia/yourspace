"use client";

// Email-capture flow state for the follow gate.

import { useState } from "react";
import { apiFetch, ApiError } from "@/hooks/use-api";

type SubscribeState =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "sent"; message: string }
  | { phase: "error"; message: string };

export function useSubscribe() {
  const [state, setState] = useState<SubscribeState>({ phase: "idle" });

  async function subscribe(email: string, turnstileToken: string) {
    setState({ phase: "submitting" });
    try {
      const result = await apiFetch<{ message: string }>("/api/subscribers", {
        method: "POST",
        body: JSON.stringify({ email, turnstileToken }),
      });
      setState({ phase: "sent", message: result.message });
    } catch (err) {
      setState({
        phase: "error",
        message: err instanceof ApiError ? err.message : "Something went wrong",
      });
    }
  }

  return { state, subscribe };
}
