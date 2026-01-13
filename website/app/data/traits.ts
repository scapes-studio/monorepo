export type TraitCategory =
  | "Atmosphere"
  | "Sky"
  | "Celestial"
  | "Planet"
  | "Topology"
  | "City"
  | "Fluid"
  | "Landscape"
  | "Surface"
  | "Trees"
  | "Buildings"
  | "Monuments"
  | "Cars"
  | "Portals"
  | "Rocketry"
  | "Animals"

export type TraitGroup = {
  name: TraitCategory
  values: string[]
}

export type TraitCounts = Record<
  TraitCategory,
  {
    count: number
    values: Record<string, number>
  }
>

export const TRAITS: TraitGroup[] = [
  {
    name: "Atmosphere",
    values: [
      "Blue",
      "Bright",
      "Dark Night",
      "Dawn",
      "Dusk",
      "Dust",
      "Jungle",
      "Morning",
      "Red Light",
      "Soul",
    ],
  },
  {
    name: "Sky",
    values: [
      "Dark Stripes",
      "Ether",
      "Falling Stars",
      "Meteors",
      "Orange Trails",
      "Red Stripes",
      "Simmering Light",
      "Soul Light",
    ],
  },
  {
    name: "Celestial",
    values: [
      "Big Shades",
      "Blue Planet",
      "Earths",
      "Evening Clouds",
      "Happy Clouds",
      "Jupiter",
      "Jupiter and his Moon",
      "Prism Sun",
      "Soul Meteors",
      "Soul Planet",
      "Sunset",
    ],
  },
  {
    name: "Planet",
    values: ["Earth", "Europa", "Mars", "Moon"],
  },
  {
    name: "Topology",
    values: [
      "Blocks",
      "Crater",
      "Desert",
      "Forest",
      "Glacier",
      "Hills",
      "Mountain",
      "Volcano",
    ],
  },
  {
    name: "City",
    values: [
      "Daytime Skyscrapers",
      "Lighted Skyscrapers",
      "Old Town",
      "Sleeping Skyscrapers",
    ],
  },
  {
    name: "Fluid",
    values: ["Golden Sea", "Lake", "Ocean", "Toxic River"],
  },
  {
    name: "Landscape",
    values: ["Beach", "Hill", "Island", "Lowland", "Valley"],
  },
  {
    name: "Surface",
    values: ["Gravel", "Meadow", "Sand", "Shrubs"],
  },
  {
    name: "Trees",
    values: [
      "Block Tree",
      "Broadleaf",
      "Burned Tree",
      "Old Tree",
      "Palm",
      "Oasis",
      "Red Oak",
      "Small Forest",
      "Tree of Life",
    ],
  },
  {
    name: "Buildings",
    values: [
      "Big Ben",
      "Burj",
      "Chinese Gate",
      "Colosseum",
      "Hut",
      "Lighthouse",
      "Mansion Lvl 1",
      "Mansion Lvl 2",
      "Mansion Lvl 3",
      "Mansion Lvl 4",
      "Mansion Lvl 5",
      "Mini House",
      "Old House",
      "Pyramid",
      "Temple",
      "Tiny House",
      "Windmill",
    ],
  },
  {
    name: "Monuments",
    values: [
      "Bitcoin",
      "Bitcoin and Ethereum",
      "Ethereum",
      "Pillars",
      "Skull",
      "Statue of Liberty",
    ],
  },
  {
    name: "Cars",
    values: [
      "Cyber Truck",
      "Delivery Van",
      "Pickup",
      "Police Car",
      "Sedan",
      "Sherp",
      "Sportscar",
    ],
  },
  {
    name: "Portals",
    values: ["Beams", "Round Portal", "Square Portal"],
  },
  {
    name: "Rocketry",
    values: ["BFR", "Saturn V", "Shuttle", "Spacelab", "UFO"],
  },
  {
    name: "Animals",
    values: ["Fox", "Unicorn"],
  },
]

