import { Clock, Mail, MapPin, Phone, Share2 } from "lucide-react";
import type { ContactConfig } from "@/components/contact/contact-form";
import { Card, GlassCardDecorations } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

interface ContactInfoCardsProps {
  contactConfig?: ContactConfig | undefined;
}

export default function ContactInfoCards({ contactConfig }: ContactInfoCardsProps) {
  return (
    <div className="col-span-1 lg:col-span-2 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-1">
      {/* Social Connect Card - Mobile First */}
      <Card
        variant="glass-premium"
        className="group relative overflow-hidden transition-all duration-300 hover:shadow-glow-lg lg:hidden"
      >
        <GlassCardDecorations />
        <div className="relative z-10 flex flex-col items-center p-6 text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-3 ring-1 ring-primary/20 transition-all duration-300 group-hover:bg-primary/20">
            <Share2 className="h-6 w-6 text-primary" />
          </div>
          <Typography.H3 className="mb-2 font-bold text-lg">Connect With Us</Typography.H3>
          <div className="flex gap-4">
            {contactConfig?.socialLinks &&
              Object.entries(contactConfig.socialLinks).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-background/50 p-2 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <span className="sr-only">{platform}</span>
                  {/* Icons would go here */}
                  <span className="font-bold text-xs capitalize">{platform}</span>
                </a>
              ))}
          </div>
        </div>
      </Card>

      {/* Contact Info Card */}
      <Card
        variant="glass-premium"
        className="group relative overflow-hidden transition-all duration-300 hover:shadow-glow-lg"
      >
        <GlassCardDecorations />
        <div className="relative z-10 flex flex-col items-center p-6 text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-3 ring-1 ring-primary/20 transition-all duration-300 group-hover:bg-primary/20">
            <Phone className="h-6 w-6 text-primary" />
          </div>
          <Typography.H3 className="mb-2 font-bold text-lg">Contact Info</Typography.H3>
          <div className="space-y-2 text-muted-foreground text-sm">
            <p className="flex items-center justify-center gap-2">
              <Mail className="h-4 w-4" />
              <a
                href={`mailto:${contactConfig?.email || "hello@runapparel.co"}`}
                className="transition-colors hover:text-primary"
              >
                {contactConfig?.email || "hello@runapparel.co"}
              </a>
            </p>
            <p className="flex items-center justify-center gap-2">
              <Phone className="h-4 w-4" />
              <a
                href={`tel:${contactConfig?.phone || "+1 (555) 123-4567"}`}
                className="transition-colors hover:text-primary"
              >
                {contactConfig?.phone || "+1 (555) 123-4567"}
              </a>
            </p>
          </div>
        </div>
      </Card>

      {/* Location Card */}
      <Card
        variant="glass-premium"
        className="group relative overflow-hidden transition-all duration-300 hover:shadow-glow-lg"
      >
        <GlassCardDecorations />
        <div className="relative z-10 flex flex-col items-center p-6 text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-3 ring-1 ring-primary/20 transition-all duration-300 group-hover:bg-primary/20">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <Typography.H3 className="mb-2 font-bold text-lg">Our Location</Typography.H3>
          <Typography.P className="mb-4 max-w-[200px] text-muted-foreground text-sm">
            {contactConfig?.locationLine1 || "123 Innovation Drive"}
            <br />
            {contactConfig?.locationLine2 || "Tech Valley, CA 94043"}
          </Typography.P>
          <a
            href={`https://maps.google.com/?q=${contactConfig?.mapCoordinates?.lat},${contactConfig?.mapCoordinates?.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center font-medium text-primary text-xs hover:underline"
          >
            {contactConfig?.locationButtonText || "GET DIRECTIONS"}
          </a>
        </div>
      </Card>

      {/* Business Hours Card */}
      <Card
        variant="glass-premium"
        className="group relative overflow-hidden transition-all duration-300 hover:shadow-glow-lg"
      >
        <GlassCardDecorations />
        <div className="relative z-10 flex flex-col items-center p-6 text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-3 ring-1 ring-primary/20 transition-all duration-300 group-hover:bg-primary/20">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <Typography.H3 className="mb-4 font-bold text-lg">Business Hours</Typography.H3>
          <div className="w-full space-y-3">
            {contactConfig?.tradingHours ? (
              contactConfig.tradingHours.map((hour, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-border/50 pb-2 text-sm last:border-0 last:pb-0"
                >
                  <span className="font-medium text-muted-foreground">{hour.label}</span>
                  <span className="font-bold text-foreground">{hour.value}</span>
                </div>
              ))
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-border/50 pb-2 text-sm">
                  <span className="font-medium text-muted-foreground">Mon - Fri</span>
                  <span className="font-bold text-foreground">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex items-center justify-between pb-2 text-sm">
                  <span className="font-medium text-muted-foreground">Sat - Sun</span>
                  <span className="font-bold text-foreground">Closed</span>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
