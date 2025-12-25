import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

export default function Services() {
  const services = [
    {
      title: "Product Development",
      description: "From concept to production, we help bring your sportswear ideas to life.",
      features: [
        "Design consultation",
        "Prototype development",
        "Material selection",
        "Performance testing",
      ],
    },
    {
      title: "Custom Manufacturing",
      description: "Full-scale production with flexible MOQs tailored to your needs.",
      features: [
        "Small to large batch production",
        "Custom sizing and fits",
        "Brand labeling",
        "Quality assurance",
      ],
    },
    {
      title: "Fabric Innovation",
      description: "Access to cutting-edge performance fabrics and textile technologies.",
      features: [
        "Moisture-wicking materials",
        "Sustainable fabrics",
        "Technical textiles",
        "Custom fabric development",
      ],
    },
    {
      title: "Printing & Embellishment",
      description: "Advanced decoration techniques to enhance your brand identity.",
      features: ["Screen printing", "Digital printing", "Embroidery", "Heat transfers"],
    },
    {
      title: "Supply Chain Management",
      description: "Efficient logistics and inventory solutions for seamless delivery.",
      features: [
        "Global shipping",
        "Inventory management",
        "Just-in-time delivery",
        "Order tracking",
      ],
    },
    {
      title: "Quality Control",
      description: "Rigorous testing and inspection at every stage of production.",
      features: [
        "In-line inspection",
        "Lab testing",
        "Compliance certification",
        "Performance validation",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <Typography.H1 className="mb-4 font-bold font-neue-stance text-4xl text-neutral-900 md:text-5xl dark:text-neutral-100">
            Our Services
          </Typography.H1>
          <Typography.P className="mb-12 max-w-3xl text-lg text-neutral-600 dark:text-neutral-400">
            Comprehensive sportswear manufacturing solutions designed to meet your brand's unique
            requirements. From initial concept to final delivery, we're your trusted partner.
          </Typography.P>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <Card key={index} className="transition-shadow-sm hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="font-neue-stance text-xl">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Typography.P className="mb-4 text-neutral-600 dark:text-neutral-400">
                    {service.description}
                  </Typography.P>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1 text-primary">•</span>
                        <span className="text-neutral-600 text-sm dark:text-neutral-400">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 rounded-2xl bg-primary/5 p-8 md:p-12">
            <Typography.H2 className="mb-4 font-bold font-neue-stance text-2xl">
              Our Manufacturing Process
            </Typography.H2>
            <div className="grid gap-6 md:grid-cols-4">
              {[
                {
                  step: "1",
                  title: "Consultation",
                  desc: "Discuss your requirements and specifications",
                },
                {
                  step: "2",
                  title: "Development",
                  desc: "Create samples and prototypes for approval",
                },
                {
                  step: "3",
                  title: "Production",
                  desc: "Manufacture your order with quality control",
                },
                {
                  step: "4",
                  title: "Delivery",
                  desc: "Ship your products worldwide on schedule",
                },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary font-bold text-white text-xl">
                    {item.step}
                  </div>
                  <Typography.H3 className="mb-1 font-semibold">{item.title}</Typography.H3>
                  <Typography.P className="text-neutral-600 text-sm dark:text-neutral-400">
                    {item.desc}
                  </Typography.P>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
