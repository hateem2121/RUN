import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Copy,
  FileText,
  HardDrive,
  Image,
  RefreshCw,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface StorageStats {
  totalFiles: number;
  totalSize: number;
  referencedFiles: number;
  orphanedCount: number;
  duplicateGroups: number;
  compressionCandidates: number;
  potentialSavings: {
    orphanedSize: number;
    duplicateSize: number;
    compressionSize: number;
    totalSavings: number;
  };
  formattedTotalSize: string;
  formattedSavings: string;
}

interface StorageAnalysis {
  totalFiles: number;
  totalSize: number;
  referencedFiles: number;
  orphanedFiles: Array<{
    key: string;
    size: number;
    reason: string;
  }>;
  duplicates: Array<{
    hash: string;
    files: Array<{
      id: number;
      filename: string;
      size: number;
      originalName: string;
      uploadedAt: string;
    }>;
    totalSize: number;
    potentialSavings: number;
  }>;
  compressionCandidates: Array<{
    id: number;
    filename: string;
    size: number;
    type: string;
    estimatedSavings: number;
    estimatedSavingsPercent: number;
  }>;
  potentialSavings: {
    orphanedSize: number;
    duplicateSize: number;
    compressionSize: number;
    totalSavings: number;
  };
}

// Phase 2: Background Analysis Interfaces
interface BackgroundAnalysisResult {
  id: number;
  analysis: {
    totalFiles: number;
    totalSize: number;
    referencedFiles: number;
    orphanedCount: number;
    duplicateGroups: number;
    compressionCandidates: number;
    potentialSavings: {
      orphanedSize: number;
      duplicateSize: number;
      compressionSize: number;
      totalSavings: number;
    };
    timestamp: string;
    analysisTime: number;
  };
}

interface InstantAnalysisResponse {
  hasResults: boolean;
  analysis?: BackgroundAnalysisResult["analysis"];
  lastUpdate?: string;
  cacheAge?: number;
}

