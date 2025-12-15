import React, { useState } from 'react';
import { XIcon } from './Icons';
import ClippedElement from './ClippedElement';

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
}

type FormState = 'idle' | 'submitting' | 'success';

const InquiryModal: React.FC<InquiryModalProps> = ({ isOpen, onClose, productName }) => {
  const [formState, setFormState] = useState<FormState>('idle');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState('submitting');
    // Simulate API call
    setTimeout(() => {
      setFormState('success');
    }, 1000);
  };
  
  const handleClose = () => {
      setFormState('idle');
      onClose();
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm"
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <ClippedElement
        className="bg-white w-full max-w-lg p-6 sm:p-8 md:p-12 relative"
        clipAmount={30}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors z-10"
          aria-label="Close"
        >
          <XIcon className="w-6 h-6" />
        </button>
        
        {formState !== 'success' ? (
            <>
                <h2 className="text-3xl font-black-display mb-2">Inquiry For:</h2>
                <p className="text-gray-600 mb-8">{productName}</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="companyName" className="block text-xs font-semibold uppercase tracking-widest mb-2">Company Name</label>
                    <input type="text" id="companyName" name="companyName" required className="form-input"/>
                  </div>
                  <div>
                    <label htmlFor="contactEmail" className="block text-xs font-semibold uppercase tracking-widest mb-2">Contact Email</label>
                    <input type="email" id="contactEmail" name="contactEmail" required className="form-input"/>
                  </div>
                  <div>
                    <label htmlFor="moq" className="block text-xs font-semibold uppercase tracking-widest mb-2">Estimated Order Quantity (MOQ)</label>
                    <input type="number" id="moq" name="moq" min="100" placeholder="100" required className="form-input"/>
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-widest mb-2">Message</label>
                    <textarea id="message" name="message" rows={4} placeholder="Describe your customization needs (e.g., branding, material changes, etc.)" className="form-input"></textarea>
                  </div>
                  <ClippedElement
                    as="button"
                    type="submit"
                    disabled={formState === 'submitting'}
                    className="w-full mt-4 bg-black text-white py-4 text-sm font-bold tracking-[0.2em] hover:bg-gray-800 transition-colors disabled:bg-gray-400"
                  >
                    {formState === 'submitting' ? 'SENDING...' : 'SUBMIT INQUIRY'}
                  </ClippedElement>
                </form>
            </>
        ) : (
            <div className="text-center py-12 animate-fade-in">
                <h2 className="text-3xl font-black-display mb-4">INQUIRY SENT</h2>
                <p className="text-gray-700 max-w-sm mx-auto mb-8">Thank you for your interest in RUN APPAREL. Our partnership team will review your request and be in touch within 24-48 hours.</p>
                <ClippedElement
                    as="button"
                    onClick={handleClose}
                    className="bg-black text-white px-10 py-3 text-sm font-bold tracking-[0.2em] hover:bg-gray-800 transition-colors"
                >
                    CLOSE
                </ClippedElement>
            </div>
        )}
      </ClippedElement>
    </div>
  );
};

export default InquiryModal;