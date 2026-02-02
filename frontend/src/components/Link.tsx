// src/components/Link.tsx
import type { ReactNode, MouseEvent } from "react";

interface LinkProps {
  href: string;
  children: ReactNode;
  variant?: "default" | "primary" | "secondary" | "accent";
  bold?: boolean;
  className?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

export default function Link({ 
  href, 
  children, 
  variant = "default",
  bold = false,
  className = "",
  onClick
}: LinkProps) {
  const variantClasses = {
    default: "link",
    primary: "link link-primary",
    secondary: "link link-secondary",
    accent: "link link-accent"
  };

  return (
    <a 
      href={href} 
      onClick={onClick}
      className={`${variantClasses[variant]} ${bold ? "font-bold" : ""} ${className}`}
    >
      {children}
    </a>
  );
}