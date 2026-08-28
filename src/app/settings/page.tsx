import { DomainsSettings } from "@/components/DomainsSettings";
import { IdolsSettings } from "@/components/IdolsSettings";
import { ProfilesSettings } from "@/components/ProfilesSettings";
import { ExportData } from "@/components/ExportData";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-md px-4 pt-8">
      <h1 className="text-xl font-bold tracking-tight">Réglages</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Gère tes domaines de suivi et ton Hall of Fame.
      </p>

      <div className="mt-6">
        <DomainsSettings />
      </div>

      <IdolsSettings />
      <ExportData />
      <ProfilesSettings />
    </div>
  );
}
