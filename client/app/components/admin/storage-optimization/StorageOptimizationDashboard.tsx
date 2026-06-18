import {
  AlertCircle,
  CheckCircle,
  Database,
  FileX,
  HardDrive,
  History,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StorageOptimizationDashboard() {
  return (
    <div className="space-y-8 p-8">
      {/* Header Section */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white">Storage Optimization</h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-admin-muted">
            <History className="h-4 w-4" />
            Last scanned: 2 minutes ago
          </p>
        </div>
        <Button className="flex items-center gap-2 bg-primary px-6 font-bold shadow-lg shadow-primary/20 hover:bg-primary/90">
          <HardDrive className="h-5 w-5" />
          Scan Now
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Storage */}
        <Card variant="glass-premium" className="flex flex-col justify-between">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-admin-muted">Total Storage Used</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">2.4 GB</span>
              <span className="text-sm text-admin-muted">/ 10 GB</span>
            </div>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div className="h-full w-custom-space-64 bg-primary" />
            </div>
            <p className="mt-2 text-xs text-admin-muted">24% capacity used</p>
          </CardContent>
        </Card>

        {/* Orphaned Files */}
        <Card variant="glass-premium" className="flex flex-col justify-between border-amber-500/30">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-admin-muted">Orphaned Files</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-500">47 files</span>
            </div>
            <p className="mt-1 text-sm font-medium text-amber-500/80">890 MB total waste</p>
            <div className="mt-3 flex items-center gap-1 text-xxs font-bold uppercase tracking-tighter text-amber-500">
              <AlertCircle className="h-4 w-4" />
              Warning
            </div>
          </CardContent>
        </Card>

        {/* Optimized Assets */}
        <Card variant="glass-premium" className="flex flex-col justify-between">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-admin-muted">Optimized Assets</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">376</span>
              <span className="text-sm text-admin-muted">/ 423</span>
            </div>
            <p className="mt-1 font-medium text-emerald-500 text-sm">89% completion</p>
            <div className="mt-3 flex items-center gap-1 text-xxs font-bold uppercase tracking-tighter text-emerald-500">
              <CheckCircle className="h-4 w-4" />
              Healthy
            </div>
          </CardContent>
        </Card>

        {/* Pending Optimization */}
        <Card variant="glass-premium" className="flex flex-col justify-between">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-admin-muted">Pending Optimization</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">12 files</span>
            </div>
            <p className="mt-1 text-sm font-medium text-admin-muted">Processing queued</p>
            <div className="mt-3 flex items-center gap-1 text-xxs font-bold uppercase tracking-tighter text-admin-muted">
              <RefreshCw className="h-4 w-4" />
              Pending
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Panels Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Panel: Storage Breakdown */}
        <Card variant="glass-premium" className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Storage Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mx-auto mb-8 h-48 w-48">
              {/* SVG Donut Chart Mockup */}
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
                <title>Storage breakdown donut chart</title>
                <circle
                  cx="18"
                  cy="18"
                  fill="transparent"
                  r="15.915"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="3.5"
                />
                <circle
                  cx="18"
                  cy="18"
                  fill="transparent"
                  r="15.915"
                  stroke="#3c83f6"
                  strokeDasharray="45 55"
                  strokeDashoffset="0"
                  strokeWidth="3.5"
                />
                <circle
                  cx="18"
                  cy="18"
                  fill="transparent"
                  r="15.915"
                  stroke="#a855f7"
                  strokeDasharray="35 65"
                  strokeDashoffset="-45"
                  strokeWidth="3.5"
                />
                <circle
                  cx="18"
                  cy="18"
                  fill="transparent"
                  r="15.915"
                  stroke="#f59e0b"
                  strokeDasharray="10 90"
                  strokeDashoffset="-80"
                  strokeWidth="3.5"
                />
                <circle
                  cx="18"
                  cy="18"
                  fill="transparent"
                  r="15.915"
                  stroke="#10b981"
                  strokeDasharray="10 90"
                  strokeDashoffset="-90"
                  strokeWidth="3.5"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tracking-tighter text-white">2.4</span>
                <span className="text-xxs font-bold uppercase tracking-widest text-admin-muted">
                  GB Total
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-primary" />
                  <span className="text-admin-foreground">Images</span>
                </div>
                <span className="font-bold text-white">45%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-purple-500" />
                  <span className="text-admin-foreground">Videos</span>
                </div>
                <span className="font-bold text-white">35%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-amber-500" />
                  <span className="text-admin-foreground">3D Models</span>
                </div>
                <span className="font-bold text-white">10%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-emerald-500" />
                  <span className="text-admin-foreground">Documents</span>
                </div>
                <span className="font-bold text-white">10%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel: Orphaned Files Table */}
        <Card variant="glass-premium" className="flex flex-col lg:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Orphaned Files</CardTitle>
            <span className="rounded bg-amber-500/10 px-2 py-1 text-xs font-bold uppercase text-amber-500">
              47 Issues Found
            </span>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-admin-muted">
                  <tr>
                    <th className="pb-3 font-semibold">Filename</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Size</th>
                    <th className="pb-3 font-semibold">Last Modified</th>
                    <th className="pb-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    {
                      name: "hero_banner_fallback.webp",
                      type: "IMAGE",
                      size: "12.4 MB",
                      date: "Oct 12, 2023",
                    },
                    {
                      name: "summer_campaign_v4.mp4",
                      type: "VIDEO",
                      size: "442.1 MB",
                      date: "Sep 28, 2023",
                    },
                    {
                      name: "temp_product_render_01.glb",
                      type: "3D MODEL",
                      size: "88.5 MB",
                      date: "Nov 04, 2023",
                    },
                    {
                      name: "draft_specs_archive.pdf",
                      type: "DOC",
                      size: "4.2 MB",
                      date: "Aug 15, 2023",
                    },
                  ].map((file) => (
                    <tr key={file.name} className="group border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 font-medium text-admin-foreground">{file.name}</td>
                      <td className="py-4">
                        <span className="rounded-full bg-admin-surface px-2 py-0.5 text-xxs font-bold text-admin-muted border border-white/10">
                          {file.type}
                        </span>
                      </td>
                      <td className="py-4 text-admin-muted">{file.size}</td>
                      <td className="py-4 text-admin-muted">{file.date}</td>
                      <td className="py-4 text-right">
                        <button
                          type="button"
                          className="text-admin-muted transition-colors hover:text-red-500"
                          aria-label={`Delete ${file.name}`}
                          title={`Delete ${file.name}`}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Panel Actions */}
            <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-white/10 pt-6">
              <Button className="flex items-center gap-2 bg-primary font-bold hover:bg-primary/90">
                <RefreshCw className="h-5 w-5" />
                Optimize All Assets
              </Button>
              <Button
                variant="destructive"
                className="flex items-center gap-2 border border-red-500/20 bg-red-500/10 font-bold hover:bg-red-500/20"
              >
                <FileX className="h-5 w-5" />
                Delete All Orphaned
              </Button>
              <div className="flex-1" />
              <div className="flex items-center gap-1 text-xs text-admin-muted">
                <AlertCircle className="h-4 w-4" />
                Deleting orphaned files cannot be undone.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities Section (Additional) */}
      <Card variant="glass-premium">
        <CardHeader>
          <CardTitle>Optimization History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                icon: RefreshCw,
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
                title: "Bulk Compression",
                desc: "Reduced 45 images by 1.2 GB",
                date: "Yesterday, 4:30 PM",
              },
              {
                icon: Trash2,
                color: "text-primary",
                bg: "bg-primary/10",
                title: "Auto-Cleanup",
                desc: "Removed 12 temporary cache files",
                date: "2 days ago",
              },
              {
                icon: Database,
                color: "text-purple-500",
                bg: "bg-purple-500/10",
                title: "Video Transcoding",
                desc: "H.265 optimization for 3 files",
                date: "Nov 12, 2023",
              },
            ].map((activity) => (
              <div key={activity.title} className="flex items-start gap-4">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${activity.bg}`}
                >
                  <activity.icon className={`h-5 w-5 ${activity.color}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{activity.title}</p>
                  <p className="text-xs text-admin-muted">{activity.desc}</p>
                  <p className="mt-1 text-xxs font-bold uppercase tracking-tighter text-admin-muted">
                    {activity.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