interface AnalysisHistoryItem {
  id: number;
  timestamp: string;
  analysisTime: number;
  totalFiles: number;
  totalSize: number;
  orphanedCount: number;
  duplicateGroups: number;
  potentialSavings: number;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

function StorageOptimization() {
  const [selectedOrphaned, setSelectedOrphaned] = useState<string[]>([]);
  const [selectedDuplicates, setSelectedDuplicates] = useState<{
    [hash: string]: number;
  }>({});
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [useBackgroundAnalysis] = useState(true);
  const [activeTab] = useState("overview");
  const { toast } = useToast();

  // Phase 2: Instant results from background analysis (milliseconds loading)
  const {
    data: instantResults,
    isLoading: instantLoading,
    refetch: refetchInstant,
  } = useQuery<InstantAnalysisResponse>({
    queryKey: ["/api/v2/background-storage/instant"],
    staleTime: 30 * 1000, // 30 seconds cache for instant results
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: useBackgroundAnalysis,
  });

  // Phase 2: Analysis history for trends
  useQuery<AnalysisHistoryItem[]>({
    queryKey: ["/api/v2/background-storage/history"],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: activeTab === "trends",
  });

  // Phase 2: Force analysis mutation
  const forceAnalysisMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/v2/background-storage/force", {
        method: "POST",
        body: JSON.stringify({}),
      });
    },
    onSuccess: () => {
      toast({
        title: "Analysis Complete",
        description: "Background analysis has been updated with latest data",
      });
      refetchInstant();
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to run analysis",
        variant: "destructive",
      });
    },
  });

  // Phase 1: Legacy storage statistics (fallback when no background data)
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery<StorageStats>({
    queryKey: ["/api/v2/storage/stats"],
    refetchInterval: false,
    staleTime: 6 * 60 * 60 * 1000, // 6 hours - stats don't change frequently
    gcTime: 12 * 60 * 60 * 1000, // 12 hours in cache
    retry: 1, // Only retry once for long-running operations
    refetchOnWindowFocus: false,
    enabled: !useBackgroundAnalysis || !instantResults?.hasResults,
  });

  // Phase 1: Legacy detailed analysis (fallback when no background data)
  const {
    data: analysis,
    isLoading: analysisLoading,
    refetch: refetchAnalysis,
  } = useQuery<StorageAnalysis>({
    queryKey: ["/api/v2/storage/analysis"],
    enabled: analysisComplete && (!useBackgroundAnalysis || !instantResults?.hasResults),
    refetchInterval: false,
    staleTime: 6 * 60 * 60 * 1000, // 6 hours - analysis results are fairly stable
    gcTime: 12 * 60 * 60 * 1000, // 12 hours in cache
    retry: 1, // Only retry once for long-running operations
    refetchOnWindowFocus: false,
  });

  // Cleanup orphaned files mutation
  const cleanupOrphanedMutation = useMutation({
    mutationFn: async (fileKeys: string[]) => {
      return apiRequest("/api/v2/storage/cleanup/orphaned", {
        method: "POST",
        body: JSON.stringify({ fileKeys }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Cleanup Complete",
        description: `Cleaned ${data.cleaned} files successfully${
          data.failed > 0 ? `, ${data.failed} failed` : ""
        }`,
      });
      setSelectedOrphaned([]);
      if (useBackgroundAnalysis) {
        refetchInstant();
      } else {
        refetchStats();
        refetchAnalysis();
      }
    },
    onError: (error) => {
      toast({
        title: "Cleanup Failed",
        description: error instanceof Error ? error.message : "Failed to cleanup files",
        variant: "destructive",
      });
    },
  });

  // Merge duplicates mutation
  const mergeDuplicatesMutation = useMutation({
    mutationFn: async ({
      hash,
      keepId,
      deleteIds,
    }: {
      hash: string;
      keepId: number;
      deleteIds: number[];
    }) => {
      return apiRequest("/api/v2/storage/merge/duplicates", {
        method: "POST",
        body: JSON.stringify({ hash, keepId, deleteIds }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Duplicates Merged",
        description: "Duplicate files have been successfully merged",
      });
      setSelectedDuplicates({});
      if (useBackgroundAnalysis) {
        refetchInstant();
      } else {
        refetchStats();
        refetchAnalysis();
      }
    },
    onError: (error) => {
      toast({
        title: "Merge Failed",
        description: error instanceof Error ? error.message : "Failed to merge duplicates",
        variant: "destructive",
      });
    },
  });

  const runAnalysis = () => {
    if (useBackgroundAnalysis) {
      forceAnalysisMutation.mutate();
    } else {
      setAnalysisComplete(true);
      refetchAnalysis();
    }
  };

  // Get current data (Phase 2 if available, fallback to Phase 1)
  const currentData =
    instantResults?.hasResults && instantResults.analysis
      ? {
          stats: {
            totalFiles: instantResults.analysis.totalFiles,
            totalSize: instantResults.analysis.totalSize,
            referencedFiles: instantResults.analysis.referencedFiles,
            orphanedCount: instantResults.analysis.orphanedCount,
            duplicateGroups: instantResults.analysis.duplicateGroups,
            compressionCandidates: instantResults.analysis.compressionCandidates,
            potentialSavings: instantResults.analysis.potentialSavings,
            formattedTotalSize: formatBytes(instantResults.analysis.totalSize),
            formattedSavings: formatBytes(instantResults.analysis.potentialSavings.totalSavings),
          },
          isLoading: instantLoading,
          lastAnalyzed: instantResults.analysis.timestamp,
          analysisTime: instantResults.analysis.analysisTime,
          isBackground: true,
        }
      : {
          stats,
          isLoading: statsLoading || analysisLoading,
          lastAnalyzed: null,
          analysisTime: null,
          isBackground: false,
        };

  const handleCleanupOrphaned = () => {
    if (selectedOrphaned.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select files to cleanup",
        variant: "destructive",
      });
      return;
    }

    cleanupOrphanedMutation.mutate(selectedOrphaned);
  };

  const handleMergeDuplicates = (hash: string) => {
    const keepId = selectedDuplicates[hash];
    if (!keepId) {
      toast({
        title: "No File Selected",
        description: "Please select which file to keep",
        variant: "destructive",
      });
      return;
    }

    const duplicateGroup = analysis?.duplicates.find((d) => d.hash === hash);
    if (!duplicateGroup) return;

    const deleteIds = duplicateGroup.files.filter((f) => f.id !== keepId).map((f) => f.id);

    mergeDuplicatesMutation.mutate({ hash, keepId, deleteIds });
  };

  if (currentData.isLoading || !currentData.stats) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <p className="text-gray-600 text-sm">Loading storage statistics...</p>
          <p className="mt-2 text-gray-500 text-xs">This may take a moment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl">Storage Optimization</h1>
          <p className="text-muted-foreground">Analyze and optimize your media storage usage</p>
          {currentData.isBackground && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="mr-1 h-3 w-3" />
                Phase 2: Instant Background Analysis
              </Badge>
              {currentData.lastAnalyzed && (
                <span className="text-muted-foreground text-xs">
                  Last updated: {new Date(currentData.lastAnalyzed).toLocaleTimeString()}
                </span>
              )}
              {currentData.analysisTime && (
                <span className="text-muted-foreground text-xs">
                  ({currentData.analysisTime}ms)
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runAnalysis}
            variant="default"
            disabled={currentData.isBackground ? forceAnalysisMutation.isPending : analysisLoading}
            size="sm"
          >
            {(currentData.isBackground ? forceAnalysisMutation.isPending : analysisLoading) ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {currentData.isBackground ? "Updating..." : "Analyzing..."}
              </>
            ) : (
              <>
                <BarChart3 className="mr-2 h-4 w-4" />
                {currentData.isBackground ? "Force Update" : "Run Analysis"}
              </>
            )}
          </Button>
          <Button
            onClick={() => (currentData.isBackground ? refetchInstant() : refetchStats())}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Storage Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{currentData.stats?.formattedTotalSize}</div>
            <p className="text-muted-foreground text-xs">{currentData.stats?.totalFiles} files</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Potential Savings</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-green-600">
              {currentData.stats?.formattedSavings}
            </div>
            <p className="text-muted-foreground text-xs">
              {currentData.stats?.potentialSavings?.totalSavings
                ? Math.round(
                    (currentData.stats.potentialSavings.totalSavings /
                      currentData.stats.totalSize) *
                      100,
                  )
                : 0}
              % reduction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Orphaned Files</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{currentData.stats?.orphanedCount}</div>
            <p className="text-muted-foreground text-xs">
              {currentData.stats?.potentialSavings?.orphanedSize
                ? formatBytes(currentData.stats.potentialSavings.orphanedSize)
                : "0 Bytes"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Duplicate Groups</CardTitle>
            <Copy className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{currentData.stats?.duplicateGroups}</div>
            <p className="text-muted-foreground text-xs">
              {currentData.stats?.potentialSavings?.duplicateSize
                ? formatBytes(currentData.stats.potentialSavings.duplicateSize)
                : "0 Bytes"}{" "}
              savings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analysis</CardTitle>
          <CardDescription>
            Run a comprehensive analysis to identify optimization opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!analysisComplete ? (
            <div className="py-8 text-center">
              <Button onClick={runAnalysis} size="lg">
                <BarChart3 className="mr-2 h-4 w-4" />
                Run Storage Analysis
              </Button>
            </div>
          ) : analysisLoading ? (
            <div className="center-flex py-8">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Analyzing storage...</span>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="orphaned" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="orphaned">Orphaned Files</TabsTrigger>
                <TabsTrigger value="duplicates">Duplicates</TabsTrigger>
                <TabsTrigger value="compression">Compression</TabsTrigger>
              </TabsList>

              {/* Orphaned Files Tab */}
              <TabsContent value="orphaned" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Orphaned Files</h3>
                    <p className="text-muted-foreground text-sm">
                      Files that exist in storage but aren't referenced by any content
                    </p>
                  </div>
                  {selectedOrphaned.length > 0 && (
                    <Button
                      onClick={handleCleanupOrphaned}
                      variant="destructive"
                      disabled={cleanupOrphanedMutation.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Selected ({selectedOrphaned.length})
                    </Button>
                  )}
                </div>

                {analysis?.orphanedFiles && analysis.orphanedFiles.length > 0 ? (
                  <div className="space-y-2">
                    {analysis.orphanedFiles.map((file) => (
                      <div
                        key={file.key}
                        className="flex items-center space-x-3 rounded-lg border p-3"
                      >
                        <input
                          type="checkbox"
                          checked={selectedOrphaned.includes(file.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOrphaned([...selectedOrphaned, file.key]);
                            } else {
                              setSelectedOrphaned(selectedOrphaned.filter((k) => k !== file.key));
                            }
                          }}
                          className="rounded"
                        />
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">{file.key}</p>
                          <p className="text-muted-foreground text-sm">{file.reason}</p>
                        </div>
                        <Badge variant="secondary">{formatBytes(file.size)}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      No orphaned files found. Your storage is clean!
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              {/* Duplicates Tab */}
              <TabsContent value="duplicates" className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">Duplicate Files</h3>
                  <p className="text-muted-foreground text-sm">
                    Files with identical content that can be merged
                  </p>
                </div>

                {analysis?.duplicates && analysis.duplicates.length > 0 ? (
                  <div className="space-y-4">
                    {analysis.duplicates.map((group) => (
                      <Card key={group.hash}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              Duplicate Group ({group.files.length} files)
                            </CardTitle>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">
                                {formatBytes(group.potentialSavings)} savings
                              </Badge>
                              <Button
                                onClick={() => handleMergeDuplicates(group.hash)}
                                disabled={
                                  !selectedDuplicates[group.hash] ||
                                  mergeDuplicatesMutation.isPending
                                }
                                size="sm"
                              >
                                Merge
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {group.files.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center space-x-3 rounded border p-2"
                              >
                                <input
                                  type="radio"
                                  name={`duplicate-${group.hash}`}
                                  value={file.id}
                                  checked={selectedDuplicates[group.hash] === file.id}
                                  onChange={() => {
                                    setSelectedDuplicates({
                                      ...selectedDuplicates,
                                      [group.hash]: file.id,
                                    });
                                  }}
                                />
                                <Image className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <p className="font-medium">{file.originalName}</p>
                                  <p className="text-muted-foreground text-sm">
                                    Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge variant="secondary">{formatBytes(file.size)}</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      No duplicate files found. Your files are unique!
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              {/* Compression Tab */}
              <TabsContent value="compression" className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">Compression Candidates</h3>
                  <p className="text-muted-foreground text-sm">
                    Large images that could benefit from WebP optimization
                  </p>
                </div>

                {analysis?.compressionCandidates && analysis.compressionCandidates.length > 0 ? (
                  <div className="space-y-2">
                    {analysis.compressionCandidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="flex items-center space-x-3 rounded-lg border p-3"
                      >
                        <Image className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">{candidate.filename}</p>
                          <p className="text-muted-foreground text-sm">{candidate.type}</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <Badge variant="secondary">{formatBytes(candidate.size)}</Badge>
                          <div className="text-green-600 text-sm">
                            -{candidate.estimatedSavingsPercent}% (
                            {formatBytes(candidate.estimatedSavings)})
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>All images are already optimized!</AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default StorageOptimization;
