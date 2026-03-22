import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-[18px]",
  {
    variants: {
      variant: {
        default:
          "bg-primary-700 text-white hover:bg-primary-800 active:bg-primary-900",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
        outline:
          "border-2 border-primary-700 text-primary-700 bg-white hover:bg-primary-50 active:bg-primary-100",
        secondary:
          "bg-warm-50 text-gray-800 border border-warm-200 hover:bg-warm-100",
        ghost:
          "text-gray-700 hover:bg-warm-50 active:bg-warm-100",
        success:
          "bg-success-600 text-white hover:bg-success-700",
        link:
          "text-primary-700 underline-offset-4 hover:underline p-0 h-auto min-h-0",
      },
      size: {
        default: "h-[52px] px-6 py-3",
        sm: "h-[44px] px-4 py-2 text-[16px]",
        lg: "h-[60px] px-8 py-4 text-[20px]",
        xl: "h-[64px] px-10 py-4 text-[22px] w-full",
        icon: "h-[52px] w-[52px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
