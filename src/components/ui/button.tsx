import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:bg-primary/90 active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:shadow-md hover:bg-destructive/90 active:scale-[0.98]",
        outline: "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground hover:shadow-sm active:scale-[0.98]",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 hover:shadow-sm active:scale-[0.98]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success text-success-foreground shadow-sm hover:shadow-md hover:bg-success/90 active:scale-[0.98]",
        warning: "bg-warning text-warning-foreground shadow-sm hover:shadow-md hover:bg-warning/90 active:scale-[0.98]",
        gradient: "gradient-primary text-primary-foreground shadow-md hover:shadow-lg hover:opacity-90 active:scale-[0.98]",
        glass: "glass hover:bg-card/90 active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-lg",
        sm: "h-9 px-3 rounded-md text-xs",
        lg: "h-11 px-8 rounded-lg",
        xl: "h-12 px-10 rounded-xl text-base",
        icon: "h-10 w-10 rounded-lg",
        "icon-sm": "h-8 w-8 rounded-md",
        "icon-lg": "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
