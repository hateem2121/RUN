import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { TransformedProduct } from '@/lib/product-transformers';

interface InquiryItem {
  product: TransformedProduct;
  quantity: number;
}

interface InquiryCartContextType {
  items: InquiryItem[];
  addItem: (product: TransformedProduct) => void;
  removeItem: (productId: string) => void;
  isInCart: (productId: string) => boolean;
  itemCount: number;
  clearCart: () => void;
}

const InquiryCartContext = createContext<InquiryCartContextType | undefined>(undefined);

export const InquiryCartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<InquiryItem[]>([]);

  const addItem = useCallback((product: TransformedProduct) => {
    setItems((prevItems) => {
      if (prevItems.some(item => item.product.id === product.id)) {
        return prevItems;
      }
      return [...prevItems, { product, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prevItems) => prevItems.filter(item => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const isInCart = useCallback((productId: string) => {
    return items.some(item => item.product.id === productId);
  }, [items]);

  const itemCount = useMemo(() => items.length, [items]);

  const value = { items, addItem, removeItem, isInCart, itemCount, clearCart };

  return (
    <InquiryCartContext.Provider value={value}>
      {children}
    </InquiryCartContext.Provider>
  );
};

export const useInquiryCart = () => {
  const context = useContext(InquiryCartContext);
  if (!context) {
    throw new Error('useInquiryCart must be used within an InquiryCartProvider');
  }
  return context;
};
