"use client";
import React, { useEffect, useRef, useState } from "react";

interface LottoIframeProps {
  partnerUsername: string;
  adminId: string;
}

const LottoIframe: React.FC<LottoIframeProps> = ({
  partnerUsername,
  adminId,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [token, setToken] = useState<string | null>(null);

  // Fetch JWT on mount
  useEffect(() => {
    fetch(`/api/generate-token?adminId=${encodeURIComponent(adminId)}`)
      .then((res) => res.json())
      .then((data) => setToken(data.token));
  }, [adminId]);

  useEffect(() => {
    if (!token) return; // don’t send anything until token is loaded
    const iframe = iframeRef.current;
    if (!iframe) return;
    const sendUsername = () => {
      const lottoOrigin = "https://stl-web-seven.vercel.app";
      console.log(
        "Sending postMessage",
        { username: partnerUsername, adminId },
        "to",
        lottoOrigin
      );

      console.log("postMessage sending", {
        username: partnerUsername,
        adminId,
      }); // ADD THIS
      iframe.contentWindow?.postMessage(
        { username: partnerUsername, adminId },
        lottoOrigin
      );
    };
    iframe.addEventListener("load", sendUsername);
    return () => {
      iframe.removeEventListener("load", sendUsername);
    };
  }, [partnerUsername, adminId, token]);

  if (!token) return <div>Loading secure access…</div>;

  return (
    <iframe
      ref={iframeRef}
      src={`https://stl-web-seven.vercel.app/lotto2?adminId=${encodeURIComponent(
        adminId
      )}&token=${encodeURIComponent(token)}`}
      width={800}
      height={600}
      style={{ border: "1px solid #ccc", borderRadius: "8px" }}
      title="Lotto App"
      allow="clipboard-write"
    />
  );
};

export default LottoIframe;
