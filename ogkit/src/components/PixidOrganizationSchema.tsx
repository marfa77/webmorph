import { pixidOrganizationJsonLd } from "@/lib/pixid-organization-schema";

export function PixidOrganizationSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(pixidOrganizationJsonLd),
      }}
    />
  );
}
