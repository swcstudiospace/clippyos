import { d as todayIsoDate } from "./format-DaT2NYM9.mjs";
import { r as MONEY_QUERY_KEY } from "./money-n66k7fz5.mjs";
import { u as markPaymentPaid } from "./clients-CmcyBPZd.mjs";
import { i as useQueryClient, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { m as userFacingErrorMessage, p as captureClientError } from "./router-DRtNPEcw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-mark-payment-paid-DS6VRsGH.js
/** Same mutation used by Money “Mark as Paid” and Calendar “Mark collected”. */
function useMarkPaymentPaid(source = "mark-paid") {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: (id) => markPaymentPaid({ data: id }),
		onMutate: async (id) => {
			await queryClient.cancelQueries({ queryKey: MONEY_QUERY_KEY });
			const prev = queryClient.getQueryData(MONEY_QUERY_KEY);
			if (prev) queryClient.setQueryData(MONEY_QUERY_KEY, {
				...prev,
				payments: prev.payments.map((payment) => payment.id === id ? {
					...payment,
					status: "PAID",
					paidDate: todayIsoDate()
				} : payment)
			});
			return { prev };
		},
		onError: (error, id, ctx) => {
			captureClientError(error, { source });
			if (error instanceof Error && error.message === "PAYMENT_ALREADY_PAID") {
				toast.message(userFacingErrorMessage(error));
				queryClient.invalidateQueries({ queryKey: MONEY_QUERY_KEY });
				return;
			}
			if (ctx?.prev) queryClient.setQueryData(MONEY_QUERY_KEY, ctx.prev);
			toast.error(userFacingErrorMessage(error), { action: {
				label: "Retry",
				onClick: () => mutation.mutate(id)
			} });
		},
		onSuccess: async () => {
			toast.success("Marked as paid");
			await queryClient.invalidateQueries({ queryKey: MONEY_QUERY_KEY });
			await queryClient.invalidateQueries({ queryKey: ["clients"] });
			await queryClient.invalidateQueries({ queryKey: ["client"] });
		}
	});
	return mutation;
}
//#endregion
export { useMarkPaymentPaid as t };
