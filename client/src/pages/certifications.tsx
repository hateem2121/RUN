import type { Certificate } from "@shared/schema";
import { motion } from "framer-motion";
import { Award, ExternalLink, FileCheck, Leaf, Shield } from "lucide-react";
import { useMemo, useState } from "react";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { ResourceGrid } from "@/components/resources/ResourceGrid";
import { ResourceSearch } from "@/components/resources/ResourceSearch";
import { ResourceSkeleton } from "@/components/resources/ResourceSkeleton";
import { SEOMeta } from "@/components/seo-meta";
import { Typography } from "@/components/ui/typography";
import { useResourceBatch } from "@/hooks/resources/useResourceBatch";
import { useDebounce } from "@/hooks/use-debounce";

export default function Certifications() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCerts, setExpandedCerts] = useState<Set<number>>(new Set());

  const { certificates, isLoading } = useResourceBatch(["certificate"]);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filter certificates based on search
  const filteredCertificates = useMemo(() => {
    if (!debouncedSearchTerm) return certificates;

    const term = debouncedSearchTerm.toLowerCase();
    return certificates.filter(
      (cert) =>
        cert.name.toLowerCase().includes(term) ||
        cert.type?.toLowerCase().includes(term) ||
        cert.issuingBody?.toLowerCase().includes(term) ||
        cert.description?.toLowerCase().includes(term),
    );
  }, [certificates, debouncedSearchTerm]);

  const toggleExpanded = (id: number) => {
    setExpandedCerts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "sustainability":
        return Leaf;
      case "quality":
        return Award;
      case "compliance":
        return Shield;
      default:
        return FileCheck;
    }
  };

  const getCertificateDetails = (cert: Certificate) => (
    <div className="space-y-3 text-sm">
      <div>
        <span className="font-medium text-foreground/80">Issuing Body:</span>
        <Typography.P className="text-muted-foreground">{cert.issuingBody}</Typography.P>
      </div>
      {cert.documentUrl && (
        <div>
          <span className="font-medium text-foreground/80">Documentation:</span>
          <a
            href={cert.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center gap-1 text-blue-600 hover:text-blue-700"
          >
            View Certificate <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
      {cert.description && (
        <div>
          <span className="font-medium text-foreground/80">Details:</span>
          <Typography.P className="mt-1 text-muted-foreground">{cert.description}</Typography.P>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-linear-to-b from-muted/30 to-background">
      <SEOMeta
        title="Certifications - Quality & Compliance Standards | RUN APPAREL"
        description="Explore our comprehensive certifications including OEKO-TEX, GOTS, and ISO standards ensuring quality and sustainability in sportswear manufacturing."
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <Typography.H1 className="mb-4 font-bold text-4xl text-foreground md:text-5xl">
            Certifications & Standards
          </Typography.H1>
          <Typography.P className="mx-auto max-w-3xl text-lg text-muted-foreground">
            Industry-leading quality and compliance certifications for premium sportswear
            manufacturing
          </Typography.P>

          <div className="mt-8 flex justify-center gap-6">
            <div className="text-center">
              <div className="font-bold text-3xl text-green-600">{certificates.length}</div>
              <div className="text-muted-foreground text-sm">Active Certifications</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-3xl text-blue-600">
                {
                  certificates.filter((c) => c.type && c.type.toLowerCase() === "sustainability")
                    .length
                }
              </div>
              <div className="text-muted-foreground text-sm">Sustainability</div>
            </div>
          </div>
        </motion.div>

        {/* Search Bar */}
        <div className="mx-auto mb-12 max-w-2xl">
          <ResourceSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search certifications..."
          />
        </div>

        {/* Certifications Grid */}
        {isLoading ? (
          <ResourceSkeleton count={6} columns={3} />
        ) : (
          <ResourceGrid
            items={filteredCertificates}
            columns={3}
            emptyState={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 text-center"
              >
                <Shield className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
                <Typography.H3 className="mb-2 font-semibold text-foreground text-xl">
                  {searchTerm ? "No certifications found" : "No certifications available"}
                </Typography.H3>
                <Typography.P className="text-muted-foreground">
                  {searchTerm ? "Try adjusting your search terms" : "Check back later for updates"}
                </Typography.P>
              </motion.div>
            }
            renderItem={(cert) => {
              const Icon = getTypeIcon(cert.type || "quality");
              return (
                <ResourceCard
                  key={cert.id}
                  title={cert.name}
                  subtitle={cert.issuingBody || undefined}
                  description={cert.description || undefined}
                  icon={<Icon className="h-5 w-5" />}
                  tags={[cert.type || "quality"]}
                  isExpanded={expandedCerts.has(cert.id)}
                  onToggleExpand={() => toggleExpanded(cert.id)}
                  expandedContent={getCertificateDetails(cert)}
                  badges={cert.isActive ? [{ label: "Active", variant: "default" }] : []}
                />
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
