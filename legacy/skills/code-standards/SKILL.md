---
name: code-standards
description: |
  Comprehensive coding standards and patterns for React 19, Express 5, and Tailwind V4.
  Triggers: "coding standards", "React patterns", "Express patterns", "Tailwind v4 usage"
---

# Code Standards & Patterns

## TypeScript Standards
- **Strict Mode**: Must be enabled.
- **No `any`**: Strictly forbidden. Use `unknown` or specific types.
- **Return Types**: Always specify explicit return types for functions.

## React 19 Patterns
- **Named Exports**: Use named exports for all components.
- **Functional Components**: No class components.
- **Raw Ref Prop**: Use the raw `ref` prop (no `forwardRef`).
- **Hooks**: Follow proper hooks usage with cancellation logic in `useEffect`.

## Express 5 Backend Patterns
- **Async Handlers**: No need for try/catch wrappers (handled automatically).
- **Thin Routes**: Routes should only handle requests and responses.
- **Thick Services**: All business logic and database operations must be in services.
- **Validation**: Always use Zod for request body and parameter validation.

## Tailwind V4 Styling
- **CVA**: Use `class-variance-authority` for component variants.
- **@utility layer**: Define custom CSS in the `@utility` layer.
- **No Arbitrary Values**: Forbid `w-[342px]` style arbitrary values in JSX.

## Error Handling
- **Client**: Use Error Boundaries for critical sections. Handle loading, error, and empty states.
- **Server**: Throw custom error classes (e.g., `ProductNotFoundError`).
