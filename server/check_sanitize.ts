import mongoSanitize from "express-mongo-sanitize";

console.log("Type of default export:", typeof mongoSanitize);
console.log("Has sanitize property?", "sanitize" in mongoSanitize);
if (mongoSanitize.sanitize) {
  console.log("sanitize is a function:", typeof mongoSanitize.sanitize === "function");
} else {
  console.log("sanitize property missing on default export");
}
