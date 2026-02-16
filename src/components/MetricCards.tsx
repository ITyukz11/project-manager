import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPhpAmount } from "./formatAmount";

interface Metric {
  title: string;
  amount: number;
  count?: number;
  icon: React.ReactNode;
  bgColor: string;
}

interface MetricsCardsProps {
  metrics: Metric[];
  isLoading?: boolean;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  metrics,
  isLoading = false,
}) => {
  return (
    <div className="flex flex-row gap-4 flex-wrap">
      {metrics.map((m) =>
        isLoading ? (
          <Card key={m.title} className="overflow-hidden w-full sm:w-fit">
            <CardContent className="flex items-center gap-4">
              {/* Skeleton for icon */}
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex flex-col flex-1 gap-2">
                {/* Skeleton for title + count */}
                <div className="flex justify-between items-center w-48 sm:w-52">
                  <Skeleton className="h-4 w-32 rounded" />
                  {m.title !== "Total Transactions" && (
                    <Skeleton className="h-4 w-12 rounded" />
                  )}
                </div>
                {/* Skeleton for amount */}
                <Skeleton className="h-6 w-36 rounded" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card key={m.title} className="overflow-hidden w-full sm:w-fit">
            <CardContent className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg ${m.bgColor}`}
              >
                {m.icon}
              </div>
              <div className="flex flex-col">
                <div className="flex justify-between items-center w-48 sm:w-52">
                  <p className="text-sm text-muted-foreground text-nowrap">
                    {m.title}
                  </p>
                  {m.title !== "Total Transactions" && (
                    <p className="text-sm font-medium text-muted-foreground ml-auto">
                      {m.count}
                    </p>
                  )}
                </div>
                <p className="text-lg font-semibold font-mono">
                  {m.title.includes("Transaction")
                    ? m.amount.toLocaleString()
                    : formatPhpAmount(m.amount)}
                </p>
              </div>
            </CardContent>
          </Card>
        ),
      )}
    </div>
  );
};
