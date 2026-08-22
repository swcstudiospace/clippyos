import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { markPaymentPaid } from "@/lib/server/clients";
import { MONEY_QUERY_KEY, type MoneySnapshot } from "@/lib/money";
import { todayIsoDate } from "@/lib/format";
import { captureClientError, userFacingErrorMessage } from "@/lib/errors";

/** Same mutation used by Money “Mark as Paid” and Calendar “Mark collected”. */
export function useMarkPaymentPaid(source = "mark-paid") {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => markPaymentPaid({ data: id }),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: MONEY_QUERY_KEY });
      const prev = queryClient.getQueryData<MoneySnapshot>(MONEY_QUERY_KEY);
      if (prev) {
        queryClient.setQueryData<MoneySnapshot>(MONEY_QUERY_KEY, {
          ...prev,
          payments: prev.payments.map((payment) =>
            payment.id === id
              ? { ...payment, status: "PAID", paidDate: todayIsoDate() }
              : payment,
          ),
        });
      }
      return { prev };
    },
    onError: (error, id, ctx) => {
      captureClientError(error, { source });
      const already =
        error instanceof Error && error.message === "PAYMENT_ALREADY_PAID";
      if (already) {
        toast.message(userFacingErrorMessage(error));
        void queryClient.invalidateQueries({ queryKey: MONEY_QUERY_KEY });
        return;
      }
      if (ctx?.prev) queryClient.setQueryData(MONEY_QUERY_KEY, ctx.prev);
      toast.error(userFacingErrorMessage(error), {
        action: {
          label: "Retry",
          onClick: () => mutation.mutate(id),
        },
      });
    },
    onSuccess: async () => {
      toast.success("Marked as paid");
      await queryClient.invalidateQueries({ queryKey: MONEY_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      await queryClient.invalidateQueries({ queryKey: ["client"] });
    },
  });

  return mutation;
}
