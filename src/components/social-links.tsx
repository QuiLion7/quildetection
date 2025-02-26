"use client";
import Link from "next/link";
import { Github, Instagram, Linkedin, Youtube } from "lucide-react";

const SocialMediaLinks = () => {
  return (
    <div className=" flex h-full w-full flex-row items-center justify-left gap-4">
      <Link
        className="rounded-full p-1 duration-300 hover:scale-110 hover:rounded-full hover:bg-secondary-foreground hover:text-secondary hover:duration-300"
        href="https://github.com/QuiLion7"
        target="_blank"
      >
        <Github className="w-4 h-4 md:w-5 md:h-5" />
      </Link>
      <Link
        className="rounded-full p-1 duration-300 hover:scale-110 hover:rounded-full hover:bg-secondary-foreground hover:text-secondary hover:duration-300"
        href="https://www.linkedin.com/in/quilion7/"
        target="_blank"
      >
        <Linkedin className="w-4 h-4 md:w-5 md:h-5" />
      </Link>
      <Link
        className="rounded-full p-1 duration-300 hover:scale-110 hover:rounded-full hover:bg-secondary-foreground hover:text-secondary hover:duration-300"
        href="https://www.instagram.com/quilion7"
        target="_blank"
      >
        <Instagram className="w-4 h-4 md:w-5 md:h-5" />
      </Link>
    </div>
  );
};

export default SocialMediaLinks;
