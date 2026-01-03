"use client";

import Image from "next/image";

export default function Loading() {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Background */}
      <Image
        src="/qbet-bg.jpg"
        alt="NXTPAY Background"
        fill
        priority
        className="object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
        {/* Logo / Title */}
        <h1 className="mb-6 text-3xl font-bold tracking-widest text-white">
          NXTPAY
        </h1>

        {/* Spinner */}
        <Image
          src="/loading-spinner.svg"
          alt="Loading"
          width={64}
          height={64}
          priority
        />

        {/* Loading text */}
        <p className="mt-4 text-sm text-white/80">
          Processing secure payment...
        </p>
      </div>
    </div>
  );
}
