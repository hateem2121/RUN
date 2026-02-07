---
description: How to start and stop the development server safely
---

# Safe Dev Server Management

This workflow ensures you never have duplicate dev server instances running.

## Parallel Start (Recommended for Exit Code 137)

If `npm run dev` fails with exit code 137, start client and server separately:

// turbo
```bash
# Terminal 1 - Client only
npm run --workspace=@run-remix/client dev
```

// turbo
```bash
# Terminal 2 - Server only
npm run dev:server
```

## Starting the Dev Server

// turbo
1. Kill any existing processes and start fresh:
```bash
npm run dev -- --force
```

The `predev` script automatically kills orphaned processes on port 5002 before starting.

## Stopping the Dev Server

2. Press `Ctrl+C` in the terminal to stop gracefully

3. If the terminal is closed unexpectedly or processes are stuck, run:
```bash
pkill -f 'tsx watch'
pkill -f 'turbo run dev'
npx kill-port 5002
```

## Common Issues

### Multiple servers running
If you see multiple `npm run dev` processes in your terminal list:
1. Stop all terminals running the dev command
2. Run the cleanup commands from step 3 above
3. Start a single fresh instance

### Port 5002 already in use
```bash
npx kill-port 5002
```

## Best Practices

- **Never** run `npm run dev` in multiple terminals simultaneously
- Use **one terminal** for the dev server; use VS Code's integrated terminal
- If you need to restart, press `Ctrl+C` first, then start again
- Use `127.0.0.1:5002` instead of `localhost:5002` for reliable browsing
