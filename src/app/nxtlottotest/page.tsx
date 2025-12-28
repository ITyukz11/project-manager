// Example "Partner" page that chooses a username and embeds the Lotto iframe

import LottoIframe from "@/components/LottoIframe";

export default function Home() {
  // Simulate a logged-in user ("partnerUsername")
  const partnerUsername = "demoUser123"; // Replace with dynamic user logic if needed

  return (
    <main style={{ padding: 32 }}>
      <h1>NXTLOTTO TEST</h1>
      <p>
        <b>{partnerUsername}</b>
      </p>
      <LottoIframe
        partnerUsername={partnerUsername}
        adminId="35b63fa8-b58b-4cbc-b6bd-1da5f07d5a49"
      />
    </main>
  );
}
