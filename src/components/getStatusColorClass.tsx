import { AlertCircle, BadgeCheck, CheckCircle2, XCircle } from "lucide-react";
import { Spinner } from "./ui/spinner";

export function getStatusColorClass(status: string): string {
  switch (status) {
    case "PENDING":
      return "bg-yellow-600 hover:bg-yellow-700 text-white";
    case "PARTIAL":
      return "bg-blue-600 hover:bg-blue-700 text-white";
    case "COMPLETED":
    case "APPROVED":
      return "bg-green-600 hover:bg-green-700 text-white";
    case "CLAIMED":
      return "bg-blue-600 hover:bg-blue-700 text-white";
    default:
      return "bg-red-600 hover:bg-red-700 text-white";
  }
}

export const getStatusIcon = (status?: string) => {
  switch (status) {
    case "APPROVED":
    case "COMPLETED":
      return <BadgeCheck className="h-4 w-4" />;
    case "CLAIMED":
      return <CheckCircle2 className="h-4 w-4" />;
    case "REJECTED":
      return <XCircle className="h-4 w-4" />;
    case "PENDING":
      return <Spinner />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};
