import { createUserOwnedService } from "./baseService.js";
export const leadsService = createUserOwnedService({ table: "direct_booking_leads", idField: "lead_id" });
