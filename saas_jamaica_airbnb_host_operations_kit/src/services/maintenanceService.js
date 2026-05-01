import { createUserOwnedService } from "./baseService.js";
export const maintenanceService = createUserOwnedService({ table: "maintenance_issues", idField: "issue_id" });
