import { ArrowRight, Download, MessageSquare } from "lucide-react";
import { Link } from "react-router";
import { ManufacturingErrorBoundary } from "@/components/error-boundaries/manufacturing-error-boundary";

export function PublicCTASection() {
  return (
    <ManufacturingErrorBoundary>
      <section className="py-32 relative bg-manufacturing-bg border-t border-manufacturing-accent/20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-20 bg-custom-misc-203 pointer-events-none mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-manufacturing-accent/5 to-manufacturing-bg pointer-events-none"></div>

        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-3 bg-black/40 border border-manufacturing-accent/30 px-4 py-2 mb-8 backdrop-blur-md">
            <span className="w-2 h-2 bg-manufacturing-accent rounded-none rotate-45 animate-pulse"></span>
            <span className="text-manufacturing-accent text-custom-space-193 uppercase font-mono tracking-widest font-bold">
              New Accounts Open for Q3
            </span>
          </div>

          <h2 className="text-5xl md:text-7xl font-neue-stance font-bold text-white uppercase tracking-tighter mb-8 italic skew-x-custom-misc-204 leading-custom-misc-205">
            Ready to Manufacture <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-manufacturing-accent to-white">
              Excellence?
            </span>
          </h2>

          <p className="text-manufacturing-body text-lg max-w-2xl mx-auto mb-16 font-light leading-relaxed">
            Partner with a facility that understands performance engineering. Minimum order
            quantities start at 500 units per style.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <Link
              to="/contact"
              className="w-full md:w-auto px-10 py-5 bg-manufacturing-accent text-custom-color-234 font-bold uppercase tracking-widest text-sm hover:bg-white transition-colors flex items-center justify-center gap-3 group skew-x-custom-misc-206 hover:shadow-custom-misc-207"
            >
              <span className="skew-x-custom-misc-208 flex items-center gap-3">
                Request a Quote
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            <Link
              to="/resources/lookbook"
              className="w-full md:w-auto px-10 py-5 border border-white/20 hover:border-manufacturing-accent text-white hover:text-manufacturing-accent bg-white/[0.02] backdrop-blur-sm transition-all font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 group skew-x-custom-misc-209"
            >
              <span className="skew-x-custom-misc-210 flex items-center gap-3">
                <Download className="w-4 h-4" />
                Download 2026 Lookbook
              </span>
            </Link>
          </div>

          <div className="mt-16 flex items-center justify-center gap-2 text-sm text-manufacturing-muted font-mono">
            <MessageSquare className="w-4 h-4" />
            <span>Need immediate assistance?</span>
            <a
              href="mailto:production@runapparel.com"
              className="text-white hover:text-manufacturing-accent underline decoration-white/20 hover:decoration-manufacturing-accent transition-colors font-bold ml-1"
            >
              production@runapparel.com
            </a>
          </div>
        </div>
      </section>
    </ManufacturingErrorBoundary>
  );
}
