import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Services() {
	const services = [
		{
			title: "Product Development",
			description:
				"From concept to production, we help bring your sportswear ideas to life.",
			features: [
				"Design consultation",
				"Prototype development",
				"Material selection",
				"Performance testing",
			],
		},
		{
			title: "Custom Manufacturing",
			description:
				"Full-scale production with flexible MOQs tailored to your needs.",
			features: [
				"Small to large batch production",
				"Custom sizing and fits",
				"Brand labeling",
				"Quality assurance",
			],
		},
		{
			title: "Fabric Innovation",
			description:
				"Access to cutting-edge performance fabrics and textile technologies.",
			features: [
				"Moisture-wicking materials",
				"Sustainable fabrics",
				"Technical textiles",
				"Custom fabric development",
			],
		},
		{
			title: "Printing & Embellishment",
			description:
				"Advanced decoration techniques to enhance your brand identity.",
			features: [
				"Screen printing",
				"Digital printing",
				"Embroidery",
				"Heat transfers",
			],
		},
		{
			title: "Supply Chain Management",
			description:
				"Efficient logistics and inventory solutions for seamless delivery.",
			features: [
				"Global shipping",
				"Inventory management",
				"Just-in-time delivery",
				"Order tracking",
			],
		},
		{
			title: "Quality Control",
			description:
				"Rigorous testing and inspection at every stage of production.",
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
				<div className="max-w-7xl mx-auto">
					<h1 className="font-neue-stance text-4xl md:text-5xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
						Our Services
					</h1>
					<p className="text-lg text-neutral-600 dark:text-neutral-400 mb-12 max-w-3xl">
						Comprehensive sportswear manufacturing solutions designed to meet
						your brand's unique requirements. From initial concept to final
						delivery, we're your trusted partner.
					</p>

					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
						{services.map((service, index) => (
							<Card
								key={index}
								className="hover:shadow-lg transition-shadow-sm"
							>
								<CardHeader>
									<CardTitle className="font-neue-stance text-xl">
										{service.title}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-neutral-600 dark:text-neutral-400 mb-4">
										{service.description}
									</p>
									<ul className="space-y-2">
										{service.features.map((feature, idx) => (
											<li key={idx} className="flex items-start gap-2">
												<span className="text-primary mt-1">•</span>
												<span className="text-sm text-neutral-600 dark:text-neutral-400">
													{feature}
												</span>
											</li>
										))}
									</ul>
								</CardContent>
							</Card>
						))}
					</div>

					<div className="mt-16 bg-primary/5 rounded-2xl p-8 md:p-12">
						<h2 className="font-neue-stance text-2xl font-bold mb-4">
							Our Manufacturing Process
						</h2>
						<div className="grid md:grid-cols-4 gap-6">
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
									<div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
										{item.step}
									</div>
									<h3 className="font-semibold mb-1">{item.title}</h3>
									<p className="text-sm text-neutral-600 dark:text-neutral-400">
										{item.desc}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
