"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration issues
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  const toggle = () => {
    const html = document.documentElement;
    html.classList.add("theme-transition");
    setTheme(isDark ? "light" : "dark");
    setTimeout(() => html.classList.remove("theme-transition"), 350);
  };

  return (
    <button
      onClick={toggle}
      className="relative inline-flex h-6 w-11 items-center rounded-full bg-border hover:bg-muted transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
      style={{
        justifyContent: isDark ? "flex-end" : "flex-start",
        padding: "2px",
      }}
      aria-pressed={isDark}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <motion.div
        className="h-5 w-5 bg-foreground rounded-full flex items-center justify-center shadow-sm"
        layout
        transition={{
          duration: 0.2,
          ease: "easeOut",
        }}
      >
        {isDark ? (
          <Moon className="h-3 w-3 text-background" />
        ) : (
          <Sun className="h-3 w-3 text-background" />
        )}
      </motion.div>
    </button>
  );
}
