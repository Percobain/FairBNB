import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const neoButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-neo text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-x-1 active:translate-y-1 active:shadow-none",
  {
    variants: {
      variant: {
        default: "bg-neo-yellow text-neo-black shadow-neo border-2 border-neo-black hover:bg-neo-orange",
        destructive: "bg-neo-red text-neo-white shadow-neo border-2 border-neo-black hover:bg-red-600",
        outline: "border-2 border-neo-black bg-neo-white text-neo-black shadow-neo hover:bg-neo-gray hover:text-neo-white",
        secondary: "bg-neo-purple text-neo-white shadow-neo border-2 border-neo-black hover:bg-purple-600",
        ghost: "hover:bg-neo-gray hover:text-neo-white",
        link: "text-neo-black underline-offset-4 hover:underline",
        success: "bg-neo-green text-neo-white shadow-neo border-2 border-neo-black hover:bg-green-600",
        warning: "bg-neo-orange text-neo-white shadow-neo border-2 border-neo-black hover:bg-orange-600",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-9 px-4 py-2",
        lg: "h-14 px-8 py-4 text-base",
        xl: "h-16 px-10 py-5 text-lg",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const NeoButton = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(neoButtonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
NeoButton.displayName = "NeoButton"

export { NeoButton, neoButtonVariants }
