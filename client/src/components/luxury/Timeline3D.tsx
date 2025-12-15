import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Calendar, Sparkles } from "lucide-react";
import type { AboutTimelineEntry } from "@shared/schema";

interface Timeline3DProps {
  entries: AboutTimelineEntry[];
  getAssetUrl: (id: number) => string | null;
  getAsset: (id: number) => any;
}

export function Timeline3D({ entries, getAssetUrl, getAsset }: Timeline3DProps) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 100,
      rotateX: -45,
      scale: 0.8,
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  } as any;

  const timelineVariants = {
    hidden: { scaleY: 0 },
    visible: {
      scaleY: 1,
      transition: {
        duration: 1.5,
        ease: "easeInOut",
      },
    },
  } as any;

  return (
    <section className="py-20 bg-gradient-light-luxury relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="font-neue-stance text-4xl md:text-5xl font-bold luxury-heading-light mb-6">
            Our Journey Through Time
          </h2>
          <p className="text-xl luxury-text-light max-w-3xl mx-auto leading-relaxed">
            From artisanal craftsmanship to modern innovation, discover the milestones that shaped RUN APPAREL's legacy of excellence.
          </p>
        </motion.div>

        {/* 3D Timeline Container */}
        <motion.div
          ref={containerRef}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="timeline-3d-light relative"
        >
          {/* Central Timeline Line */}
          <motion.div
            variants={timelineVariants}
            className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-blue-200 via-blue-400 to-blue-600 rounded-full shadow-sm-luxury-light"
            style={{ height: `${entries.length * 300}px`, top: '50px' }}
          />

          {/* Timeline Entries */}
          <div className="space-y-24">
            {entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                variants={itemVariants}
                className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  } flex-col`}
              >
                {/* Timeline Marker */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={isInView ? { scale: 1, rotate: 0 } : {}}
                  transition={{ delay: 0.5 + index * 0.2, duration: 0.6 }}
                  className="absolute left-1/2 transform -translate-x-1/2 w-16 h-16 glass-card-light rounded-full flex items-center justify-center shadow-sm-luxury-elevated z-10"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                </motion.div>

                {/* Content Card */}
                <motion.div
                  whileHover={{
                    scale: 1.02,
                    rotateY: index % 2 === 0 ? 5 : -5,
                    z: 20,
                  }}
                  className={`timeline-card-3d w-full md:w-5/12 ${index % 2 === 0 ? 'md:mr-auto md:pr-16' : 'md:ml-auto md:pl-16'
                    }`}
                >
                  <div className="glass-card-light rounded-3xl p-8 interactive-light shadow-sm-luxury-elevated">
                    {/* Year Badge */}
                    <motion.div
                      initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="inline-flex items-center gap-2 mb-4"
                    >
                      <div className="stat-card-light rounded-full px-4 py-2">
                        <span className="text-2xl font-bold luxury-heading-light">
                          {entry.year}
                        </span>
                      </div>
                      <Sparkles className="h-5 w-5 text-blue-500" />
                    </motion.div>

                    {/* Title */}
                    <motion.h3
                      initial={{ opacity: 0, y: 20 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 1.0 + index * 0.1 }}
                      className="font-neue-stance text-2xl md:text-3xl font-bold luxury-heading-light mb-4"
                    >
                      {entry.title}
                    </motion.h3>

                    {/* Description */}
                    <motion.p
                      initial={{ opacity: 0, y: 15 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 1.2 + index * 0.1 }}
                      className="luxury-text-light leading-relaxed mb-6"
                    >
                      {entry.description}
                    </motion.p>

                    {/* Media */}
                    {entry.imageId && getAsset(entry.imageId) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ delay: 1.4 + index * 0.1 }}
                        className="relative overflow-hidden rounded-2xl shadow-sm-luxury-light"
                      >
                        <img
                          src={getAssetUrl(entry.imageId) || ''}
                          alt={entry.title}
                          className="w-full h-48 object-cover filter brightness-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </motion.div>
                    )}

                    {/* Floating Decorator */}
                    <motion.div
                      animate={{
                        y: [0, -10, 0],
                        rotate: [0, 5, 0]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.5
                      }}
                      className={`absolute -top-4 ${index % 2 === 0 ? '-right-4' : '-left-4'
                        } w-8 h-8 glass-light rounded-full opacity-60`}
                    />
                  </div>
                </motion.div>

                {/* Floating Background Elements */}
                <motion.div
                  animate={{
                    y: [0, -15, 0],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 1.2
                  }}
                  className={`absolute ${index % 2 === 0 ? 'right-8' : 'left-8'
                    } top-8 w-20 h-20 glass-light rounded-full`}
                  style={{ zIndex: -1 }}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 glass-light rounded-full floating-element opacity-40" />
        <div className="absolute bottom-20 right-10 w-24 h-24 glass-light rounded-full floating-element opacity-30" style={{ animationDelay: '3s' }} />
      </div>
    </section>
  );
}