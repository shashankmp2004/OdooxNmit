"use client";

import PageTransition from "@/components/PageTransitions";

export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
