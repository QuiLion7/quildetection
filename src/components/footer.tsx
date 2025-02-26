"use client";

import SocialMediaLinks from "./social-links";

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container w-full flex flex-col items-center justify-center gap-2 py-6 md:h-16 md:py-0">
        <div className="">
          <SocialMediaLinks />
        </div>
        <p className="text-xs text-muted-foreground">
          © {currentYear} Quilion Oliveira. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
