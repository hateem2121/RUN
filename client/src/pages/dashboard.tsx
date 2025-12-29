import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Zap } from "lucide-react";
import { CrossPageDashboard } from "@/components/cross-page-dashboard";

export default function Dashboard() {
  return (
    <div className="flex min-h-dvh flex-col bg-neutral-900 text-white selection:bg-blue-500/30">
      {/* Hero Section */}
      <section className="relative bg-linear-to-r from-blue-600 via-purple-600 to-green-600 py-20">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container relative z-modal-backdrop mx-auto px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="center-flex mb-6 gap-3"
          >
            <BarChart3 className="h-8 w-8" />
            <h1 className="font-bold text-4xl md:text-6xl">Performance Dashboard</h1>
            <TrendingUp className="h-8 w-8" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto mb-8 max-w-3xl text-white/90 text-xl md:text-2xl"
          >
            Real-time insights connecting sustainability, manufacturing excellence, and
            technological innovation
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="center-flex gap-2"
          >
            <Zap className="h-5 w-5 text-yellow-400" />
            <span className="font-medium text-yellow-400">Live Data Integration</span>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <CrossPageDashboard />
        </div>
      </section>
    </div>
  );
}
