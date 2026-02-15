"use client";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, TriangleAlert, Wallet } from "lucide-react";
import { useParams } from "next/navigation";
import { Title } from "@/components/Title";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatPhpAmount } from "@/components/formatAmount";
import { useBalance } from "@/lib/hooks/swr/qbet88/useBalance";
import { Spinner } from "@/components/ui/spinner";
import { useOPayBalance } from "@/lib/hooks/swr/optimum-pay/balance/useOPayBalance";
import { Label } from "@/components/ui/label";

export default function OptimumPayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const casinoGroup = params.casinogroup as string;

  const {
    balance,
    isLoading: balanceLoading,
    refreshBalance,
    isValidating: balanceValidating,
    error: balanceError,
  } = useBalance("NEFTUAO2A0LHYYXO");

  const {
    oPayBalance,
    error: oPayBalanceError,
    isLoading: oPayBalanceLoading,
    refetch: refetchOPayBalance,
    isValidating: oPayBalanceValidating,
  } = useOPayBalance();

  return (
    <Card>
      <CardContent>
        <Title
          title={`${casinoGroup
            ?.toLocaleString()
            .toUpperCase()} Optimum Pay Transaction Logs`}
          subtitle="View and manage Optimum Pay transaction logs for your casino group."
          icon={
            <Wallet className="h-5 w-5 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
          }
          live
          right={
            casinoGroup?.toLocaleString().toLocaleLowerCase() ===
            "qbet88.vip" ? (
              <div className="flex flex-row gap-2 flex-wrap">
                <div
                  className="
                xl:absolute right-55
    flex flex-col gap-1 
    bg-sky-100 dark:bg-sky-950 
    border border-sky-300 dark:border-sky-800
    rounded-lg 
    px-4 py-2
    w-full sm:w-fit
   sm:max-w-xs
  "
                >
                  {/* Title Row */}
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-sky-700 dark:text-sky-200 font-semibold">
                    <Wallet className="h-4 w-4 shrink-0 text-sky-700 dark:text-sky-300" />
                    <span className="truncate text-xs sm:text-sm">
                      Optimum Pay Balance
                    </span>
                    {/* {session?.user.role === ADMINROLES.SUPERADMIN && (
                      <span
                        className="cursor-pointer hover:underline font-bold text-yellow-600 dark:text-yellow-400"
                        onClick={() => setOpen(true)}
                      >
                        Control
                      </span>
                    )} */}
                  </div>

                  {/* Value / State */}
                  <div>
                    {oPayBalanceLoading ? (
                      <Skeleton className="h-3 w-24 sm:w-32 my-1 sm:my-2 bg-sky-200 dark:bg-sky-800" />
                    ) : oPayBalanceError ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center text-red-600 text-xs sm:text-sm">
                            <TriangleAlert className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                            Error
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <span>{oPayBalanceError}</span>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <div className="flex flex-row justify-center gap-1 font-bold text-base sm:text-lg text-sky-700 dark:text-sky-200">
                        {oPayBalanceValidating ? (
                          <Skeleton className="h-3 w-24 my-1 sm:my-2 bg-sky-200 dark:bg-sky-800" />
                        ) : (
                          formatPhpAmount(oPayBalance?.current_balance || 0)
                        )}
                        <button
                          type="button"
                          onClick={() => refetchOPayBalance()}
                          disabled={oPayBalanceLoading}
                          title="Refresh balance"
                          className="cursor-pointer flex items-center justify-center"
                        >
                          {!oPayBalanceLoading && !oPayBalanceValidating ? (
                            <RefreshCw className="w-3.5 h-3.5 text-sky-700 dark:text-sky-300" />
                          ) : (
                            <Spinner className="text-sky-700 dark:text-sky-300" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className="
                xl:absolute right-10
    flex flex-col gap-1 
    bg-green-100 dark:bg-green-950 
    border border-green-300 dark:border-green-800
    rounded-lg 
    px-4 py-2
    w-full sm:w-fit
   sm:max-w-xs
  "
                >
                  {/* Title Row */}
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-green-700 dark:text-green-200 font-semibold">
                    <Wallet className="h-4 w-4 shrink-0 text-green-700 dark:text-green-300" />
                    <span className="truncate text-xs sm:text-sm">
                      Gateway Balance
                    </span>
                  </div>

                  {/* Value / State */}
                  <div>
                    {balanceLoading ? (
                      <Skeleton className="h-3 w-24 sm:w-32 my-1 sm:my-2 bg-green-200 dark:bg-green-800" />
                    ) : balanceError ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center text-red-600 text-xs sm:text-sm">
                            <TriangleAlert className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                            Error
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <span>{balanceError}</span>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <div className="flex flex-row justify-center gap-1 font-bold text-base sm:text-lg text-green-700 dark:text-green-200">
                        {balanceValidating ? (
                          <Skeleton className="h-3 w-24 my-1 sm:my-2 bg-green-200 dark:bg-green-800" />
                        ) : (
                          formatPhpAmount(balance)
                        )}
                        <button
                          type="button"
                          onClick={() => refreshBalance()}
                          disabled={balanceLoading}
                          title="Refresh balance"
                          className="cursor-pointer flex items-center justify-center"
                        >
                          {!balanceLoading && !balanceValidating ? (
                            <RefreshCw className="w-3.5 h-3.5 text-green-700 dark:text-green-300" />
                          ) : (
                            <Spinner className="text-green-700 dark:text-green-300" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <></>
            )
          }
        />
        <section>{children}</section>
      </CardContent>
    </Card>
  );
}
