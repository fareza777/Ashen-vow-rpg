import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRightIcon,
  SwordIcon,
  ShieldIcon,
  FireIcon,
  HeartIcon,
  MoonIcon,
  SparkleIcon,
  CoinsIcon,
  XIcon,
  ScrollIcon,
  SkullIcon,
  TreasureChestIcon,
  DoorOpenIcon,
  MapPinIcon,
  CampfireIcon,
  FootprintsIcon,
} from "@phosphor-icons/react";
import type { DungeonNode } from "./engine";
import { ITEMS } from "./data";
import type { Item } from "./data";
export function Art({
  sheet = "dungeons",
  index = 0,
  className = "",
  style = {},
  label,
}: {
  sheet?:
    | "dungeons"
    | "characters"
    | "enemies"
    | "regions-expanded"
    | "enemies-expanded"
    | "story-pages"
    | "chapter-scenes"
    | "equipment-weapons"
    | "equipment-armor"
    | "equipment-charms";
  index?: number;
  className?: string;
  style?: CSSProperties;
  label?: string;
}) {
  if (sheet === "dungeons" && index >= 4) {
    sheet = "regions-expanded";
    index -= 4;
  }
  if (sheet === "enemies" && index >= 6) {
    sheet = "enemies-expanded";
    index -= 6;
  }
  const cols =
    sheet.startsWith("equipment-") || sheet === "story-pages"
      ? 4
      : sheet.includes("enemies") || sheet === "regions-expanded"
        ? 3
        : 2;
  const rows = sheet.startsWith("equipment-")
    ? 4
    : sheet === "chapter-scenes"
      ? 4
      : sheet === "enemies-expanded"
        ? 3
        : 2;
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      className={`art ${className}`}
      style={{
        backgroundImage: `url(/art/${sheet}.png)`,
        backgroundSize: `${cols * 100}% ${rows * 100}%`,
        backgroundPosition: `${((index % cols) / (cols - 1)) * 100}% ${(Math.floor(index / cols) / (rows - 1)) * 100}%`,
        ...style,
      }}
    />
  );
}
export function ItemArt({
  item,
  className = "",
}: {
  item: Item;
  className?: string;
}) {
  return (
    <Art
      sheet={
        item.slot === "weapon"
          ? "equipment-weapons"
          : item.slot === "armor"
            ? "equipment-armor"
            : "equipment-charms"
      }
      index={ITEMS.filter((i) => i.slot === item.slot).findIndex(
        (i) => i.id === item.id,
      )}
      className={`equipment-art ${className}`}
      label={item.name}
    />
  );
}
export function Button({
  children,
  onClick,
  disabled = false,
  kind = "primary",
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  kind?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`button ${kind} ${className}`}
    >
      {children}
    </button>
  );
}
export function SectionTitle({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}
export function Bar({
  label,
  value,
  max,
  color = "gold",
  icon,
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
  icon?: ReactNode;
}) {
  const ratio = Math.max(0, Math.min(1, value / max));
  const previous = useRef(ratio);
  const [trail, setTrail] = useState(ratio);
  useEffect(() => {
    setTrail(Math.max(previous.current, ratio));
    previous.current = ratio;
    const timer = setTimeout(() => setTrail(ratio), 580);
    return () => clearTimeout(timer);
  }, [ratio]);
  return (
    <div className={`stat-bar ${color}`}>
      <div>
        <span>
          {icon}
          {label}
        </span>
        <strong>
          {value}
          <small> / {max}</small>
        </strong>
      </div>
      <div
        className="bar-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.max(0, value)}
      >
        <b className="bar-trail" style={{ transform: `scaleX(${trail})` }} />
        <i
          style={{
            transform: `scaleX(${ratio})`,
          }}
        />
      </div>
    </div>
  );
}
export function Badge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`badge ${className}`}>{children}</span>;
}
export function Gold({ amount }: { amount: number }) {
  return (
    <span className="gold-value">
      <CoinsIcon size={16} />
      {amount.toLocaleString()}
    </span>
  );
}
export function Arrow() {
  return <ArrowRightIcon size={18} />;
}
export const skillIcons = {
  sword: SwordIcon,
  shield: ShieldIcon,
  fire: FireIcon,
  heart: HeartIcon,
  moon: MoonIcon,
  spark: SparkleIcon,
};
export const itemIcons = {
  sword: SwordIcon,
  armor: ShieldIcon,
  charm: SparkleIcon,
};
export const nodeIcons: Record<DungeonNode["kind"], typeof SwordIcon> = {
  puzzle: DoorOpenIcon,
  hazard: SkullIcon,
  fight: SwordIcon,
  event: ScrollIcon,
  loot: TreasureChestIcon,
  camp: CampfireIcon,
  boss: SkullIcon,
  exit: DoorOpenIcon,
  entrance: FootprintsIcon,
};
export function OrnamentalDivider() {
  return (
    <div className="ornamental-divider">
      <span />
      <SparkleIcon size={13} weight="thin" />
      <span />
    </div>
  );
}
export function EmptyState({
  icon = <MapPinIcon size={35} weight="thin" />,
  title,
  children,
}: {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon}
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function Modal({
  title,
  eyebrow,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  useEffect(() => {
    const back = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") back(event);
    };
    window.addEventListener("ashen-back", back);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("ashen-back", back);
      window.removeEventListener("keydown", escape);
    };
  }, [onClose]);
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="icon-button modal-close"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <XIcon size={22} />
        </button>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {children}
      </section>
    </div>,
    document.body,
  );
}
