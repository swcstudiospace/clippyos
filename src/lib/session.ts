import { createServerFn } from "@tanstack/react-start";

export const fetchSessionUser = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const u = await getSessionUser();
    return u ? { id: u.id, email: u.email } : null;
  },
);
