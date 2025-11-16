"use client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { Spinner } from "@/components/ui/spinner"
import { NewForgotPasswordDialog } from "./new-pass-forgot"

interface ForgotPasswordDialogProps {
  open: boolean
  setClose: () => void
}

export function ForgotPasswordDialog({ open, setClose }: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState<string>("")

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const [confirmedEmail, setConfirmedEmail] = useState<boolean>(false)

  // const handleSubmit = async (e: React.FormEvent) => {
  //     e.preventDefault();
  //     setLoading(true);
  //     setError(null);

  //         try {

  //             const values = {
  //                 email: email
  //             }

  //             verifyemail(values)
  //                 .then((data) => {
  //                     setError(data.error || null)

  //                     if(!data.error){
  //                         setConfirmedEmail(true)
  //                     }
  //                 });
  //         } catch (err: any) {
  //             console.error("Error verifying password:", err);
  //             setError(err.message || "An error occurred while verifying the password. Please try again.");
  //         }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/user/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong")
        return
      }

      setConfirmedEmail(true)
    } catch (err: unknown) {
      setError("Failed to send reset code. Try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (error) {
      setLoading(false)
    }
  }, [error])

  const avoidDefaultDomBehavior = (e: Event) => {
    e.preventDefault()
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape" || event.keyCode === 27) {
      event.stopPropagation()
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setClose}>
        <DialogContent
          className="sm:max-w-[425px]"
          onPointerDownOutside={avoidDefaultDomBehavior}
          onInteractOutside={avoidDefaultDomBehavior}
          onKeyDown={handleKeyDown}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Forgot Your Password?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              To reset your password, please enter the email associated with your account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input id="email" value={email} onChange={e => setEmail(e.target.value)} className="col-span-3" disabled={loading} />
              </div>
            </div>
            <DialogFooter className="flex justify-between flex-row items-center">
              <Label className="text-destructive">{error}</Label>{" "}
              <Button type="submit" disabled={loading}>
                {loading ? <Spinner /> : "Confirm"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <NewForgotPasswordDialog
        open={confirmedEmail}
        setClose={() => setConfirmedEmail(!confirmedEmail)}
        forgotPassEmail={email}
        setCloseForgotPassDialog={() => setClose()}
      />
    </>
  )
}
