import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import type { QuoteItem } from "../../stores/useQuoteStore";

interface QuoteListProps {
  items: QuoteItem[];
  updateQuantity: (id: number, quantity: number) => void;
  removeFromQuote: (id: number) => void;
  onClose: () => void;
}

export function QuoteList({ items, updateQuantity, removeFromQuote, onClose }: QuoteListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-border border-dashed py-16 text-center bg-muted/5">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/10 text-muted-foreground">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <p className="text-muted-foreground text-sm font-medium tracking-wide">
          Your quote list is empty.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 text-xs font-bold uppercase tracking-widest text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
        >
          Browse Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-custom-space-162 font-bold uppercase tracking-custom-misc-158 text-muted-foreground/60">
        Selected Items ({items.length})
      </h3>
      <div className="space-y-3">
        {items.map((item: QuoteItem) => (
          <div
            key={item.id}
            className="group relative flex gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04] hover:border-white/10 dark:bg-zinc-900/40"
          >
            {item.imageUrl ? (
              <div className="h-20 w-20 overflow-hidden rounded-lg bg-muted/20">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted/20 text-muted-foreground">
                <ShoppingBag className="h-8 w-8 opacity-20" />
              </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
              <h4 className="truncate font-neue-stance text-sm font-bold uppercase tracking-tight text-foreground">
                {item.name}
              </h4>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 overflow-hidden rounded-full border border-border bg-background/50">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.id, Math.max(item.minOrderQuantity, item.quantity - 1))
                    }
                    className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-10 text-center text-xs font-bold tabular-nums text-foreground">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeFromQuote(item.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500 active:scale-90"
                  aria-label={`Remove ${item.name} from quote`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
