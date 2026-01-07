"use client";

import dynamic from "next/dynamic";

const GBConstituencyTable = dynamic(
  () => import("@/views/GBConstituencies/GBConstituencyTable").then((mod) => ({ default: mod.GBConstituencyTable })),
  { ssr: false, loading: () => <div className="container mx-auto py-10">Loading...</div> }
);

export default function Page() {
  return (
    <div className="container mx-auto py-10">
      <GBConstituencyTable />
    </div>
  );
}
