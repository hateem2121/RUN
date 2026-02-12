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
      <div className="rounded-xl border-2 border-slate-200 border-dashed py-12 text-center">
        <p className="text-slate-500">Your quote list is empty.</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 font-medium text-blue-600 hover:underline"
        >
          Browse Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-500 text-xs uppercase tracking-wider">
        Selected Items ({items.length})
      </h3>
      {items.map((item: QuoteItem) => (
        <div
          key={item.id}
          className="flex gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4"
        >
          {item.imageUrl && (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-16 w-16 rounded-md bg-white object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <h4 className="truncate font-medium text-slate-900">{item.name}</h4>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex items-center rounded-md border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(item.id, Math.max(item.minOrderQuantity, item.quantity - 1))
                  }
                  className="px-2 py-1 text-slate-500 hover:bg-slate-50"
                >
                  -
                </button>
                <span className="w-12 px-2 text-center font-medium text-sm">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="px-2 py-1 text-slate-500 hover:bg-slate-50"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeFromQuote(item.id)}
                className="text-red-500 text-xs hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
