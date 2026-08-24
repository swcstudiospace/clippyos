import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { requireAdmin } from "@/lib/server/access";
import { SAAS_PLAN_KEYS, PRODUCT_ONBOARDING_STEPS, type BillingSnapshot, type ProductOnboardingState } from "@/lib/billing";
import { auth } from "@/lib/auth/server";
import {
  buildBillingSnapshot,
  readProductOnboarding,
  refreshFromWhop,
  requestCancelAtPeriodEnd,
  startHostedCheckout,
  writeProductOnboarding,
} from "@/lib/server/billing.server";

async function authUser(userId: string): Promise<{ email: string; name: string }> {
  try {
    const ctx = await auth.$context;
    const user = await ctx.internalAdapter.findUserById(userId);
    if (user) {
      return {
        email: (user.email as string | undefined) ?? "",
        name: (user.name as string | undefined) ?? "",
      };
    }
  } catch {
    /* fall through */
  }
  return { email: "", name: "" };
}

export const getBillingSnapshot = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<BillingSnapshot> => {
    return buildBillingSnapshot(context.userId);
  });

export const refreshBillingEntitlement = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<BillingSnapshot> => {
    await refreshFromWhop();
    return buildBillingSnapshot(context.userId, "success");
  });

const CheckoutSchema = z.object({
  planKey: z.enum(SAAS_PLAN_KEYS),
});

export const startBillingCheckout = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => CheckoutSchema.parse(input))
  .handler(async ({ context, data }): Promise<{ sessionId: string; hostedUrl: string | null }> => {
    await requireAdmin(context.userId);
    const user = await authUser(context.userId);
    if (!user.email) throw new Error("BILLING_EMAIL_REQUIRED");
    return startHostedCheckout({
      userId: context.userId,
      planKey: data.planKey,
      email: user.email,
      name: user.name || user.email,
    });
  });

export const cancelWorkspaceSubscription = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<BillingSnapshot> => {
    await requireAdmin(context.userId);
    await requestCancelAtPeriodEnd();
    return buildBillingSnapshot(context.userId);
  });

export const getProductOnboarding = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async (): Promise<ProductOnboardingState> => {
    return readProductOnboarding();
  });

const ProductStepSchema = z.object({
  step: z.enum(PRODUCT_ONBOARDING_STEPS),
  done: z.boolean(),
});

export const setProductOnboardingStep = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => ProductStepSchema.parse(input))
  .handler(async ({ data }): Promise<ProductOnboardingState> => {
    const current = await readProductOnboarding();
    current.steps[data.step] = {
      done: data.done,
      at: data.done ? new Date().toISOString() : null,
    };
    return writeProductOnboarding(current);
  });

export const dismissProductOnboarding = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async (): Promise<ProductOnboardingState> => {
    const current = await readProductOnboarding();
    current.dismissed = true;
    return writeProductOnboarding(current);
  });
