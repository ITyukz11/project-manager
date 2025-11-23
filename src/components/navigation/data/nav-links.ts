import {
  Users,
  Share2,
  Wallet,
  CheckSquare,
  MessageCircle,
} from "lucide-react";
import type { ComponentType } from "react";

export type MenuLink = {
  href: string;
  text: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  disable?: boolean;
  count?: number;
  targetBlank?: boolean;
};

export const navLinks: MenuLink[] = [
  {
    href: "/accounts",
    text: "Accounts",
    icon: Users, // Replaced Map with Users for accounts
    disable: true,
    targetBlank: true,
  },
  {
    href: "/network/accounts",
    text: "Network",
    icon: Share2, // Replaced Barcode with Share2 for network
    disable: true,
    targetBlank: false,
  },
  {
    href: "/cash-outs",
    text: "Cash Outs",
    icon: Wallet, // Replaced BookOpen with Wallet for cash outs
    disable: true,
    targetBlank: false,
  },
  {
    href: "/concerns",
    text: "Concerns",
    icon: MessageCircle, // Replaced BookOpen with Wallet for cash outs
    disable: true,
    targetBlank: false,
  },
  {
    href: "/tasks",
    text: "Tasks",
    icon: CheckSquare, // Replaced MessageSquare with CheckSquare for tasks
    disable: true,
    targetBlank: false,
  },
];
