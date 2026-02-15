import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-green-50 to-green-100 px-4">
      <Card className="max-w-md w-full p-0">
        <CardContent className="flex flex-col items-center text-center py-10 gap-6">
          <CheckCircle2 className="text-green-500 w-20 h-20 mb-2" />
          <h1 className="text-2xl font-bold text-green-600 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Your deposit has been received and is being processed.
            <br />
            Thank you for using QBET88.VIP.
          </p>
          <Button
            asChild
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold text-lg"
          >
            <Link href="https://qbet88.vip/">Go back to QBET88.VIP site</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
