"use client";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function NetworkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const casinoGroup = params.casinogroup;
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-3xl font-bold">
            {casinoGroup?.toLocaleString().toUpperCase()} Network
          </h1>
        </CardTitle>
        <span className="text-muted-foreground text-sm">
          Manage your network accounts and group chat configurations here.
        </span>
      </CardHeader>
      <CardContent>
        <nav className="flex gap-2 border-b mb-4">
          <Link
            href={`/${casinoGroup}/network/accounts`}
            className={cn(
              "p-2 text-sm",
              pathname.includes(`/${casinoGroup}/network/accounts`)
                ? "border-b-2 border-primary font-semibold"
                : "text-muted-foreground hover:text-primary"
            )}
          >
            Accounts
          </Link>
          <Link
            href={`/${casinoGroup}/network/group-chat-manager`}
            className={cn(
              "p-2 text-sm",
              pathname.includes(`/${casinoGroup}/network/group-chat-manager`)
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
