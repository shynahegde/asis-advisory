import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-[14px] font-semibold",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-700",
        submitted: "bg-gray-100 text-gray-700",
        triaging: "bg-blue-100 text-blue-700",
        assigned: "bg-purple-100 text-purple-700",
        in_progress: "bg-amber-100 text-amber-700",
        resolved: "bg-green-100 text-green-700",
        remote: "bg-red-100 text-red-700",
        onsite: "bg-blue-100 text-blue-700",
        success: "bg-green-100 text-green-700",
        warning: "bg-amber-100 text-amber-700",
        error: "bg-red-100 text-red-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
