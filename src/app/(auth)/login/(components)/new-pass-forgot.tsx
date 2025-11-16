"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"

interface NewForgotPasswordDialogProps {
  open: boolean
  setClose: () => void
  forgotPassEmail: string
  setCloseForgotPassDialog: () => void
}

type ApiResponse = { error?: string; message?: string }

export function NewForgotPasswordDialog({ open, setClose, forgotPassEmail, setCloseForgotPassDialog }: NewForgotPasswordDialogProps) {
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPass, setRepeatPass] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      setError("Please enter the 6-digit code.")
      return
    }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/user/update-forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotPassEmail,
          code: otp,
          verifyOnly: true
        })
      })

      const data = (await res.json()) as ApiResponse

      console.log(data)
      if (data.error) {
        toast.error("Failed to change password.")
        setError(data.error)
      } else {
        setVerified(true)
        toast.success("Code verified. You can now reset your password.")
      }
      console.log("updateForgotPass")
    } catch (err) {
      console.error(err)
      setError("Verification failed. Try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== repeatPass) {
      return setError("Passwords do not match.")
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters.")
    }

    setLoading(true)
    try {
      const res = await fetch("/api/user/update-forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotPassEmail,
          code: otp,
          verifyOnly: true
        })
      })
      console.log(res)

      const data = (await res.json()) as ApiResponse

      if (data.error) {
        setCloseForgotPassDialog()
        setClose()
        toast.error(data.error)
      } else {
        toast.success("Password updated successfully! You can now login.")
        setCloseForgotPassDialog()
        setClose()
      }
    } catch (err: any) {
      console.log("Error: ", err)
      setError("Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setOtp("")
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>{verified ? "Enter your new password below." : "Enter the 6-digit code sent to your email."}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={
            verified
              ? handleReset
              : e => {
                  e.preventDefault()
                  verifyOtp()
                }
          }
        >
          <div className="flex flex-col gap-4 py-4">
            {!verified && (
              <div className="flex flex-col items-center">
                <Label className="mb-2">Verification Code</Label>
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    {[...Array(6)].map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            )}

            {verified && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    New Password
                  </Label>
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="col-span-3" disabled={loading} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="repeat-password" className="text-right">
                    Repeat
                  </Label>
                  <Input
                    id="repeat-password"
                    type="password"
                    value={repeatPass}
                    onChange={e => setRepeatPass(e.target.value)}
                    className="col-span-3"
                    disabled={loading}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center">
            <Label className="text-destructive">{error}</Label>
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner /> : verified ? "Confirm" : "Verify Code"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
