import { useEffect } from "react";

const LOADER_SRC = "https://js.whop.com/static/checkout/loader.js";

/**
 * Whop embedded checkout via the official loader script — no npm dependency.
 * The data attributes are the loader's documented contract; it swaps the div
 * for a sandboxed iframe that collects card data (never touching our server).
 */
export function WhopCheckoutEmbed({
  sessionId,
  returnUrl,
}: {
  sessionId: string;
  returnUrl: string;
}) {
  useEffect(() => {
    if (document.querySelector(`script[src="${LOADER_SRC}"]`)) return;
    const script = document.createElement("script");
    script.src = LOADER_SRC;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  return (
    <div
      key={sessionId}
      data-whop-checkout-session={sessionId}
      data-whop-checkout-return-url={returnUrl}
    />
  );
}
