"use client";
import { motion } from "framer-motion";
import { LoginForm } from "./(components)/login-form";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

const LoginPage = () => {
  const { data: session } = useSession();

  console.log("Current session in login page:", session);
  return (
    <div
      className={cn(
        "border-2 border-border/80 shadow-2xl rounded-xl relative",
        " overflow-hidden flex flex-col transition-all ease-in-out duration-300",
        "bg-card max-w-md w-full mx-auto"
      )}
    >
      <div className="col-span-2 p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <div className="flex flex-row max-w-3xl w-full justify-center items-center">
          <motion.div
            className="w-full"
            key="login"
            initial={{ x: "-6%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-6%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          >
            <LoginForm />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
