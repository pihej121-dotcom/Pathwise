import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { AlertCircle, CheckCircle, Info } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const Icon = variant === "destructive" ? AlertCircle : CheckCircle
        const iconColor = variant === "destructive" 
          ? "text-red-600 dark:text-red-400" 
          : "text-green-600 dark:text-green-400"
        
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3 w-full">
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} aria-hidden="true" />
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
