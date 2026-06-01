import { Link } from "react-router";

export default function Blog() {
  const posts = [
    {
      id: 1,
      title: "The Future of Sustainable Sportswear Materials",
      excerpt:
        "Exploring new biodegradable fibers, organic cotton blends, and recycled ocean plastics shaping performance wear.",
      category: "Sustainability",
      date: "May 28, 2026",
      readTime: "5 min read",
    },
    {
      id: 2,
      title: "Optimizing B2B Apparel Supply Chains for 2027",
      excerpt:
        "How real-time analytics, local hubs, and automated manufacturing reduce lead times by 40%.",
      category: "Operations",
      date: "May 15, 2026",
      readTime: "8 min read",
    },
    {
      id: 3,
      title: "Heritage Craftsmanship Meets Modern Technology",
      excerpt:
        "Celebrating 135+ years of precision engineering in Sialkot, Pakistan, combined with automated CAD/CAM cut lines.",
      category: "Heritage",
      date: "April 30, 2026",
      readTime: "6 min read",
    },
  ];

  return (
    <div className="w-full bg-background min-h-screen text-foreground py-24 px-4 md:px-8">
      <div className="max-w-container-2xl mx-auto">
        {/* Header */}
        <div className="mb-16 border-b border-foreground/10 pb-8">
          <p className="text-brand-lime font-mono text-xs tracking-widest uppercase mb-2">
            RUN INSIGHTS
          </p>
          <h1 className="text-[10vw] leading-[0.9] font-bold uppercase md:text-[5vw] tracking-tighter">
            BLOG & STORIES
          </h1>
        </div>

        {/* Featured Post */}
        <div className="mb-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-muted/10 rounded-2xl overflow-hidden p-6 border border-foreground/5">
          <div className="aspect-video bg-muted/20 rounded-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <span className="bg-brand-lime text-black font-mono text-xs font-bold px-3 py-1 rounded-full">
                LATEST RELEASE
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-muted-foreground font-mono text-xs tracking-wider">
              SUSTAINABILITY · MAY 31, 2026
            </span>
            <h2 className="text-2xl md:text-4xl font-bold uppercase tracking-tight hover:text-brand-lime transition-colors">
              Next-Gen Zero-Waste Dyeing Protocols
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We are proud to introduce our new dry-dye processing systems, saving 95% of water
              usage compared to standard reactive dyeing workflows.
            </p>
            <Link
              to="#"
              className="text-brand-lime font-bold uppercase tracking-wider text-sm mt-4 hover:underline"
            >
              Read Article →
            </Link>
          </div>
        </div>

        {/* Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article
              key={post.id}
              className="group flex flex-col justify-between border-t border-foreground/10 pt-6"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-muted-foreground font-mono text-xs">
                  <span>{post.category}</span>
                  <span>{post.readTime}</span>
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight group-hover:text-brand-lime transition-colors">
                  {post.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{post.excerpt}</p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-muted-foreground font-mono text-xs">{post.date}</span>
                <Link
                  to="#"
                  className="text-brand-lime font-bold uppercase text-xs tracking-wider group-hover:underline"
                >
                  Read More
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
