"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const params = useParams();

  // Check what params actually contains
  // (use this temporarily to debug)
  console.log("PARAMS:", params);

  const casinogroup = params.casinogroup || params.casinoGroup;

  useEffect(() => {
    if (casinogroup) {
      router.replace(`/${casinogroup}/network/accounts`);
    }
  }, [casinogroup, router]);

  return null;
}
