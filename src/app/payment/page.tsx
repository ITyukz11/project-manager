// app/maintenance/page.tsx

const Page = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        textAlign: "center",
        backgroundColor: "#1a1a1a",
        color: "#FFD700", // gold text
        fontFamily: "Arial, sans-serif",
        padding: "20px",
      }}
    >
      <h1>🚧 Site Under Maintenance 🚧</h1>
      <p>
        All your load will be credited. We are very sorry for the inconvenience.
      </p>
      <p>Please check back later.</p>
    </div>
  );
};

export default Page;
