"use client";

import { useCashouts } from "@/lib/hooks/swr/cashout/useCashouts";
import { DataTable } from "@/components/table/data-table";
import { cashoutColumns } from "@/components/table/cashout/cashoutColumns";
import { useRouter } from "next/navigation";

const Page = () => {
  const { cashouts } = useCashouts();

  const router = useRouter();
  return (
    <div>
      <DataTable
        data={cashouts}
        columns={cashoutColumns}
        cursorRowSelect
        onViewRowId={(id) => router.push("/cash-outs/" + id)}
      />
    </div>
  );
};

export default Page;
