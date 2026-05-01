import { createUserOwnedService } from "./baseService.js";
export const taxReserveService = createUserOwnedService({ table: "tax_reserve_records", idField: "tax_record_id" });
