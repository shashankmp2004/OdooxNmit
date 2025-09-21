"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{
          opacity: 0,
          y: 8,
          scale: 0.996,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: -8,
          scale: 0.996,
        }}
        transition={{
          duration: 0.25,
          ease: [0.25, 0.46, 0.45, 0.94], // Custom smooth bezier curve
          opacity: { duration: 0.2 },
          scale: { duration: 0.25, ease: "easeOut" },
          y: { duration: 0.25, ease: "easeOut" },
        }}
        className="w-full min-h-screen"
        style={{
          willChange: "transform, opacity", // Optimize for animations
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
