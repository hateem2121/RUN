import type { SemanticSearchResultItem } from "@run-remix/shared";
import { Layers, Loader2, Search, Shirt, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "../ui/badge.js";

export interface SemanticSearchBarProps {
  onSelectResult?: (result: SemanticSearchResultItem) => void;
  placeholder?: string;
  initialType?: "all" | "products" | "fabrics";
  className?: string;
}

export function SemanticSearchBar({
  onSelectResult,
  placeholder = "Search garments & fabrics with AI (e.g., 'lightweight summer jersey')...",
  initialType = "all",
  className = "",
}: SemanticSearchBarProps) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | "products" | "fabrics">(initialType);
  const [results, setResults] = useState<SemanticSearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLFormElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch search results with debouncing
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: trimmed,
          type,
          limit: "8",
          threshold: "0.25",
        });

        const res = await fetch(`/api/search/semantic?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Failed to execute search");
        }

        const data = await res.json();
        if (data.success && data.data?.results) {
          setResults(data.data.results);
          setIsOpen(true);
        } else {
          setResults([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search error");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, type]);

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleSelect = (item: SemanticSearchResultItem) => {
    setIsOpen(false);
    if (onSelectResult) {
      onSelectResult(item);
    } else if (item.type === "product") {
      window.location.href = `/products/${item.slug}`;
    } else {
      window.location.href = `/fabrics#${item.slug}`;
    }
  };

  return (
    <form
      aria-label="Semantic AI Search"
      onSubmit={(e) => e.preventDefault()}
      ref={containerRef}
      className={`relative w-full max-w-3xl mx-auto ${className}`}
    >
      {/* Search Input Bar */}
      <div className="relative flex items-center bg-card border border-border rounded-xl shadow-card transition-all duration-200 focus-within:border-manufacturing-accent focus-within:ring-2 focus-within:ring-manufacturing-accent/20">
        <div className="pl-4 pr-2 text-manufacturing-accent flex items-center">
          <Sparkles className="w-5 h-5 animate-pulse text-amber-500" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full py-3.5 pr-10 text-sm md:text-base bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
          aria-label="Semantic AI search query"
        />

        {isLoading ? (
          <div className="pr-4 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="pr-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search input"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <div className="pr-4 text-muted-foreground">
            <Search className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 mt-2 px-1">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Filter:
        </span>
        <button
          type="button"
          onClick={() => setType("all")}
          className={`text-xs px-2.5 py-1 rounded-full transition-colors font-medium ${
            type === "all"
              ? "bg-manufacturing-accent text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All Categories
        </button>
        <button
          type="button"
          onClick={() => setType("products")}
          className={`text-xs px-2.5 py-1 rounded-full transition-colors font-medium flex items-center gap-1 ${
            type === "products"
              ? "bg-manufacturing-accent text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <Shirt className="w-3 h-3" /> Garments
        </button>
        <button
          type="button"
          onClick={() => setType("fabrics")}
          className={`text-xs px-2.5 py-1 rounded-full transition-colors font-medium flex items-center gap-1 ${
            type === "fabrics"
              ? "bg-manufacturing-accent text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <Layers className="w-3 h-3" /> Technical Fabrics
        </button>
      </div>

      {/* Results Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-elevation-3 z-modal max-h-96 overflow-y-auto divide-y divide-border">
          {error ? (
            <div className="p-6 text-center text-destructive text-sm">{error}</div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No matching garments or fabrics found. Try searching with descriptive attributes like
              "compression", "waterproof", or "merino".
            </div>
          ) : (
            results.map((item) => (
              <button
                type="button"
                key={`${item.type}-${item.id}`}
                onClick={() => handleSelect(item)}
                className="w-full text-left p-4 hover:bg-muted/50 transition-colors flex items-start justify-between gap-4 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground text-sm md:text-base group-hover:text-manufacturing-accent transition-colors truncate">
                      {item.name}
                    </span>
                    <Badge variant={item.type === "product" ? "default" : "secondary"}>
                      {item.type === "product" ? "Garment" : "Fabric"}
                    </Badge>
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                  )}
                  {item.categoryName && (
                    <span className="inline-block text-2xs font-mono text-muted-foreground mt-1">
                      {item.categoryName}
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <span className="text-xs font-mono font-bold text-manufacturing-accent">
                    {item.matchPercentage}% Match
                  </span>
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-manufacturing-accent rounded-full"
                      style={{ width: `${item.matchPercentage}%` }}
                    />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </form>
  );
}
