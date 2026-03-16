import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "destructive" | "success";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-neon/30 bg-neon/10 text-neon",
    secondary: "border-border bg-secondary text-secondary-foreground",
    destructive: "border-neon-red/30 bg-neon-red/10 text-neon-red",
    success: "border-neon/30 bg-neon/10 text-neon",
    outline: "text-foreground border border-border",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider border transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
