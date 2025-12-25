import { motion } from "framer-motion";
import type React from "react";
import { CubeIcon, LeafIcon, ShieldCheckIcon } from "./Icons";

const EthicalManufacturing: React.FC = () => {
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const highlights = [
    {
      icon: <ShieldCheckIcon className="w-8 h-8 text-black" />,
      title: "SMETA 4-PILLAR AUDIT",
      description:
        "Our facility is SMETA 4-Pillar audited, ensuring the highest standards of ethical trade, labor, health, safety, and environmental practices. We guarantee zero child labor and fair wages.",
    },
    {
      icon: <LeafIcon className="w-8 h-8 text-black" />,
      title: "SUSTAINABLE SOURCING",
      description:
        "We partner with a network of certified suppliers for materials that meet GOTS, OEKO-TEX, and Recycled Claim Standard (RCS), ensuring a responsible and sustainable supply chain.",
    },
    {
      icon: <CubeIcon className="w-8 h-8 text-black" />,
      title: "INNOVATION & TECHNOLOGY",
      description:
        "Leveraging cutting-edge 3D design technology like CLO 3D and Optitex, we reduce sampling time by up to 40% and minimize material waste, offering you faster, more sustainable development cycles.",
    },
  ];

  return (
    <section className="subtle-noise-bg py-16 sm:py-24 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={itemVariants}
        >
          <h2 className="text-3xl md:text-4xl font-black-display mb-4">
            ETHICAL MANUFACTURING & INNOVATION
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            We merge a 135-year legacy with modern technology and an unwavering commitment to
            transparency and ethical production.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {highlights.map((item, index) => (
            <motion.div key={index} variants={itemVariants} className="bg-white p-8 text-center">
              <div className="flex justify-center mb-4">{item.icon}</div>
              <h3 className="font-bold uppercase tracking-wider mb-3">{item.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default EthicalManufacturing;
