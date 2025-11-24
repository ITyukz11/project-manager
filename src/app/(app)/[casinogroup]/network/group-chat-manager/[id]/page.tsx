"use client";

import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

const Page = () => {
  const { id } = useParams();
  const router = useRouter();
  return (
    <div>
      <div
        className="flex flex-row hover:underline text-sm text-primary cursor-pointer mb-2 items-center gap-1"
        onClick={() => router.back()}
      >
        <ArrowLeft />
        Back
      </div>
      Group Chat Manager page: {id}
    </div>
  );
};

export default Page;
