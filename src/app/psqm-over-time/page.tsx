"use client";

import dynamic from "next/dynamic";

const PerSquareMetreMapOverTime = dynamic(
  () => import("@/views/PerSquareMetreMapOverTime"),
  { ssr: false, loading: () => <div className="h-screen w-screen flex items-center justify-center">Loading map...</div> }
);

export default function Page() {
  return <PerSquareMetreMapOverTime />;
}
