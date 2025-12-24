import { ContactPageSettings } from "@/components/admin/contact-management";

export default function ContactManagement() {
  return (
    <div className="min-h-screen bg-neutral-50 p-6 dark:bg-neutral-900">
      <div className="mx-auto max-w-7xl">
        <ContactPageSettings />
      </div>
    </div>
  );
}
