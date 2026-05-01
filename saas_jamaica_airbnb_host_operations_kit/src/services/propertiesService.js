import { createUserOwnedService } from "./baseService.js";
export const propertiesService = createUserOwnedService({ table: "properties", idField: "property_id" });
