import type { Certificate } from "@shared/schema";
import { motion } from "framer-motion";

export function CertificatesSection({
  certificates,
  title = "Our Certifications",
  description = "We're proud to hold industry-leading certifications that validate our commitment to sustainable and ethical manufacturing practices.",
  footerNote = "These certifications represent our ongoing commitment to environmental responsibility, social accountability, and quality excellence in everything we do.",
}: {
  certificates: Certificate[];
  title?: string;
  description?: string;
  footerNote?: string;
}) {
  return (
    <section className="relative bg-stone-50 py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 font-bold font-neue-stance text-3xl text-stone-900">{title}</h2>
          <p className="mx-auto max-w-3xl text-lg text-stone-600">{description}</p>
        </motion.div>

        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {certificates.map((certificate, index) => (
            <motion.div
              key={certificate.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="group flex flex-col items-center text-center"
            >
              <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-xl border border-stone-200 bg-stone-50 shadow-lg transition-all duration-300 group-hover:shadow-xl">
                {certificate.imageUrl ? (
                  <img
                    src={certificate.imageUrl}
                    alt={certificate.name}
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-stone-100 to-stone-200">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-stone-300">
                      <svg
                        className="h-6 w-6 text-stone-700"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              <h3 className="mb-1 font-semibold text-sm text-stone-900 leading-tight">
                {certificate.name}
              </h3>

              <div className="mb-2 rounded-full bg-stone-200 px-2 py-1 text-stone-800 text-xs">
                {certificate.type}
              </div>

              {certificate.issuingBody && (
                <p className="text-stone-600 text-xs leading-relaxed">{certificate.issuingBody}</p>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="mx-auto max-w-2xl text-sm text-stone-500">{footerNote}</p>
        </motion.div>
      </div>
    </section>
  );
}
