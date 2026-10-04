import {
  EXTRA_ITEMS,
  EXTRA_ENEMIES,
  CAMPAIGN_QUESTS,
  EXTRA_EVENTS,
  EXTRA_BIOMES,
  SIDE_QUESTS,
} from "./campaign";
import { CROSSINGS } from "./crossings";
export type BiomeId =
  | "catacombs"
  | "thornwild"
  | "spire"
  | "saltreach"
  | "archive"
  | "observatory"
  | "rootsea"
  | "engine";
export type OriginId = "oathkeeper" | "knight" | "scholar" | "ranger";
export type AttributeId = "might" | "will" | "agility";
export type Slot = "weapon" | "armor" | "charm";
export const ORIGINS = [
  {
    id: "oathkeeper" as OriginId,
    name: "Oathkeeper",
    epithet: "The last light",
    description:
      "A keeper of the dying flame. Balanced steel and spirit, with a gift for mending wounds.",
    art: 0,
    might: 4,
    will: 4,
    agility: 3,
    skill: "mend",
  },
  {
    id: "knight" as OriginId,
    name: "Exiled Knight",
    epithet: "Steel remembers",
    description:
      "Your order is gone. Your oath remains. Heavy armor and powerful blows keep the darkness at bay.",
    art: 1,
    might: 6,
    will: 2,
    agility: 3,
    skill: "bulwark",
  },
  {
    id: "scholar" as OriginId,
    name: "Veil Scholar",
    epithet: "Knowledge has a price",
    description:
      "You have read what should have stayed buried. Shape the ash into fire, and uncover the forbidden.",
    art: 2,
    might: 2,
    will: 7,
    agility: 2,
    skill: "ember",
  },
  {
    id: "ranger" as OriginId,
    name: "Thorn Wanderer",
    epithet: "A whisper in the wild",
    description:
      "The forest taught you to listen. Precise strikes, quick feet, and a talent for surviving unseen.",
    art: 3,
    might: 3,
    will: 3,
    agility: 5,
    skill: "venom",
  },
];
export const BIOMES = [
  {
    id: "catacombs" as BiomeId,
    name: "The Drowned Catacombs",
    subtitle: "Beneath the old sanctuary",
    description:
      "The bells have been silent for thirty years. Last night, something below the graves began to ring.",
    level: 1,
    art: 0,
    boss: "warden",
    quest: "bell",
    unlock: null,
  },
  {
    id: "thornwild" as BiomeId,
    name: "The Thornwild",
    subtitle: "Where the trees remember",
    description:
      "White moths lead the missing into the wood. The roots have begun to speak in borrowed voices.",
    level: 3,
    art: 1,
    boss: "sovereign",
    quest: "moths",
    unlock: "bell",
  },
  {
    id: "spire" as BiomeId,
    name: "The Hollow Spire",
    subtitle: "The heart of the unmaking",
    description:
      "Beyond the black canopy, the First Flame still burns. Every path ends beneath its broken crown.",
    level: 5,
    art: 2,
    boss: "heart",
    quest: "flame",
    unlock: "moths",
  },
];
export type Item = {
  id: string;
  name: string;
  slot: Slot;
  rarity: "Common" | "Uncommon" | "Rare" | "Legendary";
  attack?: number;
  defense?: number;
  hp?: number;
  energy?: number;
  crit?: number;
  price: number;
  description: string;
  icon: "sword" | "armor" | "charm";
  act?: number;
};
export const ITEMS: Item[] = [
  {
    id: "rust-sword",
    name: "Weathered Longsword",
    slot: "weapon",
    rarity: "Common",
    attack: 3,
    price: 16,
    description: "A familiar weight. An edge that has seen better days.",
    icon: "sword",
  },
  {
    id: "traveler-coat",
    name: "Wayfarer's Coat",
    slot: "armor",
    rarity: "Common",
    defense: 2,
    price: 20,
    description:
      "Waxed leather, patched a dozen times. It still keeps out the cold.",
    icon: "armor",
  },
  {
    id: "oathblade",
    name: "Oathkeeper's Blade",
    slot: "weapon",
    rarity: "Uncommon",
    attack: 7,
    price: 65,
    description:
      "Forged in the old sanctuary. It warms at the touch of a sworn hand.",
    icon: "sword",
  },
  {
    id: "iron-mail",
    name: "Watchman's Mail",
    slot: "armor",
    rarity: "Uncommon",
    defense: 4,
    hp: 8,
    price: 75,
    description: "Small iron rings, hammered together with patient hands.",
    icon: "armor",
  },
  {
    id: "cinder-ring",
    name: "Cinder Signet",
    slot: "charm",
    rarity: "Uncommon",
    energy: 6,
    price: 50,
    description: "A small ember sleeps beneath the cracked gemstone.",
    icon: "charm",
  },
  {
    id: "grave-axe",
    name: "Gravetender's Axe",
    slot: "weapon",
    rarity: "Uncommon",
    attack: 8,
    price: 85,
    description: "The haft is carved with names. None belong to the living.",
    icon: "sword",
  },
  {
    id: "oracle-staff",
    name: "Oracle's Branch",
    slot: "weapon",
    rarity: "Rare",
    attack: 10,
    energy: 8,
    price: 155,
    description: "Salt drips from the wood, though it has never seen the sea.",
    icon: "sword",
  },
  {
    id: "bellplate",
    name: "Bell Warden's Plate",
    slot: "armor",
    rarity: "Rare",
    defense: 7,
    hp: 15,
    price: 180,
    description: "The iron remembers every strike that ever rang against it.",
    icon: "armor",
  },
  {
    id: "moth-charm",
    name: "Pale Moth Pendant",
    slot: "charm",
    rarity: "Rare",
    crit: 12,
    energy: 5,
    price: 125,
    description: "Its wings move only when nobody is watching.",
    icon: "charm",
  },
  {
    id: "thorn-dagger",
    name: "Thornfang",
    slot: "weapon",
    rarity: "Rare",
    attack: 12,
    crit: 8,
    price: 170,
    description:
      "A curved edge grown, not forged. Dark sap runs along the blade.",
    icon: "sword",
  },
  {
    id: "bark-mail",
    name: "Ironbark Mantle",
    slot: "armor",
    rarity: "Rare",
    defense: 8,
    hp: 12,
    price: 185,
    description:
      "The forest offered its own skin. You have yet to learn the price.",
    icon: "armor",
  },
  {
    id: "silver-token",
    name: "Pilgrim's Token",
    slot: "charm",
    rarity: "Uncommon",
    hp: 10,
    price: 60,
    description: "A remembrance of home, polished smooth by worried fingers.",
    icon: "charm",
  },
  {
    id: "ash-cloak",
    name: "Ashweave Cloak",
    slot: "armor",
    rarity: "Uncommon",
    defense: 3,
    energy: 7,
    price: 70,
    description: "Woven with strands of shadow. Remarkably light.",
    icon: "armor",
  },
  {
    id: "sunless-edge",
    name: "Sunless Edge",
    slot: "weapon",
    rarity: "Legendary",
    attack: 19,
    crit: 10,
    price: 360,
    description: "A blade drawn from the space between two dying stars.",
    icon: "sword",
  },
  {
    id: "first-light",
    name: "The First Light",
    slot: "charm",
    rarity: "Legendary",
    hp: 18,
    energy: 12,
    price: 300,
    description: "An ember from before the world learned to be afraid.",
    icon: "charm",
  },
  {
    id: "sovereign-veil",
    name: "Sovereign's Veil",
    slot: "armor",
    rarity: "Legendary",
    defense: 11,
    energy: 10,
    price: 310,
    description:
      "Weightless silk that can turn away the last breath of winter.",
    icon: "armor",
  },
  {
    id: "iron-talisman",
    name: "Iron Votive",
    slot: "charm",
    rarity: "Common",
    hp: 5,
    price: 25,
    description: "A simple promise, cast in iron.",
    icon: "charm",
  },
  {
    id: "hunters-bow",
    name: "Hollowwood Bow",
    slot: "weapon",
    rarity: "Uncommon",
    attack: 6,
    crit: 7,
    price: 70,
    description: "Its string hums softly when danger draws near.",
    icon: "sword",
  },
];
export const itemById = (id: string) => ITEMS.find((i) => i.id === id)!;
export type Skill = {
  id: string;
  name: string;
  tree: "Steel" | "Ember" | "Shadow";
  tier: number;
  cost: number;
  description: string;
  passive?: boolean;
  icon: "sword" | "fire" | "moon" | "shield" | "heart" | "spark";
};
export const SKILLS: Skill[] = [
  {
    id: "cleave",
    name: "Sundering Strike",
    tree: "Steel",
    tier: 1,
    cost: 5,
    description:
      "Deal 150% weapon damage and ignore half of the enemy's armor.",
    icon: "sword",
  },
  {
    id: "bulwark",
    name: "Iron Resolve",
    tree: "Steel",
    tier: 1,
    cost: 4,
    description:
      "Raise a ward that absorbs the next 18 damage. Lasts until broken.",
    icon: "shield",
  },
  {
    id: "vigor",
    name: "Unbroken",
    tree: "Steel",
    tier: 2,
    cost: 0,
    description: "Permanently gain 12 maximum health.",
    passive: true,
    icon: "heart",
  },
  {
    id: "execution",
    name: "Last Rites",
    tree: "Steel",
    tier: 3,
    cost: 8,
    description:
      "Deal 155% damage; doubled when your enemy is below 30% health.",
    icon: "sword",
  },
  {
    id: "ember",
    name: "Ember Lance",
    tree: "Ember",
    tier: 1,
    cost: 5,
    description: "Deal 12 + twice your Will as fire damage. Bypasses armor.",
    icon: "fire",
  },
  {
    id: "mend",
    name: "Kindled Heart",
    tree: "Ember",
    tier: 1,
    cost: 6,
    description:
      "Restore 16 + your Will health. The enemy still takes its turn.",
    icon: "heart",
  },
  {
    id: "reservoir",
    name: "Ash Reservoir",
    tree: "Ember",
    tier: 2,
    cost: 0,
    description: "Permanently gain 10 maximum energy.",
    passive: true,
    icon: "spark",
  },
  {
    id: "nova",
    name: "The Last Flame",
    tree: "Ember",
    tier: 3,
    cost: 9,
    description: "Deal 28 + three times your Will as fire damage.",
    icon: "fire",
  },
  {
    id: "venom",
    name: "Thornblood",
    tree: "Shadow",
    tier: 1,
    cost: 4,
    description:
      "Deal normal damage and poison for 5 + 65% of your Agility damage each turn.",
    icon: "moon",
  },
  {
    id: "drain",
    name: "Borrowed Breath",
    tree: "Shadow",
    tier: 1,
    cost: 5,
    description:
      "Deal 10 + twice your Agility damage and heal for half the damage dealt.",
    icon: "heart",
  },
  {
    id: "precision",
    name: "Quietus",
    tree: "Shadow",
    tier: 2,
    cost: 0,
    description: "Permanently increase critical strike chance by 12%.",
    passive: true,
    icon: "sword",
  },
  {
    id: "eclipse",
    name: "Veilstep",
    tree: "Shadow",
    tier: 3,
    cost: 7,
    description: "Deal 200% damage and gain a ward that absorbs 12 damage.",
    icon: "moon",
  },
];
export type Enemy = {
  id: string;
  name: string;
  title: string;
  art: number;
  hp: number;
  attack: number;
  defense: number;
  xp: number;
  gold: number;
  intent: string[];
  description: string;
  boss?: boolean;
};
export const ENEMIES: Enemy[] = [
  {
    id: "revenant",
    name: "Hollow Revenant",
    title: "The oathless dead",
    art: 0,
    hp: 25,
    attack: 6,
    defense: 1,
    xp: 28,
    gold: 14,
    intent: ["Rusted slash", "Gathering strength", "Heavy blow"],
    description:
      "It still wears the watchman's badge. It no longer remembers why.",
  },
  {
    id: "stalker",
    name: "Thorn Stalker",
    title: "A hunger with roots",
    art: 1,
    hp: 40,
    attack: 9,
    defense: 3,
    xp: 42,
    gold: 20,
    intent: ["Thorn lash", "Root snare", "Rending branches"],
    description: "The trees make room for it. You suspect they are afraid.",
  },
  {
    id: "oracle",
    name: "Drowned Oracle",
    title: "The voice below",
    art: 2,
    hp: 30,
    attack: 7,
    defense: 2,
    xp: 34,
    gold: 18,
    intent: ["Cold whisper", "Gathering strength", "Veil rupture"],
    description:
      "Every prediction she ever made has come true. Except her own death.",
  },
  {
    id: "hound",
    name: "Ash Hound",
    title: "An ember that bites",
    art: 3,
    hp: 21,
    attack: 7,
    defense: 0,
    xp: 25,
    gold: 12,
    intent: ["Raking claws", "Low growl", "Ashen lunge"],
    description: "The fire took everything but its hunger.",
  },
  {
    id: "warden",
    name: "The Bell Warden",
    title: "Keeper of the drowned",
    art: 4,
    hp: 78,
    attack: 10,
    defense: 4,
    xp: 125,
    gold: 65,
    intent: ["Chain sweep", "Raising the great hammer", "Bellfall"],
    description:
      "He was told to guard the bell until the end of the world. Nobody told him the world had ended.",
    boss: true,
  },
  {
    id: "sovereign",
    name: "The Moth Sovereign",
    title: "Queen of borrowed names",
    art: 5,
    hp: 128,
    attack: 15,
    defense: 6,
    xp: 220,
    gold: 105,
    intent: ["Wing of sorrow", "Gathering the swarm", "Thousand-wing eclipse"],
    description:
      "She wears the names of all who entered her wood. There is a place for yours.",
    boss: true,
  },
  {
    id: "heart",
    name: "The Unlit Heart",
    title: "The first and final flame",
    art: 2,
    hp: 185,
    attack: 19,
    defense: 8,
    xp: 360,
    gold: 180,
    intent: ["Soul ember", "Drawing the last light", "Unmaking"],
    description:
      "At the center of the dark, a flame burns without light. It has been waiting for someone to remember.",
    boss: true,
  },
  {
    id: "veteran",
    name: "Oathless Sentinel",
    title: "A broken promise",
    art: 0,
    hp: 52,
    attack: 12,
    defense: 5,
    xp: 65,
    gold: 28,
    intent: ["Blade arc", "Gathering strength", "Oathbreaker"],
    description: "His sword has outlived the kingdom it once defended.",
  },
  {
    id: "elder",
    name: "Rootbound Elder",
    title: "The oldest hunger",
    art: 1,
    hp: 65,
    attack: 13,
    defense: 5,
    xp: 80,
    gold: 32,
    intent: ["Root strike", "Gathering strength", "Thorn eruption"],
    description: "One thousand winters. One thousand things buried beneath it.",
  },
];
export type Quest = {
  id: string;
  name: string;
  type: "Main quest" | "Side quest";
  chapter: string;
  description: string;
  objective: string;
  goal: number;
  gold: number;
  xp: number;
  reward?: string;
  requires?: string;
  biome?: BiomeId;
  objectiveKey?: string;
  scene?: { text: string; choices: Choice[] };
  conclusion?: string;
};
export const QUESTS: Quest[] = [
  {
    id: "bell",
    name: "For Whom the Bell Tolls",
    type: "Main quest",
    chapter: "Chapter I · A voice beneath",
    description:
      "Elder Maren heard the sanctuary bell ring in her sleep. Descend into the catacombs and silence whatever has awakened.",
    objective: "Defeat the Bell Warden",
    goal: 1,
    gold: 100,
    xp: 80,
    reward: "bellplate",
    biome: "catacombs",
  },
  {
    id: "moths",
    name: "The Names We Lost",
    type: "Main quest",
    chapter: "Chapter II · The hungry wood",
    description:
      "The children of Vesper's Rest have forgotten their own names. Follow the white moths into the Thornwild.",
    objective: "Defeat the Moth Sovereign",
    goal: 1,
    gold: 150,
    xp: 150,
    reward: "thorn-dagger",
    requires: "bell",
    biome: "thornwild",
  },
  {
    id: "flame",
    name: "The Last Light",
    type: "Main quest",
    chapter: "Chapter III · An ember remains",
    description:
      "The bell is silent. The names are returned. Now carry your lantern to the Hollow Spire, and decide what comes after darkness.",
    objective: "Defeat the Unlit Heart",
    goal: 1,
    gold: 250,
    xp: 250,
    reward: "first-light",
    requires: "moths",
    biome: "spire",
  },
  {
    id: "hollows",
    name: "Mercy for the Hollow",
    type: "Side quest",
    chapter: "The watchman's request",
    description:
      "Captain Oren asks you to put his lost patrol to rest. They cannot find the way home.",
    objective: "Defeat 5 creatures",
    goal: 5,
    gold: 65,
    xp: 45,
    reward: "oathblade",
  },
  {
    id: "pilgrim",
    name: "A Stranger in the Dark",
    type: "Side quest",
    chapter: "A kindness remembered",
    description:
      "Someone is living in the catacombs. The tavern keeper asks you to find them before the cold does.",
    objective: "Help the lost pilgrim",
    goal: 1,
    gold: 40,
    xp: 40,
    reward: "silver-token",
  },
  {
    id: "relics",
    name: "Fragments of Before",
    type: "Side quest",
    chapter: "The scholar's commission",
    description:
      "Archivist Sella trades coin for the relics beneath the sanctuary. Even a broken thing can tell a story.",
    objective: "Find 3 relic caches",
    goal: 3,
    gold: 70,
    xp: 60,
    reward: "cinder-ring",
  },
  {
    id: "explorer",
    name: "Where No Light Reaches",
    type: "Side quest",
    chapter: "Beyond the familiar",
    description:
      "Map the old paths so others might survive them. Ten rooms will tell us where the dark begins.",
    objective: "Explore 10 dungeon rooms",
    goal: 10,
    gold: 50,
    xp: 45,
  },
  {
    id: "shrine",
    name: "A Candle for the Missing",
    type: "Side quest",
    chapter: "The shrine keeper's vow",
    description:
      "Shrines remain beneath the city. Kindling three of them might guide the missing home.",
    objective: "Restore 3 forgotten shrines",
    goal: 3,
    gold: 75,
    xp: 65,
    reward: "ash-cloak",
  },
];
export type Choice = {
  label: string;
  hint: string;
  outcome: string;
  gold?: number;
  hp?: number;
  energy?: number;
  resolve?: number;
  reputation?: number;
  item?: string;
  quest?: string;
  requiresGold?: number;
  requiresAttribute?: { id: AttributeId; value: number };
  flag?: { key: string; value: string };
  requiresFlag?: { key: string; value: string };
  requiresReputation?: number;
  marker?: string;
  shortcut?: boolean;
};
export type StoryEvent = {
  kind?: "puzzle" | "hazard";
  id: string;
  name: string;
  eyebrow: string;
  text: string;
  art: number;
  choices: Choice[];
  biome?: BiomeId;
  marker?: string;
};
export const EVENTS: StoryEvent[] = [
  {
    id: "pilgrim",
    name: "A light in the water",
    eyebrow: "A stranger in the dark",
    text: "A figure sits at the edge of the flooded stairwell. A small candle trembles in their hands. “I was following the bells,” they say. “I think I have been following them for years.” They look at your lantern. For the first time, their eyes seem to focus.",
    art: 0,
    choices: [
      {
        label: "Share your light",
        hint: "Gain trust · +10 resolve",
        outcome:
          "You lead the pilgrim to the upper stairs. They press a silver token into your hand. “So there is still a way back.” Your kindness will be remembered.",
        resolve: 10,
        reputation: 2,
        item: "iron-talisman",
        quest: "pilgrim",
      },
      {
        label: "Ask what they have seen",
        hint: "Will 4 · uncover a secret",
        outcome:
          "The pilgrim speaks of an iron giant who counts the drowned. “He lowers his hammer before the third bell. That is when you must brace.” Their words settle into your thoughts.",
        resolve: 5,
        energy: 5,
        requiresAttribute: { id: "will", value: 4 },
      },
      {
        label: "Take the unguarded purse",
        hint: "+30 gold · lose trust",
        outcome:
          "Thirty coins. The figure looks away, and the little candle goes out. Some things cost more than they are worth.",
        gold: 30,
        reputation: -2,
        resolve: -12,
      },
    ],
  },
  {
    id: "well",
    name: "The wishing well",
    eyebrow: "Something listens below",
    text: "The well is dry, yet you hear water. Names have been scratched around its rim. At the bottom, a voice asks for something small: a coin, a memory, a promise.",
    art: 3,
    choices: [
      {
        label: "Offer ten coins",
        hint: "10 gold · receive a relic",
        outcome:
          "The coin never hits the bottom. Instead, an old signet rises on a thread of smoke. It is warm.",
        gold: -10,
        requiresGold: 10,
        item: "cinder-ring",
        quest: "relics",
      },
      {
        label: "Offer a memory",
        hint: "Lose 12 resolve · +45 gold",
        outcome:
          "You cannot remember the sound of your mother's voice. In your palm, forty-five cold coins appear.",
        resolve: -12,
        gold: 45,
      },
      {
        label: "Refuse the bargain",
        hint: "Keep your promise · +5 resolve",
        outcome:
          "“Then you are wiser than the others,” says the voice. For a moment, the silence feels kind.",
        resolve: 5,
      },
    ],
  },
  {
    id: "door",
    name: "The sealed archive",
    eyebrow: "A choice of strength or cunning",
    text: "An iron door stands beneath a crumbling arch. The old lock is still sound. Behind it, something scrapes across paper. An inscription reads: what is forgotten does not cease to be.",
    art: 3,
    choices: [
      {
        label: "Force the door",
        hint: "Might 5 · weapon cache",
        outcome:
          "The hinges give way. Inside, a soldier's axe lies beside a journal with all its pages torn out.",
        requiresAttribute: { id: "might", value: 5 },
        item: "grave-axe",
        quest: "relics",
      },
      {
        label: "Work the lock",
        hint: "Agility 4 · +35 gold",
        outcome:
          "A soft click, and the door opens. The scraping stops. You find coins arranged in a perfect circle.",
        requiresAttribute: { id: "agility", value: 4 },
        gold: 35,
        quest: "relics",
      },
      {
        label: "Listen, then walk away",
        hint: "+8 resolve",
        outcome:
          "The scraping becomes a whisper: “Thank you.” You will never know what was thanking you.",
        resolve: 8,
      },
    ],
  },
  {
    id: "moths",
    name: "A name among the roots",
    eyebrow: "The forest asks a question",
    text: "White moths gather on a moss-covered face. It is carved into a living tree. The mouth moves. “A name for passage,” it murmurs. Your own name feels suddenly heavy in your mind.",
    art: 1,
    choices: [
      {
        label: "Give a false name",
        hint: "Agility 5 · gain a charm",
        outcome:
          "“A beautiful lie,” the tree says. The moths become a pale pendant, light as a secret.",
        requiresAttribute: { id: "agility", value: 5 },
        item: "moth-charm",
        quest: "relics",
      },
      {
        label: "Speak your true name",
        hint: "Lose 15 resolve · heal 25 HP",
        outcome:
          "The forest repeats it, again and again. The name is no longer only yours. Your wounds close beneath white petals.",
        resolve: -15,
        hp: 25,
      },
      {
        label: "Offer your light instead",
        hint: "+10 resolve · gain trust",
        outcome:
          "For a moment, the face looks almost human. It parts its roots. “We had forgotten that warmth.”",
        resolve: 10,
        reputation: 2,
      },
    ],
  },
  {
    id: "altar",
    name: "The forgotten flame",
    eyebrow: "The smallest act of defiance",
    text: "A shrine lies half-buried beneath fallen stone. An empty lamp sits before it. Someone scratched a vow into the wall: when nothing remains, let us remain kind.",
    art: 3,
    choices: [
      {
        label: "Kindle the lamp",
        hint: "5 gold · +20 resolve · shrine restored",
        outcome:
          "A thin golden flame takes hold. The room grows warmer. You have kept a stranger's promise.",
        gold: -5,
        requiresGold: 5,
        resolve: 20,
        reputation: 1,
        quest: "shrine",
      },
      {
        label: "Pray in the silence",
        hint: "Restore 12 HP and 6 energy",
        outcome:
          "You do not know who is listening. For now, that does not matter. You rise with steadier hands.",
        hp: 12,
        energy: 6,
      },
      {
        label: "Search beneath the stones",
        hint: "+20 gold · lose 5 resolve",
        outcome:
          "The coins have been left by people who needed to believe. You take them anyway.",
        gold: 20,
        resolve: -5,
      },
    ],
  },
];
export const LORE: {
  id: string;
  title: string;
  text: string;
  requires?: string;
}[] = [
  {
    id: "beginning",
    title: "The Long Dimming",
    text: "The first missing street was blamed on a bad survey. The next disappeared from memory as well as stone. Vesper's Rest raised its dark wall thirty years ago; whether it is a refuge or a prison remains the town's oldest argument.",
  },
  {
    id: "vow",
    title: "The Lantern Oath",
    text: "The Oathkeepers promised to carry light wherever it was needed. They did not promise victory, nor safety, nor a return. Their oldest teaching is simple: a flame shared is a flame that survives.",
  },
  {
    id: "bells",
    title: "Those Beneath the Bell",
    text: "The sanctuary once rang a bell for every soul lost to the Dimming. When the drowned began to answer, the stairwell was sealed. The warden remained below. He is still counting.",
  },
  {
    id: "wood",
    title: "The Borrowed Forest",
    text: "The Thornwild grows where people have forgotten something precious. Each root is a memory. Each moth is a name. The sovereign of that wood does not consider herself cruel. She considers herself an archivist.",
  },
  {
    id: "spire",
    title: "The Hollow Crown",
    text: "Before the Dimming, the Hollow Spire was called the Dawnspire. Its keepers attempted to imprison the sun's last light. They succeeded. That is the tragedy.",
  },
];

