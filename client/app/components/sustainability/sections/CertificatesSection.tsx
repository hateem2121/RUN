import type { Certificate } from "@shared/schema";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { useCallback, useState } from "react";

interface CertificatesSectionProps {
  certificates: Certificate[];
  title?: string | undefined;
  description?: string | undefined;
  footerNote?: string | undefined;
}

/* ─────────────────────────────────────────────
   Hexagon Card
   ───────────────────────────────────────────── */
function HexagonCard({
  certificate,
  index,
  onHover,
  onLeave,
  isActive,
}: {
  certificate: Certificate;
  index: number;
  onHover: (id: number) => void;
  onLeave: () => void;
  isActive: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="relative flex flex-col items-center"
      onMouseEnter={() => onHover(certificate.id)}
      onMouseLeave={onLeave}
    >
      {/* Hexagon shape */}
      <div
        className={`relative w-28 h-28 md:w-36 md:h-36 transition-all duration-500 cursor-pointer ${
          isActive ? "scale-110 drop-shadow-[0_0_20px_rgba(0,201,123,0.3)]" : "opacity-40 grayscale"
        }`}
        style={{
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        }}
      >
        {/* Glass background */}
        <div
          className={`absolute inset-0 backdrop-blur-xl transition-all duration-500 ${
            isActive ? "bg-white/[0.1] border-[#00C97B]/40" : "bg-white/[0.04]"
          }`}
          style={{
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex h-full w-full items-center justify-center p-4">
          {certificate.imageUrl ? (
            <img
              src={certificate.imageUrl}
              alt={certificate.name}
              className={`max-h-16 max-w-16 md:max-h-20 md:max-w-20 object-contain transition-all duration-500 ${
                isActive ? "grayscale-0" : "grayscale"
              }`}
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#00C97B]/10">
              <CheckCircle className="h-6 w-6 text-[#00C97B]" />
            </div>
          )}
        </div>

        {/* Emerald checkmark badge */}
        <div
          className={`absolute top-1 right-3 md:top-2 md:right-5 z-20 flex h-5 w-5 items-center justify-center rounded-full transition-all duration-300 ${
            isActive ? "bg-[#00C97B] scale-100" : "bg-[#00C97B]/30 scale-75"
          }`}
        >
          <CheckCircle className="h-3 w-3 text-white" />
        </div>
      </div>

      {/* Name label */}
      <p
        className={`mt-3 text-center text-xs font-medium max-w-[140px] leading-tight transition-colors duration-300 ${
          isActive ? "text-white" : "text-[#68869A]"
        }`}
      >
        {certificate.name}
      </p>

      {/* Type badge */}
      <span
        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] transition-colors duration-300 ${
          isActive ? "bg-[#00C97B]/20 text-[#00C97B]" : "bg-white/[0.06] text-[#68869A]"
        }`}
      >
        {certificate.type}
      </span>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Floating Detail Card
   ───────────────────────────────────────────── */
function FloatingDetailCard({ certificate }: { certificate: Certificate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mx-auto mt-8 max-w-lg rounded-2xl bg-white/[0.06] border border-white/[0.1] backdrop-blur-2xl p-6 shadow-2xl"
    >
      <div className="flex items-start gap-4">
        {certificate.imageUrl && (
          <div className="shrink-0 h-16 w-16 rounded-xl bg-white/[0.08] overflow-hidden p-2">
            <img
              src={certificate.imageUrl}
              alt={certificate.name}
              className="h-full w-full object-contain"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-lg mb-1">{certificate.name}</h4>
          {certificate.issuingBody && (
            <p className="text-[#00C97B] text-sm font-medium mb-2">{certificate.issuingBody}</p>
          )}
          {certificate.description && (
            <p className="text-[#E3DFD6] text-sm leading-relaxed mb-3">{certificate.description}</p>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-[#68869A]">
            {certificate.status && (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00C97B]" />
                {certificate.status}
              </span>
            )}
            {certificate.expiryDate && (
              <span>Valid until: {new Date(certificate.expiryDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Certificates Section — Interactive Logo Wall
   ───────────────────────────────────────────── */
export function CertificatesSection({
  certificates,
  title = "Our Certifications",
  description = "We're proud to hold industry-leading certifications that validate our commitment to sustainable and ethical manufacturing practices.",
  footerNote = "These certifications represent our ongoing commitment to environmental responsibility, social accountability, and quality excellence in everything we do.",
}: CertificatesSectionProps) {
  const [activeCertId, setActiveCertId] = useState<number | null>(null);

  const handleHover = useCallback((id: number) => {
    setActiveCertId(id);
  }, []);

  const handleLeave = useCallback(() => {
    setActiveCertId(null);
  }, []);

  const activeCert = certificates.find((c) => c.id === activeCertId);

  return (
    <section className="relative bg-[#0A0A0A] py-20">
      {/* SVG connecting lines overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00C97B" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#00C97B" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* Decorative connecting lines */}
          <line x1="20%" y1="30%" x2="45%" y2="50%" stroke="url(#line-grad)" strokeWidth="1" />
          <line x1="55%" y1="50%" x2="80%" y2="30%" stroke="url(#line-grad)" strokeWidth="1" />
          <line x1="30%" y1="60%" x2="70%" y2="60%" stroke="url(#line-grad)" strokeWidth="1" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 font-bold font-neue-stance text-3xl text-white">{title}</h2>
          <p className="mx-auto max-w-3xl text-lg text-[#E3DFD6]">{description}</p>
        </motion.div>

        {/* Hexagonal Grid */}
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-6 md:gap-8 lg:gap-10">
          {certificates.map((certificate, index) => (
            <HexagonCard
              key={certificate.id}
              certificate={certificate}
              index={index}
              onHover={handleHover}
              onLeave={handleLeave}
              isActive={activeCertId === null || activeCertId === certificate.id}
            />
          ))}
        </div>

        {/* Floating Detail Card */}
        <AnimatePresence mode="wait">
          {activeCert && <FloatingDetailCard key={activeCert.id} certificate={activeCert} />}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="mx-auto max-w-2xl text-sm text-[#68869A]">{footerNote}</p>
        </motion.div>
      </div>
    </section>
  );
}
