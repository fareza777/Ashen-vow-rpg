import { useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import { useGame } from "./context";
import type { Choice } from "./data";
import { choiceAvailable, choiceRequirement } from "./engine";
import { narrativePages } from "./dungeonPresentation";
import { Art, Button } from "./ui";
export function NarrativeReader({
  story: event,
  embedded = false,
  onConfirm,
  onBlocked,
}: {
  story: {
    name: string;
    eyebrow: string;
    text: string;
    art?: number;
    artSheet?: "dungeons" | "chapter-scenes";
    choices: Choice[];
  };
  embedded?: boolean;
  onConfirm: (choice: number) => void;
  onBlocked?: () => void;
}) {
  const { game } = useGame();
  const [pageWords] = useState(() =>
    embedded ? (window.innerHeight < 700 ? 24 : 38) : 46,
  );
  const pages = narrativePages(event.text, pageWords);
  const [page, setPage] = useState(0);
  const [choosing, setChoosing] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const allBlocked = event.choices.every((c) => !choiceAvailable(game, c));
  return (
    <section
      className={`event-reader ${embedded ? "embedded-reader" : ""} ${choosing ? "reading-choices" : "reading-story"}`}
    >
      {!choosing && (
        <div className="reader-art">
          <Art
            sheet={event.artSheet ?? "dungeons"}
            index={event.art}
            label={event.name}
          />
          <div className="story-shade" />
        </div>
      )}
      {!embedded && (
        <header className="reader-heading">
          <span className="eyebrow">
            {choosing ? "YOUR DECISION" : event.eyebrow}
          </span>
          <h2>{event.name}</h2>
        </header>
      )}
      <div className="reader-scroll" key={choosing ? "choices" : page}>
        {choosing ? (
          <div className="reader-choices">
            {event.choices.map((c, i) => {
              const blocked = !choiceAvailable(game, c);
              return (
                <button
                  key={i}
                  className={`reader-choice ${selected === i ? "selected" : ""}`}
                  aria-pressed={selected === i}
                  disabled={blocked}
                  onClick={() => setSelected(i)}
                >
                  <span className="choice-number">{["I", "II", "III"][i]}</span>
                  <div>
                    <strong>{c.label}</strong>
                    <span>
                      {c.hint}
                      {blocked ? ` · ${choiceRequirement(game, c)}` : ""}
                    </span>
                  </div>
                  {selected === i && <CheckIcon size={19} />}
                </button>
              );
            })}
            {allBlocked && (
              <p className="muted">
                You need more supplies or training before you can answer. Return
                to town and prepare.
              </p>
            )}
          </div>
        ) : (
          <p className="story-text">{pages[page]}</p>
        )}
      </div>
      <footer className="reader-footer">
        <div className="reader-progress">
          <button
            className="text-button"
            disabled={!choosing && page === 0}
            onClick={() => (choosing ? setChoosing(false) : setPage(page - 1))}
          >
            <ArrowLeftIcon size={18} />
            {choosing ? "Read again" : "Previous"}
          </button>
          <span>
            {choosing
              ? "Choose, then confirm"
              : `${page + 1} / ${pages.length}`}
          </span>
        </div>
        {choosing ? (
          <Button
            disabled={
              (allBlocked && !onBlocked) ||
              (!allBlocked &&
                (selected === null ||
                  !choiceAvailable(game, event.choices[selected])))
            }
            onClick={() =>
              allBlocked
                ? onBlocked?.()
                : selected !== null && onConfirm(selected)
            }
          >
            {allBlocked
              ? onBlocked
                ? "Return to town"
                : "No available choices"
              : "Confirm choice"}
            <CheckIcon size={20} />
          </Button>
        ) : (
          <Button
            onClick={() =>
              page < pages.length - 1 ? setPage(page + 1) : setChoosing(true)
            }
          >
            {page < pages.length - 1 ? "Continue" : "Choose your answer"}
            <ArrowRightIcon size={20} />
          </Button>
        )}
      </footer>
    </section>
  );
}
