import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-resti-green/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-resti-green text-white hover:bg-resti-green-dark shadow-sm active:scale-[0.99]",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline:
          "border border-resti-neutral-border bg-white text-resti-neutral-dark hover:bg-resti-green-light hover:text-resti-green-dark hover:border-resti-green/30",
        secondary:
          "border-[1.5px] border-resti-green bg-transparent text-resti-green hover:bg-resti-green-light hover:text-resti-green-dark",
        blue:
          "bg-resti-blue text-white hover:bg-resti-blue-dark shadow-sm active:scale-[0.99]",
        donate:
          "bg-resti-green text-white hover:bg-resti-green-dark shadow-sm active:scale-[0.99] font-bold",
        ghost:
          "hover:bg-resti-green-light hover:text-resti-green-dark",
        link: "text-resti-green underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-[8px] gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-11 rounded-[10px] px-6 has-[>svg]:px-4 text-base",
        icon: "size-10 rounded-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
