/** Canonical PixID Studio Organization JSON-LD — identical on every domain. */
export const pixidOrganizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.pixid.studio/#org",
  name: "PixID Studio",
  url: "https://www.pixid.studio/",
  founder: {
    "@type": "Person",
    name: "Pavel Veselov",
  },
  sameAs: [
    "https://www.webmorp.art/",
    "https://barakhlo.online/",
    "https://www.pixid.studio/",
    "https://prep2go.study/",
    "https://uaeproperty.vip/",
    "https://truve.online/",
    "https://bench.energy/",
    "https://pveselov.space/",
    "https://uniprep2go.study/",
    "https://sbunkov.ru/",
    "https://inoutcreator.com/",
    "https://github.com/marfa77",
  ],
} as const;
