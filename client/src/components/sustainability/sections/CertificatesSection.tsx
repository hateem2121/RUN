import { motion } from "framer-motion";
import type { Certificate } from "@shared/schema";

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
    <section className="py-20 bg-stone-50 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-stone-900 mb-4 font-neue-stance">
            {title}
          </h2>
          <p className="text-lg text-stone-600 max-w-3xl mx-auto">
            {description}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
          {certificates.map((certificate, index) => (
            <motion.div
              key={certificate.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center text-center group"
            >
              <div className="relative w-24 h-24 mb-4 bg-stone-50 rounded-xl shadow-lg border border-stone-200 overflow-hidden group-hover:shadow-xl transition-all duration-300">
                {certificate.imageUrl ? (
                  <img
                    src={certificate.imageUrl}
                    alt={certificate.name}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
                    <div className="w-12 h-12 bg-stone-300 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-stone-700"
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

              <h3 className="font-semibold text-stone-900 text-sm mb-1 leading-tight">
                {certificate.name}
              </h3>

              <div className="text-xs px-2 py-1 bg-stone-200 text-stone-800 rounded-full mb-2">
                {certificate.type}
              </div>

              {certificate.issuingBody && (
                <p className="text-xs text-stone-600 leading-relaxed">
                  {certificate.issuingBody}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <p className="text-sm text-stone-500 max-w-2xl mx-auto">
            {footerNote}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
