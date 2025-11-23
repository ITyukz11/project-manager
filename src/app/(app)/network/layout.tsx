"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function NetworkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-3xl font-bold">Network</h1>
        </CardTitle>
        <span className="text-muted-foreground text-sm">
          Manage your network accounts and group chat configurations here.
        </span>
      </CardHeader>
      <CardContent>
        <nav className="flex gap-2 border-b mb-4">
          <Link
            href="/network/accounts"
            className={cn(
              "p-2 text-sm",
              pathname.includes("/accounts")
                ? "border-b-2 border-primary font-semibold"
                : "text-muted-foreground hover:text-primary"
            )}
          >
            Accounts
          </Link>
          <Link
            href="/network/group-chat-manager"
            className={cn(
              "p-2 text-sm",
              pathname.includes("/group-chat-manager")
                ? "border-b-2 border-primary font-semibold"
                : "text-muted-foreground hover:text-primary"
            )}
          >
            Group Chat Manager
          </Link>
        </nav>
        <section>{children}</section>
      </CardContent>
    </Card>
  );
}
