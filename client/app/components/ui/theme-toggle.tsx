import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-10 w-10 rounded-full border border-neutral-200 bg-white/50 backdrop-blur-md dark:border-glass dark:bg-black/50" />
    );
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="relative flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white/50 shadow-sm backdrop-blur-md transition-all hover:scale-105 hover:shadow-md active:scale-95 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring dark:border-glass dark:bg-black/50"
      aria-label={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} theme`}
    >
      {resolvedTheme === "light" ? (
        <Sun className="h-5 w-5 text-theme-sun" />
      ) : (
        <Moon className="h-5 w-5 text-theme-moon" />
      )}
    </button>
  );
}
