import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-gray-200/50 bg-gradient-to-br from-white/90 to-white/80 backdrop-blur-sm",
      "dark:from-gray-900/90 dark:to-gray-800/90 dark:border-gray-700/50",
      "shadow-lg hover:shadow-xl transition-all duration-300",
      "dark:text-gray-100 dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

export { Card };
