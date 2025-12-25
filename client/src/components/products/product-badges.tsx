interface CertificationBadgeProps {
  text: string;
  className?: string;
}

export const CertificationBadge = ({ text, className }: CertificationBadgeProps) => (
  <div
    className={`border border-border bg-background px-2 py-0.5 font-bold text-[10px] text-foreground tracking-widest ${className}`}
  >
    {text}
  </div>
);

export const GotsIcon = () => <CertificationBadge text="GOTS" />;
export const OekoTexIcon = () => <CertificationBadge text="OEKO-TEX" />;
export const RcsIcon = () => <CertificationBadge text="RCS" />;
