import { createUserOwnedService } from "./baseService.js";
export const cleaningService = createUserOwnedService({ table: "cleaning_tasks", idField: "cleaning_id" });
