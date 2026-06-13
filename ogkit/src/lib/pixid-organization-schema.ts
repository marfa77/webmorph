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
    "https://www.barakhlo.online/",
    "https://www.pixid.studio/",
    "https://www.prep2go.study/",
    "https://uniprep2go.study/",
    "https://www.uaeproperty.vip/",
    "https://www.truve.online/",
    "https://www.bench.energy/",
    "https://pveselov.space/",
    "https://www.sbunkov.ru/",
    "https://www.inoutcreator.com/",
    "https://github.com/marfa77",
  ],
} as const;
