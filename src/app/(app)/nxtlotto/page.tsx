"use client";

import LottoIframe from "@/components/LottoIframe";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  // After submit, show the iframe with props
  return (
    <main style={{ padding: 32 }}>
      <h1>NXTLOTTO TEST</h1>
      <p>
        <b>{session?.user?.username || "guestUser"}</b>
      </p>
      <LottoIframe
        partnerUsername={session?.user?.username || "guestUser"}
        adminId="35b63fa8-b58b-4cbc-b6bd-1da5f07d5a49"
      />
    </main>
  );
}
