import { createUserOwnedService } from "./baseService.js";
export const expensesService = createUserOwnedService({ table: "expenses", idField: "expense_id" });
