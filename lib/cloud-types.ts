/**
 * Reference notes for the cloud types collections are named after.
 *
 * These describe the cloud type, not the sequence: what the genus looks like,
 * the level it forms at and the weather it usually goes with. They are the
 * same whatever frames a collection holds, so they live here rather than in
 * the catalogue. The wording and height bands are the curator's, verbatim.
 */

export type CloudLevel = "Low" | "Mid" | "High" | "Vertical";

export interface CloudTypeInfo {
  level: CloudLevel;
  /** The height band, as shown on the badge. */
  heights: string;
  description: string;
  weather: string;
}

const LOW = "0–2,000 m";
const HIGH = "6,000–12,000 m";

const CLOUD_TYPES: Record<string, CloudTypeInfo> = {
  Cumulus: {
    level: "Low",
    heights: LOW,
    description:
      "Puffy, cotton-like clouds with flat bases and well-defined edges. Fair-weather cumulus indicate stable conditions, while towering cumulus may develop into thunderstorms.",
    weather: "Fair weather to developing showers",
  },
  Stratocumulus: {
    level: "Low",
    heights: LOW,
    description:
      "Low, lumpy cloud layer with rolling elements, often covering large portions of the sky. Usually produces no precipitation but can bring overcast conditions.",
    weather: "Overcast, occasional drizzle",
  },
  Cirrus: {
    level: "High",
    heights: HIGH,
    description:
      "Thin, wispy ice-crystal clouds at high altitudes. Often indicate fair weather but can signal approaching warm fronts or upper-level troughs.",
    weather: "Fair, possible change in 24h",
  },
  Altocumulus: {
    level: "Mid",
    heights: "2,000–6,000 m",
    description:
      'Mid-level cloud patches often arranged in rows or waves ("mackerel sky"). Can indicate atmospheric instability and potential thunderstorm development.',
    weather: "Changing conditions possible",
  },
  Cumulonimbus: {
    level: "Vertical",
    heights: "500–15,000 m",
    description:
      "Towering thunderstorm clouds with anvil-shaped tops. Produce heavy rain, lightning, hail, and occasionally tornadoes.",
    weather: "Thunderstorms, severe weather",
  },
  Stratus: {
    level: "Low",
    heights: LOW,
    description: "Uniform grey cloud layer covering the entire sky like a blanket. Often produces light drizzle or mist.",
    weather: "Overcast, light drizzle",
  },
  Nimbostratus: {
    level: "Mid",
    heights: "2,000–4,000 m",
    description:
      "Dark, thick cloud layer producing continuous moderate to heavy precipitation. Obscures the sun completely.",
    weather: "Continuous rain or snow",
  },
  Altostratus: {
    level: "Mid",
    heights: "2,000–6,000 m",
    description:
      "Translucent greyish cloud layer covering most of the sky. The sun appears as a dim disk behind the cloud.",
    weather: "Approaching precipitation",
  },
  Cirrostratus: {
    level: "High",
    heights: HIGH,
    description: "Transparent, veil-like high cloud that often produces halo phenomena around the sun or moon.",
    weather: "Fair, halo phenomena",
  },
  Cirrocumulus: {
    level: "High",
    heights: HIGH,
    description:
      'Small, white patchy clouds arranged in rows at high altitude. Often called "mackerel sky" when widespread.',
    weather: "Fair, cold air aloft",
  },
};

/** Notes for a collection's name, or undefined when it is not a cloud type. */
export function cloudTypeInfo(name: string | null | undefined): CloudTypeInfo | undefined {
  return name ? CLOUD_TYPES[name] : undefined;
}

const ORDER = Object.keys(CLOUD_TYPES);

/**
 * Collections in the cloud-type order above, with sequences of the same type
 * kept together in their original order. A collection not named after a
 * cloud type goes last.
 */
export function sortByCloudType<T extends { title: string }>(collections: readonly T[]): T[] {
  const rank = (title: string) => {
    const index = ORDER.indexOf(title);
    return index === -1 ? ORDER.length : index;
  };
  return collections
    .map((collection, index) => ({ collection, index }))
    .sort((a, b) => rank(a.collection.title) - rank(b.collection.title) || a.index - b.index)
    .map(({ collection }) => collection);
}

/** Every cloud type name, in the order above. */
export const cloudTypeNames: readonly string[] = ORDER;
