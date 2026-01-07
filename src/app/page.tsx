import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MapCardProps {
  href: string;
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  tag: string;
}

function MapCard({ href, imageSrc, imageAlt, title, description, tag }: MapCardProps) {
  return (
    <Link href={href} className="group block">
      <Card className="overflow-hidden border-2 hover:border-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
        {/* Image */}
        <div className="relative h-52 sm:h-56 overflow-hidden">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
          <Badge className="absolute top-4 left-4 bg-primary hover:bg-primary text-primary-foreground shadow-md">
            {tag}
          </Badge>
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-black text-foreground group-hover:text-accent transition-colors">
            {title}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <CardDescription className="text-base leading-relaxed">
            {description}
          </CardDescription>
        </CardContent>

        <CardFooter>
          <Button variant="ghost" className="p-0 h-auto text-primary font-bold group-hover:text-accent">
            Explore map
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-secondary to-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23353741' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative max-w-5xl mx-auto px-6 pt-12 pb-8 sm:pt-16 sm:pb-12">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/logo_colour_tight.png"
              alt="YIMBY Alliance"
              width={200}
              height={60}
              className="h-12 sm:h-14 w-auto mix-blend-multiply"
              priority
            />
          </div>

          {/* Headline */}
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4 tracking-tight">
              Interactive maps of the
              <span className="text-primary"> UK housing crisis</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
              Explore detailed data on house prices and rents across England and Wales.
              See how much space your money really buys.
            </p>
          </div>
        </div>
      </header>

      {/* Maps Section */}
      <main className="flex-grow max-w-5xl mx-auto px-6 pb-20 w-full">
        <div className="grid md:grid-cols-2 gap-8">
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
      <footer className="mt-auto border-t border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Image
              src="/logo_colour_tight.png"
              alt="YIMBY Alliance"
              width={100}
              height={30}
              className="h-6 w-auto opacity-60 mix-blend-multiply"
            />
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a
                href="https://www.yimbyalliance.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                About YIMBY Alliance
              </a>
              <a
                href="https://x.com/YIMBYAlliance"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
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
