import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-resti-green/20 bg-resti-green-light text-resti-green-dark",
        secondary:
          "border-resti-neutral-border bg-resti-neutral-light text-resti-neutral-dark",
        destructive:
          "border-transparent bg-destructive text-white",
        outline:
          "border-resti-neutral-border text-resti-neutral-dark",
        green:
          "border-resti-green/20 bg-resti-green-light text-resti-green-dark",
        blue:
          "border-resti-blue/20 bg-resti-blue-light text-resti-blue-dark",
        gold:
          "border-resti-gold/30 bg-resti-gold-light text-resti-gold-dark",
        orange:
          "border-resti-orange/30 bg-resti-orange-light text-resti-orange-dark",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
