"use client";
import { useState } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { ClipboardList, Eye, EyeClosed } from "lucide-react";
import { cn } from "@/lib/utils";
import { ForgotPasswordDialog } from "./forgot-password-dialog";
import { LoginSchema } from "@/lib/validations/auth/login.validation";
// import { loginAndSendOTPAction, verifyOtpAndLoginAction } from "@/actions/server/login.actions"
import { toast } from "sonner";
import { signIn } from "next-auth/react";

export const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const router = useRouter();
  const [forgotPass, setForgotPass] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  const onSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);

    try {
      const signInResult = await signIn("credentials", {
        username: values.username,
        password: values.password,
        redirect: false, // we'll handle navigation
      });

      // If successful, fetch the session to get the user info!
      if (signInResult?.ok) {
        // Get session with user info
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();

        // Get first casino group ID (or handle missing)
        const firstCasinoGroup =
          session?.user?.casinoGroups?.[0]?.name || "default";

        toast.success("Login successful!");
        router.push(`/${firstCasinoGroup}/accounts`); // <-- redirect dynamically!
      } else {
        toast.error(signInResult?.error);
        setLoading(false);
      }
    } catch (err: unknown) {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col w-full justify-center items-center">
      <div className="w-full flex flex-col gap-y-4 items-center justify-center">
        <h1
          className={cn(
            "text-center text-2xl font-semibold text-primary flex items-center gap-2"
          )}
        >
          <ClipboardList className="w-6 h-6 text-primary" />
          Project Management System
        </h1>

        <p className="text-center text-xs md:text-sm text-muted-foreground mb-4">
          Enter your username below to login
        </p>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 w-full"
        >
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        disabled={loading}
                        className="pr-10"
                      />
                      {showPassword ? (
                        <Eye
                          size={16}
                          onClick={() => setShowPassword(false)}
                          className="absolute right-3 top-[1.2rem] transform -translate-y-1/2 cursor-pointer"
                        />
                      ) : (
                        <EyeClosed
                          size={16}
                          onClick={() => setShowPassword(true)}
                          className="absolute right-3 top-[1.2rem] transform -translate-y-1/2 cursor-pointer"
                        />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember-password"
              checked={isChecked}
              onClick={() => setIsChecked(!isChecked)}
              disabled={loading}
            />
            <label
              htmlFor="remember-password"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Remember password
            </label>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Spinner /> : "Login"}
          </Button>
        </form>
      </Form>
      <Button
        variant={"link"}
        disabled={loading}
        className="text-muted-foreground"
        onClick={() => setForgotPass(true)}
      >
        Forgot password?
      </Button>
      <ForgotPasswordDialog
        open={forgotPass}
        setClose={() => setForgotPass(!forgotPass)}
      />
    </div>
  );
};
