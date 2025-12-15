/**
 * Newsletter Form Hook
 * Manages newsletter subscription form state and submission
 */

import { useState, useEffect, useRef } from "react";

export function useNewsletterForm(autoResetMs: number = 5000) {
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const emailTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setEmailSubmitted(true);
      // Clear any existing timeout
      if (emailTimeoutRef.current) {
        clearTimeout(emailTimeoutRef.current);
      }
      // Store timeout for cleanup
      emailTimeoutRef.current = setTimeout(() => {
        setEmailSubmitted(false);
        setEmail("");
        emailTimeoutRef.current = null;
      }, autoResetMs);
    }
  };

  // Cleanup email timeout on unmount
  useEffect(() => {
    return () => {
      if (emailTimeoutRef.current) {
        clearTimeout(emailTimeoutRef.current);
      }
    };
  }, []);

  return {
    email,
    setEmail,
    emailSubmitted,
    handleSubmit,
  };
}
