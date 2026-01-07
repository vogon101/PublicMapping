"use client";

import dynamic from "next/dynamic";

const YAMLEssay = dynamic(
  () => import("@/views/Essay").then((mod) => ({ default: mod.YAMLEssay })),
  { ssr: false, loading: () => <div className="h-screen w-screen flex items-center justify-center">Loading...</div> }
);

export default function Page() {
  return <YAMLEssay />;
}
