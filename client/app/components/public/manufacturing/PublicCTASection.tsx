import { ArrowRight, Download, MessageSquare } from "lucide-react";
import { Link } from "react-router";
import { ManufacturingErrorBoundary } from "@/components/error-boundaries/manufacturing-error-boundary";

export function PublicCTASection() {
  return (
    <ManufacturingErrorBoundary>
      <section className="py-32 relative bg-[#121212] border-t border-[#D4A853]/20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 400 400%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] pointer-events-none mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#D4A853]/5 to-[#0A0A0A] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-3 bg-black/40 border border-[#D4A853]/30 px-4 py-2 mb-8 backdrop-blur-md">
            <span className="w-2 h-2 bg-[#D4A853] rounded-none rotate-45 animate-pulse"></span>
            <span className="text-[#D4A853] text-[10px] uppercase font-mono tracking-widest font-bold">
              New Accounts Open for Q3
            </span>
          </div>

          <h2 className="text-5xl md:text-7xl font-neue-stance font-bold text-white uppercase tracking-tighter mb-8 italic skew-x-[-2deg] leading-[0.9]">
            Ready to Manufacture <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4A853] to-white">
              Excellence?
            </span>
          </h2>

          <p className="text-[#E3DFD6] text-lg max-w-2xl mx-auto mb-16 font-light leading-relaxed">
            Partner with a facility that understands performance engineering. Minimum order
            quantities start at 500 units per style.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <Link
              to="/contact"
              className="w-full md:w-auto px-10 py-5 bg-[#D4A853] text-[#0A0A0A] font-bold uppercase tracking-widest text-sm hover:bg-white transition-colors flex items-center justify-center gap-3 group skew-x-[-10deg] hover:shadow-[0_0_30px_rgba(212,168,83,0.4)]"
            >
              <span className="skew-x-[10deg] flex items-center gap-3">
                Request a Quote
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            <Link
              to="/resources/lookbook"
              className="w-full md:w-auto px-10 py-5 border border-white/20 hover:border-[#D4A853] text-white hover:text-[#D4A853] bg-white/[0.02] backdrop-blur-sm transition-all font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 group skew-x-[-10deg]"
            >
              <span className="skew-x-[10deg] flex items-center gap-3">
                <Download className="w-4 h-4" />
                Download 2026 Lookbook
              </span>
            </Link>
          </div>

          <div className="mt-16 flex items-center justify-center gap-2 text-sm text-[#68869A] font-mono">
            <MessageSquare className="w-4 h-4" />
            <span>Need immediate assistance?</span>
            <a
              href="mailto:production@runapparel.com"
              className="text-white hover:text-[#D4A853] underline decoration-white/20 hover:decoration-[#D4A853] transition-colors font-bold ml-1"
            >
              production@runapparel.com
            </a>
          </div>
        </div>
      </section>
    </ManufacturingErrorBoundary>
  );
}
