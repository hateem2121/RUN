# SOP: Code Change Execution

## 1. Analysis Phase
- **Context Search**: Grep for related components, services, and types.
- **Dependency Audit**: Identify if the change affects other modules (especially Port 5002 compliance).
- **Find Findings**: Reference `findings.md` and `gemini.md` for architectural invariants.

## 2. Planning Phase
- **Update task_plan.md**: Add the new task if not already tracked.
- **Update findings.md**: Add any specific technical discoveries related to this change.
- **Update gemini.md**: If a new invariant is discovered, codify it here first.

## 3. Implementation Phase
- **Atomic Edits**: Use `multi_replace_file_content` for non-contiguous changes.
- **No 'any'**: Strict TypeScript safety.
- **3D Logic**: Always use `LazyUnifiedModelViewer`.
- **Styling**: Prioritize `@utility` tokens from `index.css`.

## 4. Verification Phase
- **Build**: `npm run build` MUST pass.
- **Port**: `npm run verify-port` MUST pass.
- **Logic**: Run relevant `.test.ts` files with Vitest.
- **Progress**: Update `progress.md` with action details and results.

## 5. Closure
- **Notify**: Update user via `notify_user` with a concise summary.