export const SCAPE_TRAIT_COUNTS: TraitCounts = {
  Animals: {
    values: {
      Unicorn: 93,
      Fox: 75,
    },
    count: 168,
  },
  Atmosphere: {
    values: {
      Dusk: 1950,
      Blue: 1593,
      "Red Light": 1353,
      Jungle: 1188,
      Dawn: 1027,
      Dust: 902,
      Morning: 835,
      "Dark Night": 589,
      Bright: 510,
      Soul: 53,
    },
    count: 10000,
  },
  Buildings: {
    values: {
      "Mansion Lvl 1": 359,
      "Tiny House": 305,
      "Old House": 291,
      "Mansion Lvl 2": 290,
      Windmill: 289,
      "Mansion Lvl 3": 219,
      Hut: 212,
      "Mini House": 196,
      Lighthouse: 192,
      "Mansion Lvl 4": 184,
      Burj: 184,
      "Big Ben": 153,
      "Mansion Lvl 5": 153,
      Temple: 120,
      Pyramid: 84,
      "Chinese Gate": 76,
      Colosseum: 66,
    },
    count: 3373,
  },
  Cars: {
    values: {
      Sedan: 208,
      "Delivery Van": 136,
      Sportscar: 109,
      Sherp: 102,
      "Police Car": 100,
      Pickup: 91,
      "Cyber Truck": 50,
    },
    count: 796,
  },
  Celestial: {
    values: {
      "Big Shades": 1277,
      Sunset: 1249,
      "Happy Clouds": 1142,
      "Prism Sun": 1032,
      "Blue Planet": 1019,
      Jupiter: 736,
      "Evening Clouds": 521,
      Earths: 124,
      "Soul Meteors": 103,
      "Jupiter and his Moon": 74,
      "Soul Planet": 63,
    },
    count: 7340,
  },
  City: {
    values: {
      "Daytime Skyscrapers": 973,
      "Sleeping Skyscrapers": 744,
      "Lighted Skyscrapers": 563,
      "Old Town": 93,
    },
    count: 2373,
  },
  Fluid: {
    values: {
      Ocean: 800,
      Lake: 499,
      "Golden Sea": 419,
      "Toxic River": 289,
    },
    count: 2007,
  },
  Landscape: {
    values: {
      Lowland: 1259,
      Hill: 1081,
      Valley: 561,
      Island: 77,
      Beach: 75,
    },
    count: 3053,
  },
  Monuments: {
    values: {
      Skull: 421,
      "Statue of Liberty": 300,
      Bitcoin: 178,
      Ethereum: 177,
      "Bitcoin and Ethereum": 70,
      Pillars: 38,
    },
    count: 1184,
  },
  Planet: {
    values: {
      Earth: 2884,
      Moon: 1449,
      Mars: 1140,
      Europa: 288,
    },
    count: 5761,
  },
  Portals: {
    values: {
      "Round Portal": 176,
      "Square Portal": 82,
      Beams: 62,
    },
    count: 320,
  },
  Rocketry: {
    values: {
      "Saturn V": 256,
      Spacelab: 228,
      UFO: 199,
      Shuttle: 179,
      BFR: 176,
    },
    count: 1038,
  },
  Sky: {
    values: {
      "Dark Stripes": 2834,
      "Red Stripes": 2026,
      "Orange Trails": 1480,
      "Simmering Light": 1023,
      Meteors: 872,
      "Falling Stars": 580,
      Ether: 68,
      "Soul Light": 50,
    },
    count: 8933,
  },
  Surface: {
    values: {
      Meadow: 1502,
      Shrubs: 964,
      Sand: 304,
      Gravel: 283,
    },
    count: 3053,
  },
  Topology: {
    values: {
      Mountain: 2102,
      Hills: 1114,
      Crater: 989,
      Forest: 599,
      Glacier: 437,
      Desert: 289,
      Volcano: 120,
      Blocks: 111,
    },
    count: 5761,
  },
  Trees: {
    values: {
      "Red Oak": 658,
      Broadleaf: 479,
      "Small Forest": 339,
      Palm: 143,
      "Old Tree": 135,
      Oasis: 90,
      "Burned Tree": 69,
      "Block Tree": 54,
      "Tree of Life": 49,
    },
    count: 2016,
  },
}

export const getTraitIconUrl = (category: string, value: string): string =>
  `https://cdn.scapes.xyz/scapes/base_traits/${category}/${value}.png`
