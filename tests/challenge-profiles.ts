import { createGame, reduceGame, stats } from "../src/engine";
import { BIOMES, ITEMS, QUESTS, SKILLS } from "../src/data";
import { draughtRecovery, enemyMove, itemAct } from "../src/challenge";

export function preparedBoss(
  region: number,
  build: "Steel" | "Ember" | "Shadow",
  seed: number,
) {
  let s = createGame(
    "Trial",
    build === "Steel" ? "knight" : build === "Ember" ? "scholar" : "ranger",
  );
  s.level = region === 0 ? 3 : region === 3 ? 8 : 16;
  s.attributes[
    build === "Steel" ? "might" : build === "Ember" ? "will" : "agility"
  ] += 2 * (s.level - 1);
  s.skillPoints += s.level - 1;
  const path =
    build === "Steel"
      ? ["cleave", "vigor", "execution", "ironwill", "guardian"]
      : build === "Ember"
        ? ["mend", "reservoir", "nova", "mists", "furnace"]
        : ["drain", "precision", "eclipse", "shroud", "fortune"];
  for (const id of path) s = reduceGame(s, { type: "LEARN", id });
  for (const slot of ["weapon", "armor", "charm"] as const) {
    const score = (i: (typeof ITEMS)[number]) =>
      (i.attack ?? 0) * 3 +
      (i.defense ?? 0) * 4 +
      (i.hp ?? 0) * 0.4 +
      (i.crit ?? 0) * 0.5;
    const gear = ITEMS.filter(
      (i) => i.slot === slot && itemAct(i) <= region + 1,
    ).sort((a, b) => score(b) - score(a))[0];
    if (!s.inventory.includes(gear.id)) s.inventory.push(gear.id);
    s = reduceGame(s, { type: "EQUIP", id: gear.id });
  }
  s.hp = stats(s).maxHp;
  s.energy = stats(s).maxEnergy;
  s.potions = 6;
  s.claimed = QUESTS.filter((q) => q.type === "Main quest").map((q) => q.id);
  s.seed = seed;
  s = reduceGame(s, { type: "ENTER", biome: BIOMES[region].id });
  const boss = s.run!.nodes.find((n) => n.kind === "boss")!;
  s.run!.current = s.run!.nodes.find(
    (n) => n.row === boss.row - 1 && n.col === 1,
  )!.id;
  return reduceGame(s, { type: "MOVE", id: boss.id });
}

export function bossTrial(
  region: number,
  build: "Steel" | "Ember" | "Shadow",
  seed: number,
  reactive = true,
) {
  let s = preparedBoss(region, build, seed);
  let turns = 0,
    guards = 0,
    potions = 0,
    damage = 0;
  while (s.combat && turns < 120) {
    const move = enemyMove(s.combat);
    let action = "attack";
    if (reactive && move.index === 2) {
      action = "guard";
      guards++;
    } else if (
      s.hp < stats(s).maxHp * 0.6 &&
      s.potions &&
      !draughtRecovery(s.combat)
    ) {
      action = "potion";
      potions++;
    } else if (
      build === "Ember" &&
      s.hp < stats(s).maxHp * 0.55 &&
      s.skills.includes("mists") &&
      s.energy >= 9
    )
      action = "mists";
    else {
      const attacks =
        build === "Steel"
          ? s.combat.hp < s.combat.maxHp * 0.3
            ? ["execution", "cleave"]
            : ["cleave"]
          : build === "Ember"
            ? ["furnace", "nova", "ember"]
            : s.combat.poison
              ? ["drain", "eclipse"]
              : ["shroud", "venom"];
      action =
        attacks.find(
          (id) =>
            s.skills.includes(id) &&
            s.energy >= SKILLS.find((k) => k.id === id)!.cost,
        ) ?? (move.index === 1 && s.energy < 8 ? "focus" : "attack");
    }
    s = reduceGame(s, { type: "COMBAT", action });
    turns++;
    damage += s.battleFx?.incoming ?? 0;
  }
  return {
    won: !!s.run?.bossDefeated,
    turns,
    guards,
    potions,
    damage,
    state: s,
  };
}
