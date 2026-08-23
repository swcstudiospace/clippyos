import { createServerFn } from "@tanstack/react-start";

export const fetchSessionUser = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const { getSessionUser } = await import("@/lib/auth/verify.server");
      const u = await getSessionUser();
      return u ? { id: u.id, email: u.email } : null;
    } catch (err) {
      console.error("[session] getSessionUser failed:", err);
      return null;
    }
  },
);
