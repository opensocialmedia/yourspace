"use client";

// Cloudflare Turnstile widget (the human check on the follow form).
// Loads the script once and renders explicitly so we can capture the
// token in React state.

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: {
          sitekey: string;
          theme?: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function TurnstileWidget({
  siteKey,
  onToken,
}: {
  siteKey: string;
  onToken: (token: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function render() {
      if (!window.turnstile || !container || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(container, {
        sitekey: siteKey,
        theme: "dark",
        callback: onToken,
        "expired-callback": () => onToken(null),
      });
    }

    if (window.turnstile) {
      render();
    } else {
      let script = document.querySelector<HTMLScriptElement>(
        `script[src="${SCRIPT_SRC}"]`,
      );
      if (!script) {
        script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  return <div ref={containerRef} />;
}
