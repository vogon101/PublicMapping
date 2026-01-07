"use client";

import dynamic from "next/dynamic";

const GreenBeltElectionMap = dynamic(
  () => import("@/views/GreenBeltElectionMap"),
  { ssr: false, loading: () => <div className="h-screen w-screen flex items-center justify-center">Loading map...</div> }
);

export default function Page() {
  return <GreenBeltElectionMap />;
}
