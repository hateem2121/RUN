import { motion } from "framer-motion";
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
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white/50 shadow-sm backdrop-blur-md transition-all hover:shadow-md focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring dark:border-glass dark:bg-black/50"
      aria-label="Toggle theme"
    >
      <Sun className="size-icon-sm rotate-0 scale-100 text-orange-500 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-icon-sm rotate-90 scale-0 text-blue-400 transition-all dark:rotate-0 dark:scale-100" />
    </motion.button>
  );
}
