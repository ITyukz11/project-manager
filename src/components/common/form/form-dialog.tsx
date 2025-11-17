import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Spinner } from "@/components/ui/spinner"
import { preventDialogCloseProps } from "@/lib/utils/dialogcontent.utils"

interface FormDialogProps<TFormValues> {
  form: any
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  onSubmit?: (values: TFormValues) => void
  children: React.ReactNode
  submitLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
}

export function FormDialog<TFormValues>({
  form,
  open,
  onOpenChange,
  title,
  description,
  onSubmit,
  children,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  isLoading = false,
  maxWidth = "xl"
}: FormDialogProps<TFormValues>) {
  const widthClasses: Record<string, string> = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
    full: "sm:max-w-[90vw]"
  }
  const dialogWidth = widthClasses[maxWidth] || maxWidth

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`w-full max-h-[90vh] flex flex-col sm:rounded-lg ${dialogWidth}`} {...preventDialogCloseProps}>
        <Form {...form}>
          <form className="flex flex-col flex-1 overflow-hidden" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Header */}
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto py-4">{children}</div>

            {/* Footer */}
            <DialogFooter className="flex-shrink-0 flex flex-wrap gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button" disabled={isLoading}>
                  {cancelLabel}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {form.formState.isSubmitting || isLoading ? (
                  <>
                    <Spinner /> {submitLabel}...
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
