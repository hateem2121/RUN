import { Box, Check, FileVideo, Filter, Image as ImageIcon, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface MediaAsset {
  id: string;
  url: string;
  filename: string;
  type: "image" | "video" | "model";
  size?: string;
}

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAsset) => void;
  title?: string;
  allowedTypes?: ("image" | "video" | "model")[];
  initialAssets?: MediaAsset[];
}

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  title = "Select Asset",
  allowedTypes = ["image", "video", "model"],
  initialAssets = [],
}: MediaPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(allowedTypes);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Mock data if no initial assets provided
  const assets: MediaAsset[] = useMemo(() => {
    if (initialAssets.length > 0) return initialAssets;

    return [
      {
        id: "1",
        url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
        filename: "tshirt_white_v1.jpg",
        type: "image",
        size: "1.2 MB",
      },
      {
        id: "2",
        url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
        filename: "denim_wash_04.png",
        type: "image",
        size: "845 KB",
      },
      {
        id: "3",
        url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
        filename: "sport_sneaker_red.jpg",
        type: "image",
        size: "2.4 MB",
      },
      { id: "4", url: "", filename: "promo_teaser.mp4", type: "video", size: "45.0 MB" },
      { id: "5", url: "", filename: "sneaker_mesh_rig.glb", type: "model", size: "12.4 MB" },
    ];
  }, [initialAssets]);

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypes.includes(asset.type);
    return matchesSearch && matchesType;
  });

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-[1100px] h-[80vh] bg-[#0A0A0A]/90 backdrop-blur-2xl border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
            <p className="text-xs text-[#68869A]">
              Showing:{" "}
              {selectedTypes.length === allowedTypes.length
                ? "All assets"
                : selectedTypes.join(", ")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg text-[#68869A] hover:text-white transition-colors"
            title="Close"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-[240px] border-r border-white/5 p-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#68869A] w-4 h-4" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-[#68869A]"
              />
            </div>

            {/* Filters */}
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#68869A] flex items-center gap-2">
                <Filter className="w-3 h-3" />
                Type Filter
              </p>
              <div className="space-y-3">
                {["image", "video", "model"].map((type) => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      disabled={!allowedTypes.includes(type as any)}
                      checked={selectedTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTypes((prev) => [...prev, type]);
                        } else {
                          setSelectedTypes((prev) => prev.filter((t) => t !== type));
                        }
                      }}
                      className="rounded border-white/10 bg-white/5 text-blue-500 focus:ring-0 focus:ring-offset-0 disabled:opacity-20"
                    />
                    <span
                      className={cn(
                        "text-sm capitalize transition-colors",
                        selectedTypes.includes(type)
                          ? "text-white font-medium"
                          : "text-[#68869A] group-hover:text-white/60",
                      )}
                    >
                      {type}s
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Grid */}
          <main className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-black/20">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAssetId(asset.id)}
                  className="group relative flex flex-col gap-2 cursor-pointer"
                >
                  <div
                    className={cn(
                      "aspect-square rounded-xl overflow-hidden border-2 transition-all flex items-center justify-center bg-white/[0.03]",
                      selectedAssetId === asset.id
                        ? "border-blue-500 shadow-lg shadow-blue-500/10"
                        : "border-white/5 hover:border-white/20",
                    )}
                  >
                    {asset.type === "image" && asset.url ? (
                      <img
                        src={asset.url}
                        alt={asset.filename}
                        className={cn(
                          "w-full h-full object-cover transition-opacity duration-300",
                          selectedAssetId === asset.id
                            ? "opacity-100"
                            : "opacity-60 group-hover:opacity-100",
                        )}
                      />
                    ) : asset.type === "video" ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileVideo className="w-12 h-12 text-[#68869A]" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Box className="w-12 h-12 text-[#68869A]" />
                      </div>
                    )}

                    {selectedAssetId === asset.id && (
                      <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                        <div className="bg-blue-500 text-white rounded-full p-1.5 shadow-xl">
                          <Check className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="px-1">
                    <p
                      className={cn(
                        "text-xs font-medium truncate mb-0.5",
                        selectedAssetId === asset.id ? "text-blue-400" : "text-slate-300",
                      )}
                    >
                      {asset.filename}
                    </p>
                    <p className="text-[10px] text-[#68869A]">{asset.size}</p>
                  </div>
                </div>
              ))}
            </div>

            {filteredAssets.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-[#68869A] gap-4 py-20">
                <ImageIcon className="w-12 h-12 opacity-20" />
                <p>No assets found matching your criteria</p>
              </div>
            )}
          </main>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            {selectedAssetId && (
              <>
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-sm font-medium text-slate-300 tracking-tight">
                  1 item selected
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              disabled={!selectedAssetId}
              onClick={() => selectedAsset && onSelect(selectedAsset)}
              className={cn(
                "px-6 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg",
                selectedAssetId
                  ? "bg-blue-500 text-white hover:bg-blue-600 shadow-blue-500/20 active:scale-[0.98]"
                  : "bg-white/5 text-[#68869A] cursor-not-allowed border border-white/5",
              )}
            >
              Confirm Selection
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
