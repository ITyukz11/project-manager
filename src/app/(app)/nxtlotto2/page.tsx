"use client";

import { useSession } from "next-auth/react";
import LottoIframe2 from "@/components/LottoIframe2";

export default function Home() {
  const { data: session, status } = useSession();

  // 1️⃣ While session is loading
  if (status === "loading") {
    return (
      <main style={{ padding: 32 }}>
        <h1>NXTLOTTO TEST</h1>
        <p>Loading session...</p>
      </main>
    );
  }

  // 2️⃣ If NOT authenticated, do NOT load iframe
  if (status === "unauthenticated" || !session?.user?.username) {
    return (
      <main style={{ padding: 32 }}>
        <h1>NXTLOTTO TEST</h1>
        <p>You must be logged in to continue.</p>
      </main>
    );
  }

  // 3️⃣ Authenticated → safe to load iframe
  return (
    <main style={{ padding: 32 }}>
      <h1>NXTLOTTO TEST</h1>

      <p>
        Logged in as: <b>{session.user.username}</b>
      </p>

      <LottoIframe2
        partnerUsername={session.user.username}
        adminId="35b63fa8-b58b-4cbc-b6bd-1da5f07d5a49"
      />
    </main>
  );
}
