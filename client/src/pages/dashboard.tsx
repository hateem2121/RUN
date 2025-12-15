import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Zap } from "lucide-react";
import { CrossPageDashboard } from "@/components/cross-page-dashboard";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-modal-backdrop container mx-auto px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <BarChart3 className="w-8 h-8" />
            <h1 className="text-4xl md:text-6xl font-bold">Performance Dashboard</h1>
            <TrendingUp className="w-8 h-8" />
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl max-w-3xl mx-auto mb-8 text-gray-100"
          >
            Real-time insights connecting sustainability, manufacturing excellence, and technological innovation
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-medium">Live Data Integration</span>
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