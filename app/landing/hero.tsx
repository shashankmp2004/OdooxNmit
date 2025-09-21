"use client";

import React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Zap, ArrowRight } from "lucide-react";
import Typewriter from "typewriter-effect";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const Hero = ({ isAuthed = false }: { isAuthed?: boolean }) => {
  return (
    <section className="relative py-32 bg-background overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-12 max-w-7xl mx-auto">
          {/* Left: Text */}
          <div className="w-full lg:w-1/2 text-center lg:text-left flex flex-col items-center lg:items-start animate-fade-in">
            <Badge
              variant="secondary"
              className="mb-6 inline-flex items-center"
            >
              <Zap className="mr-2 h-3 w-3" />
              Streamline your manufacturing operations
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              The complete platform to{" "}
              <span className="text-primary block h-[144px] leading-[72px]">
                {/* Fixed height wrapper for two lines */}
                <Typewriter
                  options={{
                    strings: [
                      "Optimize<br>Manufacturing",
                      "Streamline<br>Production",
                      "Boost<br>Efficiency",
                    ],
                    autoStart: true,
                    loop: true,
                    cursor: "|",
                    delay: 80,
                    deleteSpeed: 50,
                  }}
                />
              </span>
            </h1>

            <p className="mt-20 text-lg leading-8 text-muted-foreground max-w-2xl">
              Your team's toolkit to stop configuring and start innovating.
              Securely manage, track, and scale your manufacturing operations
              with real-time insights.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6">
              <Button asChild size="lg" className="h-12 px-8">
                <Link href={isAuthed ? "/dashboard" : "/signup"}>
                  {isAuthed ? "Go to Dashboard" : "Get Started"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="relative group overflow-hidden px-6 py-3 rounded-xl border border-white/20 bg-white/10 shadow-xl transition-transform hover:scale-[1.02] dark:border-white/40 dark:bg-black/30"
              >
                <Link href="#demo">Watch Demo</Link>
              </Button>
            </div>
          </div>

          {/* Right: Image */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end animate-fade-in">
            <Image
              src="/banner.png"
              alt="ManufactureOS Banner"
              width={600}
              height={400}
              className="rounded-2xl object-cover shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Fade-in animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 1.2s ease-in-out both;
        }
      `}</style>
    </section>
  );
};
