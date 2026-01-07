import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

function MapCard({
  href,
  imageSrc,
  imageAlt,
  title,
  description,
  tag,
}: {
  href: string;
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  tag: string;
}) {
  return (
    <Link
      href={href}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-gray-200 hover:shadow-2xl hover:border-[#73AB96] transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image container */}
      <div className="relative h-52 sm:h-60 overflow-hidden border-b-2 border-gray-100">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
        <span className="absolute top-4 left-4 px-4 py-1.5 bg-[#73AB96] text-white text-sm font-bold rounded-full shadow-md">
          {tag}
        </span>
      </div>

      {/* Content */}
      <div className="p-6 bg-white">
        <h3 className="text-2xl font-black text-[#353741] mb-3 group-hover:text-[#3D6657] transition-colors">
          {title}
        </h3>
        <p className="text-[#353741]/70 leading-relaxed mb-5">
          {description}
        </p>
        <div className="flex items-center text-[#73AB96] font-bold group-hover:text-[#3D6657] transition-colors">
          Explore map
          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8faf9] to-white">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23353741' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative max-w-6xl mx-auto px-6 pt-12 pb-16 sm:pt-16 sm:pb-20">
          {/* Logo */}
          <div className="flex justify-center mb-8 animate-[fade-in_0.5s_ease-out]">
            <Image
              src="/logo_colour_tight.png"
              alt="YIMBY Alliance"
              width={200}
              height={60}
              className="h-12 sm:h-14 w-auto"
              priority
            />
          </div>

          {/* Headline */}
          <div className="text-center max-w-3xl mx-auto animate-[fade-in-up_0.6s_ease-out]">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#353741] mb-4 tracking-tight">
              Interactive maps of the
              <span className="text-[#73AB96]"> UK housing crisis</span>
            </h1>
            <p className="text-lg sm:text-xl text-[#353741]/70 leading-relaxed">
              Explore detailed data on house prices and rents across England and Wales.
              See how much space your money really buys.
            </p>
          </div>
        </div>
      </header>

      {/* Maps Section */}
      <main className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
          <MapCard
            href="/psqm"
            imageSrc="/Pricemap.png"
            imageAlt="House prices per square metre map"
            title="House prices per square metre"
            tag="2023 Data"
            description="The average home in London costs £520,000 whilst in the North East it's £160,000 — but the London property is likely much smaller. This map shows what really matters: how much space you get for your money."
          />
          <MapCard
            href="/psqm-rents"
            imageSrc="/rentmap2.png"
            imageAlt="Rents per square metre map"
            title="Rents per square metre"
            tag="2025 Data"
            description="£1,500 a month might get you a three-bed in the North East or barely a studio in Kensington. This map reveals the local price of space for renters across England and Wales."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white/50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-[#353741]/60">
              <Image
                src="/logo_colour_tight.png"
                alt="YIMBY Alliance"
                width={100}
                height={30}
                className="h-6 w-auto opacity-60"
              />
            </div>
            <div className="flex items-center gap-6 text-sm text-[#353741]/60">
              <a
                href="https://www.yimbyalliance.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#73AB96] transition-colors"
              >
                About YIMBY Alliance
              </a>
              <a
                href="https://x.com/YIMBYAlliance"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#73AB96] transition-colors"
              >
                Twitter/X
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
