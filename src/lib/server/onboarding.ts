import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  buildClientAgreementPdf,
  CLIENT_AGREEMENT_FILENAME,
} from "@/lib/server/client-agreement-pdf";

export const downloadClientAgreement = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const pdf = buildClientAgreementPdf();
    return {
      filename: CLIENT_AGREEMENT_FILENAME,
      contentType: "application/pdf",
      base64: Buffer.from(pdf).toString("base64"),
    };
  });
