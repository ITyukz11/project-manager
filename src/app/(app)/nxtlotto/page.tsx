"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Loader2 } from "lucide-react"; // shadcn SVG loader for spinner
import { Card, CardContent } from "@/components/ui/card";
import { Title } from "@/components/Title";

const ADMIN_ID = "35b63fa8-b58b-4cbc-b6bd-1da5f07d5a49";

export default function Home() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  const handleSsoRedirect = async () => {
    setLoading(true);
    const res = await fetch(
      `/api/generate-sso-token?adminId=${encodeURIComponent(ADMIN_ID)}`
    );
    const data = await res.json();
    if (data.token) {
      const lottoSsoUrl = `https://stl-web-seven.vercel.app/sso?token=${encodeURIComponent(
        data.token
      )}`;
      window.open(
        lottoSsoUrl,
        "_blank",
        "toolbar=0,location=0,menubar=0,scrollbars=1,status=0,resizable=1,width=380,height=800"
      );
    } else {
      alert("Failed to generate SSO token: " + (data.error || "Unknown error"));
    }
    setLoading(false);
  };

  if (status === "loading") {
    return (
      <main className="flex flex-col items-center justify-center py-10 min-h-screen bg-linear-to-br from-blue-100 via-pink-50 to-purple-50">
        <h1 className="text-3xl font-bold tracking-wide text-blue-900 mb-2">
          NXTLOTTO DEMO (Partner)
        </h1>
        <p className="text-lg text-muted-foreground">Loading session...</p>
      </main>
    );
  }

  return (
    <Card
      style={{
        backgroundImage: "url('/nxtbet-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        // fallback color for bg when loading image
        backgroundColor: "#212121",
        minWidth: "350px",
        minHeight: "440px",
      }}
    >
      <CardContent>
        <Title
          titleClassName="text-white dark:text-white"
          title={`NXTLOTTO`}
          subtitle="LETS FKING GO"
          icon={
            <Coins className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
          }
          live
        />

        <motion.button
          aria-label="Go To STL Lotto"
          disabled={loading}
          className="relative rounded-2xl  select-none cursor-pointer"
          style={{
            width: 250,
            height: 300,
            padding: 0,
            background: "none",
            border: "none",
          }}
          onClick={handleSsoRedirect}
          initial={false}
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 360, damping: 20 }}
        >
          <motion.img
            src="/nxtlotto.png"
            alt="Go To STL Lotto"
            width={150}
            height={320}
            draggable={false}
            className={`block w-[150px] h-64 rounded-2xl
            transition duration-200 ease-in-out
            ${
              loading
                ? "opacity-60 grayscale-[0.6] brightness-95"
                : "opacity-100"
            }`}
          />
          <AnimatePresence>
            {loading && (
              <motion.span
                className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 className="animate-spin w-16 h-16 text-pink-500/70" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </CardContent>
    </Card>
  );
}
