import { createUserOwnedService } from "./baseService.js";
export const guestsService = createUserOwnedService({ table: "guests", idField: "guest_id" });
