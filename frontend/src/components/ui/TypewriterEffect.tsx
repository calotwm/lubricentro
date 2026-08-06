import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook that cycles through phrases, typing and deleting each one character
 * by character, looping forever. Returns the current partial string.
 */
export function useTypewriter(
  phrases: string[],
  typeSpeed = 60,
  deleteSpeed = 35,
  pauseMs = 2000,
): string {
  const [displayText, setDisplayText] = useState("");
  const stateRef = useRef({
    phraseIndex: 0,
    charIndex: 0,
    isDeleting: false,
  });

  const tick = useCallback(() => {
    const { phraseIndex, charIndex, isDeleting } = stateRef.current;
    if (!phrases.length) return;

    const currentPhrase = phrases[phraseIndex];
    if (!currentPhrase) return;

    if (!isDeleting) {
      const next = currentPhrase.substring(0, charIndex + 1);
      setDisplayText(next);
      stateRef.current.charIndex = charIndex + 1;

      if (charIndex + 1 === currentPhrase.length) {
        stateRef.current.isDeleting = true;
        return pauseMs;
      }
      return typeSpeed;
    }

    const next = currentPhrase.substring(0, Math.max(0, charIndex - 1));
    setDisplayText(next);
    stateRef.current.charIndex = charIndex - 1;

    if (charIndex - 1 === 0) {
      stateRef.current.isDeleting = false;
      stateRef.current.phraseIndex = (phraseIndex + 1) % phrases.length;
      return 300;
    }
    return deleteSpeed;
  }, [phrases, typeSpeed, deleteSpeed, pauseMs]);

  useEffect(() => {
    if (!phrases.length) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const schedule = () => {
      const delay = tick();
      if (delay === undefined) return;
      timeoutId = setTimeout(() => {
        if (!cancelled) {
          schedule();
        }
      }, delay);
    };

    schedule();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [tick, phrases]);

  return displayText;
}

interface TypewriterPlaceholderProps {
  phrases: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  type?: string;
  id?: string;
}

/**
 * A search input wrapper where the animated typewriter text shows as the
 * placeholder with a blinking red cursor. The input is fully functional —
 * when the user focuses/types, the real value shows; the animated placeholder
 * only shows while the input is empty.
 */
export function TypewriterPlaceholder({
  phrases,
  value,
  onChange,
  className = "",
  type = "text",
  id,
}: TypewriterPlaceholderProps) {
  const animatedText = useTypewriter(phrases);
  const isEmpty = value.length === 0;

  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${className} ${isEmpty ? "bg-transparent" : ""}`}
        placeholder=""
        id={id}
      />
      {isEmpty && (
        <span
          className="pointer-events-none absolute left-0 top-0 flex h-full items-center px-3 text-sm text-[rgba(255,255,255,0.28)]"
          aria-hidden="true"
        >
          <span>{animatedText}</span>
          <span className="ml-0.5 inline-block h-4 w-[2px] bg-[#dc2626] animate-blink" />
        </span>
      )}
    </div>
  );
}