ITEMS.push(...EXTRA_ITEMS);
ENEMIES.push(...EXTRA_ENEMIES);
QUESTS.splice(0, 3, ...CAMPAIGN_QUESTS);
QUESTS.push(...SIDE_QUESTS);
EVENTS.push(...EXTRA_EVENTS);
EVENTS.push(...CROSSINGS);
BIOMES[1].unlock = "testimony";
BIOMES[2].unlock = "changeling";
BIOMES.push(...EXTRA_BIOMES);
SKILLS.push(
  {
    id: "riposte",
    name: "Answering Steel",
    tree: "Steel",
    tier: 4,
    cost: 8,
    icon: "sword",
    description:
      "Deal 130% attack damage, gain 15 ward, and brace for the answering blow.",
  },
  {
    id: "earthquake",
    name: "Shattered Foundation",
    tree: "Steel",
    tier: 5,
    cost: 13,
    icon: "sword",
    description: "Deal 240% attack damage and ignore half the enemy's armor.",
  },
  {
    id: "ironwill",
    name: "Tempered Resolve",
    tree: "Steel",
    tier: 4,
    cost: 0,
    icon: "shield",
    passive: true,
    description:
      "Permanently gain 5 defense. A practiced stance turns away ordinary blows.",
  },
  {
    id: "guardian",
    name: "A Shelter That Walks",
    tree: "Steel",
    tier: 5,
    cost: 0,
    icon: "heart",
    passive: true,
    description: "Permanently gain 35 maximum health.",
  },
  {
    id: "mists",
    name: "Returning Warmth",
    tree: "Ember",
    tier: 4,
    cost: 9,
    icon: "heart",
    description: "Restore 30 + three times your Will health and gain 8 ward.",
  },
  {
    id: "furnace",
    name: "The Unburnt Verdict",
    tree: "Ember",
    tier: 5,
    cost: 15,
    icon: "fire",
    description: "Deal 44 + four times your Will damage, ignoring armor.",
  },
  {
    id: "kindle",
    name: "Gentle Embers",
    tree: "Ember",
    tier: 4,
    cost: 0,
    icon: "heart",
    passive: true,
    description: "Healing draughts restore 18 additional health.",
  },
  {
    id: "deepwell",
    name: "The Flame's Reservoir",
    tree: "Ember",
    tier: 5,
    cost: 0,
    icon: "spark",
    passive: true,
    description: "Permanently gain 25 maximum energy.",
  },
  {
    id: "step",
    name: "Between Two Shadows",
    tree: "Shadow",
    tier: 4,
    cost: 8,
    icon: "moon",
    description: "Deal 150% attack damage and gain 12 ward.",
  },
  {
    id: "shroud",
    name: "A Thorned Eclipse",
    tree: "Shadow",
    tier: 5,
    cost: 12,
    icon: "moon",
    description:
      "Deal attack + 6 damage, inflict four turns of poison, and gain 15 ward.",
  },
  {
    id: "fortune",
    name: "A Favor from the Dark",
    tree: "Shadow",
    tier: 4,
    cost: 0,
    icon: "spark",
    passive: true,
    description: "Permanently gain 10% critical chance.",
  },
  {
    id: "steady",
    name: "An Unborrowed Name",
    tree: "Shadow",
    tier: 5,
    cost: 0,
    icon: "moon",
    passive: true,
    description: "Exploring new rooms no longer drains resolve.",
  },
);

