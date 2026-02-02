// src/components/Span.tsx
import type { ReactNode } from "react";

interface SpanProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "primary" | "secondary" | "accent" | "success" | "warning" | "error" | "info";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  bold?: boolean;
}

export default function Span({ 
  children, 
  className = "", 
  variant = "default",
  size = "md",
  bold = false
}: SpanProps) {
  const variantClasses = {
    default: "",
    primary: "text-neo-primary",
    secondary: "text-neo-secondary",
    accent: "text-accent",
    success: "text-success",
    warning: "text-warning",
    error: "text-error",
    info: "text-info"
  };

  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl"
  };

  return (
    <span 
      className={`
        ${variantClasses[variant]} 
        ${sizeClasses[size]} 
        ${bold ? "font-bold" : ""} 
        ${className}
      `.trim()}
    >
      {children}
    </span>
  );
}