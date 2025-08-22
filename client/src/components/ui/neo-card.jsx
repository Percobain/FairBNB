import * as React from "react"
import { cn } from "../../lib/utils"

const NeoCard = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-neo border-2 border-neo-black bg-neo-white shadow-neo",
      className
    )}
    {...props}
  />
))
NeoCard.displayName = "NeoCard"

const NeoCardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
NeoCardHeader.displayName = "NeoCardHeader"

const NeoCardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-2xl font-bold leading-none tracking-tight", className)}
    {...props}
  />
))
NeoCardTitle.displayName = "NeoCardTitle"

const NeoCardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-neo-gray", className)}
    {...props}
  />
))
NeoCardDescription.displayName = "NeoCardDescription"

const NeoCardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
NeoCardContent.displayName = "NeoCardContent"

const NeoCardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
NeoCardFooter.displayName = "NeoCardFooter"

export { NeoCard, NeoCardHeader, NeoCardFooter, NeoCardTitle, NeoCardDescription, NeoCardContent }
