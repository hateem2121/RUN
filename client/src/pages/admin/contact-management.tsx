import { ContactPageSettings } from "@/components/admin/contact-management";

export default function ContactManagement() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-6">
      <div className="max-w-7xl mx-auto">
        <ContactPageSettings />
      </div>
    </div>
  );
}
