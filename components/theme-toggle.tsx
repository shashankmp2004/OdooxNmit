"use client";

import * as motion from "motion/react-client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render after hydration to prevent SSR mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[60px] h-[30px]" />; // Placeholder to prevent layout shift
  }

  const isDark = theme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  return (
    <button
      className="toggle-container relative"
      style={{
        ...container,
        justifyContent: isDark ? "flex-end" : "flex-start",
        backgroundColor: isDark ? "hsl(220 13% 18%)" : "hsl(210 40% 95%)",
      }}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      <motion.div
        className="toggle-handle flex items-center justify-center"
        style={{
          ...handle,
          backgroundColor: isDark ? "hsl(210 40% 98%)" : "hsl(220 13% 18%)",
        }}
        layout
        transition={{
          type: "spring",
          visualDuration: 0.2,
          bounce: 0.2,
        }}
      >
        {isDark ? (
          <Moon className="w-3 h-3 text-slate-800" />
        ) : (
          <Sun className="w-3 h-3 text-slate-100" />
        )}
      </motion.div>
    </button>
  );
}

/**
 * ==============   Styles   ================
 */

const container = {
  width: 60,
  height: 30,
  borderRadius: 30,
  cursor: "pointer",
  display: "flex",
  padding: 6,
  border: "1px solid hsl(var(--border))",
  transition: "background-color 0.2s ease",
};

const handle = {
  width: 18,
  height: 18,
  borderRadius: "50%",
  transition: "background-color 0.2s ease",
};
