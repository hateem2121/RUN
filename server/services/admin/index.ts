export * from "./admin.service.js"; // or "./admin.service"
// If I use .js extensions in imports, I should use .js here too for ESM compatibility?
// The file is TS, but imports use .js in the project.
// Re-exporting:
export { adminService } from "./admin.service.js";
