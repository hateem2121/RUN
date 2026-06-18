import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowRight, Globe } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { resolveIcon } from "@/utils/icon-resolver";
import type { Route } from "./+types/services";

export async function loader({ request }: Route.LoaderArgs) {
  const base = new URL(request.url);
  const get = (path: string) =>
    fetch(new URL(path, base).toString())
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

  const servicesList = await get("/api/services");

  return { servicesList };
}

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

interface ServiceData {
  id: number;
  iconName: string;
  title: string;
  description: string;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

const FALLBACK_SERVICES: ServiceData[] = [
  {
    id: -1,
    title: "Product Design & Development",
    description:
      "Collaborative design process translating your concepts into production-ready apparel tech packs.",
    iconName: "Palette",
    features: ["Tech pack creation", "3D virtual prototyping", "Colorway development"],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: -2,
    title: "Fabric & Material Sourcing",
    description:
      "Access to a global network of sustainable, performance-driven fabric mills and trim suppliers.",
    iconName: "Layers",
    features: [
      "Recycled polyester & organic cotton",
      "Moisture-wicking fabrics",
      "Custom dye options",
    ],
    isActive: true,
    sortOrder: 2,
  },
  {
    id: -3,
    title: "Bulk Manufacturing",
    description:
      "State-of-the-art production lines delivering high-quality activewear at scale with ethical standards.",
    iconName: "Cpu",
    features: [
      "Low minimum order quantities",
      "Precision automated cutting",
      "Skilled assembly craftsmanship",
    ],
    isActive: true,
    sortOrder: 3,
  },
];

type LoaderData = {
  servicesList: ServiceData[] | null;
};

export function Component({ loaderData }: { loaderData: LoaderData }) {
  const { servicesList } = loaderData;

  return <ServicesPageContent servicesList={servicesList} />;
}

function ServicesPageContent({ servicesList }: { servicesList: ServiceData[] | null }) {
  const servicesGridRef = useRef<HTMLDivElement>(null);

  const list = servicesList && servicesList.length > 0 ? servicesList : FALLBACK_SERVICES;

  useGSAP(
    () => {
      if (list.length > 0) {
        gsap.from(".service-card-item", { opacity: 0, y: 20, duration: 0.5, stagger: 0.1 });
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.utils.toArray<HTMLElement>(".service-card-item").forEach((card) => {
          gsap.killTweensOf(card);
          gsap.set(card, { clearProps: "all" });
        });
      }
    },
    { scope: servicesGridRef, dependencies: [list] },
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
              {list.map((service) => {
                const IconComponent = resolveIcon(service.iconName) || Globe;
                return (
                  <div key={service.id} className="service-card-item flex flex-col">
                    <Card className="flex h-full flex-col bg-muted/20 transition-colors hover:bg-muted/40">
                      <CardContent className="flex flex-1 flex-col p-8">
                        <div className="mb-6 flex">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
                            <IconComponent className="h-6 w-6 text-white" aria-hidden="true" />
                          </div>
                        </div>
                        <Typography.H3 className="font-bold text-foreground text-xl leading-7">
                          {service.title}
                        </Typography.H3>
                        <Typography.P className="mt-4 flex flex-1 text-base text-muted-foreground leading-7">
                          {service.description}
                        </Typography.P>
                        <ul className="mt-8 space-y-3">
                          {Array.isArray(service.features) &&
                            service.features.map((feature) => (
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
                );
              })}
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
            <Link to="/contact" aria-label="Get a quote for our end-to-end manufacturing services">
              <Button size="lg" variant="secondary" className="group">
                Get a Quote
                <ArrowRight
                  className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

import { RouteErrorBoundary } from "@/components/shared/RouteErrorBoundary";
import { RouteHydrateFallback } from "@/components/shared/RouteHydrateFallback";

export { RouteErrorBoundary as ErrorBoundary, RouteHydrateFallback as HydrateFallback };
