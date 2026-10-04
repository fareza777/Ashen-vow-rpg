import { createContext, useContext } from "react";
import type { Action, GameState } from "./engine";
export type Screen =
  | "town"
  | "dungeon"
  | "quests"
  | "character"
  | "inventory"
  | "codex"
  | "shop"
  | "menu";
export type Dialog =
  | "tutorial"
  | "settings"
  | "about"
  | "newgame"
  | "tavern"
  | "shrine"
  | "rate"
  | null;
export const GameContext = createContext<{
  game: GameState;
  act: (a: Action) => void;
  go: (s: Screen) => void;
  open: (d: Dialog) => void;
  screen: Screen;
}>(null!);
export const useGame = () => useContext(GameContext);
