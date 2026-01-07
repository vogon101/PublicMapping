"use client";

import dynamic from "next/dynamic";

const GBStationsMap = dynamic(
  () => import("@/views/GBStationsMap"),
  { ssr: false, loading: () => <div className="h-screen w-screen flex items-center justify-center">Loading map...</div> }
);

export default function Page() {
  return <GBStationsMap />;
}
