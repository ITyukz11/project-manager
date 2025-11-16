import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";

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
    </div>
  );
};

export default Loading;
