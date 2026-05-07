/**
 * Centralized HTML Sanitisation Utility
 *
 * ALL user-generated or CMS-stored HTML (e.g., TipTap output) MUST be sanitised
 * through this module before rendering via dangerouslySetInnerHTML or innerHTML.
 *
 * Uses isomorphic-dompurify for SSR + CSR compatibility.
 */
import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitise HTML content from TipTap or any CMS-stored rich text.
 * Removes script tags, event handlers, and dangerous attributes while
 * preserving safe formatting elements.
 */
export function sanitizeHtml(dirty: string | undefined | null): string {
  if (!dirty) return "";

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      // TipTap standard output elements
      "p",
      "br",
      "strong",
      "em",
      "s",
      "u",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "blockquote",
      "pre",
      "code",
      "a",
      "img",
      "span",
      "div",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "width", "height", "class"],
    // Force safe link attributes
    ADD_ATTR: ["target"],
    FORBID_TAGS: ["script", "style", "iframe", "form", "input", "textarea"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
  });
}
