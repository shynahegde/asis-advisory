import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[18px] font-semibold text-gray-800"
          >
            {label}
          </label>
        )}
        {hint && (
          <p className="text-[16px] text-gray-500 -mt-1">{hint}</p>
        )}
        <textarea
          id={inputId}
          className={cn(
            "flex min-h-[120px] w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-[18px] text-gray-900 placeholder:text-gray-400",
            "transition-colors resize-y",
            "focus:outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-100",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
            error && "border-red-500 focus:border-red-500 focus:ring-red-100",
            className
          )}
          ref={ref}
          aria-describedby={error ? `${inputId}-error` : undefined}
          aria-invalid={!!error}
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-[16px] text-red-600 flex items-center gap-1"
            role="alert"
          >
            <span aria-hidden="true">⚠</span> {error}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
