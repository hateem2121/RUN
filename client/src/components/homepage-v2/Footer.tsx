// import { useStore } from "./store"; // Unused if setCursor is unused

import { Instagram, Linkedin, Twitter } from "lucide-react";
import { motion } from "framer-motion";
import NewsletterSignup from "./NewsletterSignup";

const Footer: React.FC = () => {
  return (
    <>
      {/* 
        SPACER: Mimics footer height on desktop to function as a "margin-bottom".
        Ensures the main content scrolls away to reveal the fixed footer.
        Hidden on mobile where footer is just static.
      */}
      <div className="hidden lg:block w-full lg:h-[800px] pointer-events-none" aria-hidden="true" />

      <footer
        className="
          w-full bg-[#050505] text-[#FAFAFA] 
          /* Mobile: Standard Block */
          relative h-auto
          /* Desktop: Sticky Reveal */
          lg:fixed lg:bottom-0 lg:left-0 lg:h-[800px] lg:z-[-10]
          overflow-hidden flex flex-col
        "
      >
        {/* Blueprint Grid Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>

        <div className="container mx-auto relative z-10 flex flex-col h-full pt-16 md:pt-24 pb-12 px-4 md:px-8">
          {/* TOP SECTION: Call to Action + Newsletter */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 flex-1">
            <div className="lg:col-span-5 flex flex-col justify-center">
              <h2 className="text-[clamp(2.5rem,4cqw,5rem)] font-bold tracking-tighter leading-[0.9] text-balance mb-6">
                READY TO <br />
                <span className="text-blue-600">SCALE UP?</span>
              </h2>
              <p className="text-gray-400 max-w-md text-lg text-balance mb-8">
                Join the industrial revolution. We engineer the textiles that power future
                performance brands.
              </p>
            </div>

            <div className="lg:col-span-7 flex flex-col justify-center">
              {/* NEWSLETTER INTEGRATION */}
              <NewsletterSignup />
            </div>
          </div>

          {/* BOTTOM SECTION: Bento Grid Links */}
          {/* 
            BENTO GRID + SUBGRID 
            Standard Grid on Desktop. Subgrid ensures row alignment.
          */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 border-t border-gray-900 pt-12 mt-12">
            {/* Column 1: Brand */}
            <div className="lg:col-span-1 flex flex-col justify-between h-full">
              <span className="text-2xl font-black tracking-tighter leading-none text-[#1a1a1a] select-none mix-blend-overlay opacity-50 whitespace-nowrap block mb-4">
                RUN APPAREL
              </span>
              <p className="text-xs text-gray-500 font-mono mt-auto">
                © 2025 RUN INDUSTRIES.
                <br />
                ALL RIGHTS RESERVED.
              </p>
            </div>

            {/* Column 2: Navigation - Uses Subgrid on Desktop if nested, but here top-level grid works fine */}
            <div className="flex flex-col gap-6">
              <h4 className="uppercase tracking-widest text-gray-500 text-xs font-mono border-b border-gray-900 pb-2">
                [ SITEMAP ]
              </h4>
              <ul className="space-y-3">
                {["Products", "Manufacturing", "Sustainability", "Careers"].map((item) => (
                  <motion.li
                    key={item}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <a
                      href="#"
                      className="text-lg text-gray-300 hover:text-white transition-colors block w-fit"
                    >
                      {item}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Column 3: Socials */}
            <div className="flex flex-col gap-6">
              <h4 className="uppercase tracking-widest text-gray-500 text-xs font-mono border-b border-gray-900 pb-2">
                [ CONNECT ]
              </h4>
              <div className="flex gap-4">
                <SocialLink icon={Twitter} label="Twitter" />
                <SocialLink icon={Instagram} label="Instagram" />
                <SocialLink icon={Linkedin} label="LinkedIn" />
              </div>
              <div className="mt-auto">
                <p className="text-sm text-gray-500">
                  Zurich, Switzerland
                  <br />
                  <a href="mailto:hello@run.com" className="hover:text-blue-600 transition-colors">
                    hello@run.com
                  </a>
                </p>
              </div>
            </div>

            {/* Column 4: Legal */}
            <div className="flex flex-col gap-6">
              <h4 className="uppercase tracking-widest text-gray-500 text-xs font-mono border-b border-gray-900 pb-2">
                [ LEGAL ]
              </h4>
              <ul className="space-y-3">
                {["Privacy Policy", "Terms of Service", "Cookie Settings"].map((item) => (
                  <li key={item}>
                    <button className="text-sm text-gray-500 hover:text-white transition-colors text-left">
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

const SocialLink = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <motion.a
    href="#"
    whileHover={{ y: -3 }}
    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors border border-white/10"
    aria-label={label}
  >
    <Icon className="w-5 h-5" />
  </motion.a>
);

export default Footer;
