import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Award, Leaf, FileCheck, ExternalLink } from "lucide-react";
import { SEOMeta } from "@/components/seo-meta";
import { ResourceSearch } from "@/components/resources/ResourceSearch";
import { ResourceGrid } from "@/components/resources/ResourceGrid";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { ResourceSkeleton } from "@/components/resources/ResourceSkeleton";
import { useResourceBatch } from "@/hooks/resources/useResourceBatch";
import { useDebounce } from "@/hooks/use-debounce";
import type { Certificate } from "@shared/schema";
import { useMemo } from "react";

export default function Certifications() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCerts, setExpandedCerts] = useState<Set<number>>(new Set());

  const { certificates, isLoading } = useResourceBatch(['certificate']);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filter certificates based on search
  const filteredCertificates = useMemo(() => {
    if (!debouncedSearchTerm) return certificates;

    const term = debouncedSearchTerm.toLowerCase();
    return certificates.filter(cert =>
      cert.name.toLowerCase().includes(term) ||
      (cert.type && cert.type.toLowerCase().includes(term)) ||
      (cert.issuingBody && cert.issuingBody.toLowerCase().includes(term)) ||
      cert.description?.toLowerCase().includes(term)
    );
  }, [certificates, debouncedSearchTerm]);

  const toggleExpanded = (id: number) => {
    setExpandedCerts(prev => {
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
      case 'sustainability': return Leaf;
      case 'quality': return Award;
      case 'compliance': return Shield;
      default: return FileCheck;
    }
  };

  const getCertificateDetails = (cert: Certificate) => (
    <div className="space-y-3 text-sm">
      <div>
        <span className="font-medium text-gray-700">Issuing Body:</span>
        <p className="text-gray-600">{cert.issuingBody}</p>
      </div>
      {cert.documentUrl && (
        <div>
          <span className="font-medium text-gray-700">Documentation:</span>
          <a
            href={cert.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 mt-1"
          >
            View Certificate <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
      {cert.description && (
        <div>
          <span className="font-medium text-gray-700">Details:</span>
          <p className="text-gray-600 mt-1">{cert.description}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <SEOMeta
        title="Certifications - Quality & Compliance Standards | RUN APPAREL"
        description="Explore our comprehensive certifications including OEKO-TEX, GOTS, and ISO standards ensuring quality and sustainability in sportswear manufacturing."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Certifications & Standards
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Industry-leading quality and compliance certifications for premium sportswear manufacturing
          </p>

          <div className="flex justify-center gap-6 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{certificates.length}</div>
              <div className="text-sm text-gray-600">Active Certifications</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {certificates.filter(c => c.type && c.type.toLowerCase() === 'sustainability').length}
              </div>
              <div className="text-sm text-gray-600">Sustainability</div>
            </div>
          </div>
        </motion.div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
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
                className="text-center py-16"
              >
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No certifications found' : 'No certifications available'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search terms' : 'Check back later for updates'}
                </p>
              </motion.div>
            }
            renderItem={(cert) => {
              const Icon = getTypeIcon(cert.type || 'quality');
              return (
                <ResourceCard
                  key={cert.id}
                  title={cert.name}
                  subtitle={cert.issuingBody || undefined}
                  description={cert.description || undefined}
                  icon={<Icon className="w-5 h-5" />}
                  tags={[cert.type || 'quality']}
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