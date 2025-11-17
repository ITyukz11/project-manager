import { Label } from "@/components/ui/label";
import { Suspense, use } from "react";

export function AsyncLabel({
  value,
  className,
  width = "w-20",
}: {
  value: React.ReactNode | Promise<React.ReactNode>;
  className?: string;
  width?: string;
}) {
  const resolved = use(Promise.resolve(value));
  return (
    <Suspense fallback={<LabelSkeleton width={width} />}>
      <Label className={className}>{resolved ?? "—"}</Label>
    </Suspense>
  );
}

export function Field({ label, value }: { label: string; value?: any }) {
  return (
    <div className="flex flex-col gap-1 min-w-[120px]">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <AsyncLabel
        value={value ?? "—"}
        className="text-sm dark:text-white"
        width="w-12"
      />
    </div>
  );
}

export function LabelSkeleton({ width = "w-20" }: { width?: string }) {
  return (
    <div
      className={`h-4 ${width} bg-gray-200 dark:bg-gray-700 rounded animate-pulse`}
    />
  );
}

export function BadgeSkeleton() {
  return (
    <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
  );
}
