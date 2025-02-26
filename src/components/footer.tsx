"use client";

import SocialMediaLinks from "./social-links";

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-col items-center justify-center gap-4 py-6 md:h-16 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by{" "}
            <a
              href="https://github.com/quilantera"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              QuiL
            </a>
            . The source code is available on{" "}
            <a
              href="https://github.com/quilantera/quildetection"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              GitHub
            </a>
            .
          </p>
        </div>
        <SocialMediaLinks />
      </div>
    </footer>
  );
}
