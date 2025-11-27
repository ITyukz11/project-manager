export function getStatusColorClass(status: string): string {
  switch (status) {
    case "PENDING":
      return "bg-yellow-400 text-black";
    case "PARTIAL":
      return "bg-blue-600 text-white";
    case "COMPLETED":
      return "bg-green-600 text-white";
    default:
      return "bg-red-600 text-white";
  }
}
