import { motion } from "framer-motion";
import { Box, Leaf, Shield } from "lucide-react";

/**
 * Ethical Manufacturing Section
 * Showcases RUN APPAREL's commitment to ethics, sustainability, and innovation.
 */
export const EthicalManufacturing: React.FC = () => {
  const highlights = [
    {
      icon: <Shield className="h-8 w-8 text-black" />,
      title: "SMETA 4-PILLAR AUDIT",
      description:
        "Our facility is SMETA 4-Pillar audited, ensuring the highest standards of ethical trade, labor, health, safety, and environmental practices. We guarantee zero child labor and fair wages.",
    },
    {
      icon: <Leaf className="h-8 w-8 text-black" />,
      title: "SUSTAINABLE SOURCING",
      description:
        "We partner with a network of certified suppliers for materials that meet GOTS, OEKO-TEX, and Recycled Claim Standard (RCS), ensuring a responsible and sustainable supply chain.",
    },
    {
      icon: <Box className="h-8 w-8 text-black" />,
      title: "INNOVATION & TECHNOLOGY",
      description:
        "Leveraging cutting-edge 3D design technology like CLO 3D and Optitex, we reduce sampling time by up to 40% and minimize material waste, offering you faster, more sustainable development cycles.",
    },
  ];

  return (
    <section className="subtle-noise-bg py-16 sm:py-24 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-black-display mb-4 text-3xl md:text-4xl">
            ETHICAL MANUFACTURING & INNOVATION
          </h2>
          <p className="text-muted-foreground mx-auto max-w-3xl">
            We merge a 135-year legacy with modern technology and an unwavering commitment to
            transparency and ethical production.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">
          {highlights.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-white p-8 text-center"
            >
              <div className="mb-4 flex justify-center">{item.icon}</div>
              <h3 className="mb-3 font-bold tracking-wider uppercase">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