LORE.push(
  {
    id: "salt",
    title: "The Harbor That Owes the Sea",
    requires: "keeper-secret",
    text: "The Saltreach keeps its ships afloat in salt instead of water. Every crew left a debt beneath the tide. The dead admiral was appointed to collect it, but no one told him who signed the ledger.",
  },
  {
    id: "index",
    title: "The Margins Survived",
    requires: "dead-letter",
    text: "The Cinder Archive catalogued the world by what its rulers considered useful. The fire consumed the official accounts first. Disagreements, recipes, and letters written in margins have survived longer than decrees.",
  },
  {
    id: "mirror",
    title: "An Unchanging Sky",
    requires: "third-author",
    text: "The observatory can preserve a perfect day by repeating it. Its reflected inhabitants cannot age, leave, or change their minds. Some call it mercy. A door remains meaningful only while someone may choose to use it.",
  },
  {
    id: "shore",
    title: "Where the Ordinary Days Go",
    requires: "reflection",
    text: "The Rootsea holds memories too small for monuments: bread cooling, wet shoes by a door, supper delayed. Its shores survive because someone is still waiting there. The sea is strongest around days that were shared.",
  },
  {
    id: "machine",
    title: "The Custodian's Last Duty",
    requires: "borrowed-heart",
    text: "The Dawn Engine was built to restore a world without errors. It learned to remove whatever did not fit its model. Its Custodian guards a decision its architects refused to make: whether a morning must be perfect to deserve to happen.",
  },
);
