import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import Image from "next/image";

const Loading: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <Spinner />
      <Label style={{ marginLeft: "8px", fontSize: "1.2rem" }}>
        Loading...
      </Label>
      <Image
        className="ml-4"
        src="/logos/miadp-pso-circle.png"
        alt="miadp-pso logo"
        width={50}
        height={50}
      />
    </div>
  );
};

export default Loading;
