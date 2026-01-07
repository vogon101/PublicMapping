"use client";

import dynamic from "next/dynamic";

const RentsPerSquareMetreMap = dynamic(
  () => import("@/views/RentsPerSquareMetreMap"),
  { ssr: false, loading: () => <div className="h-screen w-screen flex items-center justify-center">Loading map...</div> }
);

export default function Page() {
  return <RentsPerSquareMetreMap />;
}
