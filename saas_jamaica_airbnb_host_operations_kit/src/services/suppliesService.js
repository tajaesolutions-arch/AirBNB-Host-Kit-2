import { createUserOwnedService } from "./baseService.js";
export const suppliesService = createUserOwnedService({ table: "supplies", idField: "supply_id" });
