import { createUserOwnedService } from "./baseService.js";
export const bookingsService = createUserOwnedService({ table: "bookings", idField: "booking_id" });
