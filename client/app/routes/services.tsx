import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowRight, Box, FileCheck, Layers, PenTool, TrendingUp, Truck } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import type { Route } from "./+types/services";

export function meta({}: Route.MetaArgs) {
  return [
    {
      title: "Our Services - End-to-End Sportswear Manufacturing | RUN APPAREL",
    },
    {
      name: "description",
      content:
        "Comprehensive sportswear manufacturing services including design, fabric sourcing, pattern making, production, and quality control.",
    },
  ];
}

const services = [
  {
    icon: PenTool,
    title: "Design & Development",
    description:
      "From initial concept sketch to tech pack creation. Our design team helps bring your vision to life with professional guidance on fit, fabrication, and feasibility.",
    features: ["Trend Analysis", "Tech Packs", "Pattern Making", "3D Prototyping"],
  },
  {
    icon: Layers,
    title: "Fabric Sourcing",
    description:
      "Access our extensive network of premium fabric suppliers. We source high-performance technical fabrics, finding the perfect balance between functionality and sustainability.",
    features: ["Technical Fabrics", "Sustainable Materials", "Trims Sourcing", "Lab Dips"],
  },
  {
    icon: Box,
    title: "Sample Making",
    description:
      "Quick-turn sampling process to verify fit and quality before bulk production. We offer multiple rounds of sampling until the product meets your exact specifications.",
    features: ["Proto Samples", "Fit Samples", "Salesman Samples", "Pre-production Samples"],
  },
  {
    icon: FileCheck,
    title: "Production Management",
    description:
      "Full-service production oversight in our state-of-the-art facilities. We handle everything from cutting and sewing to finishing, ensuring efficiency and consistency.",
    features: ["Cut & Sew", "Printing & Embroidery", "Strict Quality Control", "Scalable Capacity"],
  },
  {
    icon: Truck,
    title: "Logistics & Fulfillment",
    description:
      "End-to-end logistics solutions including packaging, warehousing, and global shipping. We ensure your products reach their destination safely and on time.",
    features: ["Custom Packaging", "Freight Forwarding", "Warehousing", "Global Distribution"],
  },
  {
    icon: TrendingUp,
    title: "Brand Consultation",
    description:
      "Strategic guidance for new and established brands. We help with collection planning, pricing strategy, and market positioning to maximize your brand's potential.",
    features: ["Collection Planning", "Cost Engineering", "Market Analysis", "Growth Strategy"],
  },
];

export default function Services() {
  const servicesGridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".service-card-item", { opacity: 0, y: 20, duration: 0.5, stagger: 0.1 });
    },
    { scope: servicesGridRef },
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-muted/30 px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Typography.H1 className="font-bold text-4xl text-foreground tracking-tight sm:text-6xl">
            End-to-End Manufacturing Services
          </Typography.H1>
          <Typography.P className="mt-6 text-lg text-muted-foreground leading-8">
            We provide comprehensive solutions for sportswear brands, from initial concept to final
            delivery. Our integrated approach ensures quality, efficiency, and scalability for your
            business.
          </Typography.P>
        </div>
      </section>

      {/* Services Grid */}
      <section className="bg-background py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-none">
            <div ref={servicesGridRef} className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-3">
              {services.map((service) => (
                <div key={service.title} className="service-card-item flex flex-col">
                  <Card className="flex h-full flex-col bg-muted/20 transition-colors hover:bg-muted/40">
                    <CardContent className="flex flex-1 flex-col p-8">
                      <div className="mb-6 flex">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
                          <service.icon className="h-6 w-6 text-white" aria-hidden="true" />
                        </div>
                      </div>
                      <Typography.H3 className="font-bold text-foreground text-xl leading-7">
                        {service.title}
                      </Typography.H3>
                      <Typography.P className="mt-4 flex flex-1 text-base text-muted-foreground leading-7">
                        {service.description}
                      </Typography.P>
                      <ul className="mt-8 space-y-3">
                        {service.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-center text-foreground/80 text-sm"
                          >
                            <span className="mr-3 h-1.5 w-1.5 rounded-full bg-blue-600" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative isolate overflow-hidden bg-foreground px-6 py-16 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Typography.H2 className="font-bold text-3xl text-background tracking-tight sm:text-4xl">
            Ready to start your project?
          </Typography.H2>
          <Typography.P className="mx-auto mt-6 max-w-xl text-background/80 text-lg leading-8">
            Contact us today to discuss your requirements and how we can help bring your sportswear
            collection to life.
          </Typography.P>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link to="/contact">
              <Button size="lg" variant="secondary" className="group">
                Get a Quote
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
