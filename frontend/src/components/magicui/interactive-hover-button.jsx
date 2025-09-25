import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const InteractiveHoverButton = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "group relative w-auto cursor-pointer overflow-hidden rounded-full p-2 px-6 text-center font-semibold bg-white border-0 hover:border-white hover:border-2 transition-colors duration-300",
          className,
        )}
        {...props}
      >
        {/* พื้นหลังม่วง radial ขยายออกจาก dot */}
        <span
          className="absolute left-4 top-1/2 -translate-y-1/2 z-0 h-4 w-4 rounded-full bg-[#8B5CF6] scale-0 opacity-0 group-hover:scale-[8] group-hover:opacity-100 transition-transform transition-opacity duration-300 pointer-events-none"
          aria-hidden="true"
        />
        <div className="flex items-center gap-2 relative z-10">
          <div className="h-2 w-2 rounded-full bg-[#8B5CF6] transition-all duration-300 group-hover:bg-transparent group-hover:opacity-0"></div>
          <span className="inline-block transition-all duration-300 text-[#8B5CF6] group-hover:text-white group-hover:translate-x-12 group-hover:opacity-0">{children}</span>
        </div>
        <div className="absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 text-white opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100">
          <span>{children}</span>
          <ArrowRight />
        </div>
      </button>
    );
  }
);

InteractiveHoverButton.displayName = "InteractiveHoverButton";
