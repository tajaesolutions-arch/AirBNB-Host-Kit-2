import { createUserOwnedService } from "./baseService.js";
export const ownerReportsService = createUserOwnedService({ table: "owner_reports", idField: "report_id" });
