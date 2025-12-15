import { useState, memo } from "react";
import { motion } from "framer-motion";
import { Shield, Leaf, Award, CheckCircle, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Certificate } from "@shared/schema";

interface CertificateDisplayProps {
  certificateIds?: number[] | null;
  displayMode?: "compact" | "3d" | "badges";
  className?: string;
}

const getIcon = (type: string, size: "sm" | "md" | "lg" = "md") => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-8 h-8"
  };

  const iconClass = sizeClasses[size];

  switch (type.toLowerCase()) {
    case 'compliance':
      return <Shield className={iconClass} />;
    case 'sustainability':
      return <Leaf className={iconClass} />;
    case 'quality':
      return <Award className={iconClass} />;
    case 'safety':
      return <CheckCircle className={iconClass} />;
    case 'environmental':
      return <Leaf className={iconClass} />;
    default:
      return <Award className={iconClass} />;
  }
};

function CompactCertificateCard({ certificate, index }: { certificate: Certificate; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      className="min-w-[280px] md:min-w-0"
    >
      <div className="group relative bg-gradient-to-br from-white/10 to-white/5 border border-gray-800/60 dark:border-white/30 rounded-xl p-4 hover:border-green-400/50 transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-green-400/0 to-emerald-400/0 group-hover:from-green-400/10 group-hover:to-emerald-400/10 rounded-xl transition-all duration-300" />

        <div className="relative z-10 flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-green-400/20 to-emerald-400/20 flex items-center justify-center">
            <div className="text-green-400">
              {getIcon(certificate.type || 'quality')}
            </div>
          </div>

          <div className="grow">
            <h4 className="text-white font-medium text-sm mb-1 line-clamp-1">
              {certificate.name}
            </h4>
            <p className="text-white/60 text-xs line-clamp-1">
              {certificate.issuingBody}
            </p>

            {certificate.description && (
              <p className="text-white/50 text-xs mt-2 line-clamp-2">
                {certificate.description}
              </p>
            )}
          </div>

          {certificate.imageUrl ? (
            <img
              src={certificate.imageUrl}
              alt={certificate.name}
              className="w-8 h-8 object-contain opacity-60 group-hover:opacity-80 transition-opacity"
            />
          ) : certificate.documentUrl && (
            <a
              href={certificate.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white/80 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Certificate3DCard({ certificate, index }: { certificate: Certificate; index: number }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, rotateY: -180, scale: 0.8 }}
      animate={{ opacity: 1, rotateY: 0, scale: 1 }}
      transition={{
        delay: index * 0.1,
        duration: 0.8,
        type: "spring",
        stiffness: 100
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative h-64 w-full perspective-1000"
    >
      <motion.div
        className="relative w-full h-full transition-transform duration-700 transform-style-3d cursor-pointer"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        onClick={() => setIsFlipped(!isFlipped)}
        whileHover={{ z: 50 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front of card */}
        <div className="absolute inset-0 w-full h-full backface-hidden">
          <motion.div
            className="relative w-full h-full"
            animate={{
              rotateX: isHovered ? -5 : 0,
              rotateY: isHovered ? 5 : 0,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-green-400/20 rounded-2xl blur-2xl opacity-60" />

            <div className="relative w-full h-full bg-gradient-to-br from-white/10 to-white/5 border border-gray-800/60 dark:border-white/30 rounded-2xl p-6 overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-full blur-2xl" />
              </div>

              <div className="relative z-10 h-full flex flex-col items-center justify-center text-center">
                <motion.div
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400/30 to-emerald-400/30 flex items-center justify-center mb-4"
                  animate={{
                    rotate: isHovered ? 360 : 0,
                    scale: isHovered ? 1.1 : 1
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-white">
                    {getIcon(certificate.type || 'quality', "lg")}
                  </div>
                </motion.div>

                <h3 className="text-xl font-bold text-white mb-2">{certificate.name}</h3>
                <p className="text-white/70 text-sm mb-4">{certificate.issuingBody}</p>

                {certificate.imageUrl && (
                  <motion.div
                    className="absolute top-4 right-4 w-12 h-12 opacity-50"
                    animate={{ opacity: isHovered ? 0.8 : 0.5 }}
                  >
                    <img
                      src={certificate.imageUrl}
                      alt={certificate.name}
                      className="w-full h-full object-contain"
                    />
                  </motion.div>
                )}

                <motion.p
                  className="absolute bottom-4 text-white/50 text-xs"
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  Click to view details
                </motion.p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Back of card */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
          <div className="relative w-full h-full bg-gradient-to-br from-emerald-900/90 to-green-900/90 border border-white/30 rounded-2xl p-6">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 via-emerald-400/10 to-teal-400/20" />
            </div>

            <div className="relative z-10 h-full flex flex-col">
              <h4 className="text-lg font-semibold text-white mb-3">Certificate Details</h4>

              {certificate.description && (
                <p className="text-white/80 text-sm mb-4 grow">
                  {certificate.description}
                </p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Type:</span>
                  <span className="text-white capitalize">{certificate.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Issuer:</span>
                  <span className="text-white">{certificate.issuingBody}</span>
                </div>
              </div>

              {certificate.documentUrl && (
                <a
                  href={certificate.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-4 flex items-center justify-center gap-2 py-2 px-4 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg text-white text-sm transition-colors"
                >
                  View Document
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              <p className="mt-4 text-center text-white/50 text-xs">
                Click to flip back
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CertificateBadge({ certificate, index }: { certificate: Certificate; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />

      <div className="relative bg-white/10 border border-white/30 rounded-xl p-4 h-full">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400/30 to-emerald-400/30 flex items-center justify-center shrink-0">
            {getIcon(certificate.type || 'quality')}
          </div>

          <div className="flex-1">
            <h4 className="font-semibold text-white text-sm mb-1">{certificate.name}</h4>
            <p className="text-white/60 text-xs">{certificate.issuingBody}</p>
          </div>
        </div>

        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: isHovered ? "auto" : 0, opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          {certificate.description && (
            <p className="text-white/70 text-xs mt-3 pt-3 border-t border-white/20">
              {certificate.description}
            </p>
          )}
        </motion.div>

        {certificate.imageUrl && (
          <div className="absolute top-2 right-2 w-8 h-8 opacity-50 group-hover:opacity-80 transition-opacity">
            <img
              src={certificate.imageUrl}
              alt={certificate.name}
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export const CertificateDisplay = memo(function CertificateDisplay({ certificateIds, displayMode = "compact", className }: CertificateDisplayProps) {
  const { data: certificates } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
    enabled: !!certificateIds && certificateIds.length > 0,
  });

  if (!certificateIds || certificateIds.length === 0 || !certificates) {
    return null;
  }

  const selectedCertificates = certificates.filter(cert =>
    certificateIds.includes(cert.id) && cert.isActive
  );

  if (selectedCertificates.length === 0) {
    return null;
  }

  const renderCertificates = () => {
    switch (displayMode) {
      case "3d":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {selectedCertificates.map((certificate, index) => (
              <Certificate3DCard key={certificate.id} certificate={certificate} index={index} />
            ))}
          </div>
        );

      case "badges":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedCertificates.map((certificate, index) => (
              <CertificateBadge key={certificate.id} certificate={certificate} index={index} />
            ))}
          </div>
        );

      case "compact":
      default:
        return (
          <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible scrollbar-hide">
            {selectedCertificates.map((certificate, index) => (
              <CompactCertificateCard key={certificate.id} certificate={certificate} index={index} />
            ))}
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (displayMode) {
      case "3d":
        return "Our Certifications";
      case "badges":
        return "Our Certifications";
      case "compact":
      default:
        return "Our Certifications";
    }
  };

  const getTitleSize = () => {
    switch (displayMode) {
      case "3d":
        return "text-3xl";
      case "badges":
        return "text-2xl";
      case "compact":
      default:
        return "text-lg";
    }
  };

  return (
    <div className={`${displayMode === "compact" ? "mt-8" : displayMode === "badges" ? "mb-12" : "mb-16"} ${className || ""}`}>
      <motion.h3
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`${getTitleSize()} font-semibold text-white mb-${displayMode === "compact" ? "4" : displayMode === "badges" ? "6" : "8"} ${displayMode === "compact" ? "" : "text-center"}`}
      >
        {getTitle()}
      </motion.h3>

      {renderCertificates()}
    </div>
  );
});

// CSS for 3D effects
if (typeof document !== 'undefined') {
  const style = `
    .perspective-1000 {
      perspective: 1000px;
    }
    
    .transform-style-3d {
      transform-style: preserve-3d;
    }
    
    .backface-hidden {
      backface-visibility: hidden;
    }
    
    .rotate-y-180 {
      transform: rotateY(180deg);
    }
  `;

  const styleSheet = document.createElement("style");
  styleSheet.textContent = style;
  document.head.appendChild(styleSheet);
}