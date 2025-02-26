"use client";

import { ModeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { Github } from "lucide-react";

export function Header(): JSX.Element {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              QuiL Detection
            </span>
          </a>
        </div>

        <nav className="flex items-center gap-4">
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}
