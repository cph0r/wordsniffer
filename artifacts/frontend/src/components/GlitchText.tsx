import React, { useState, useEffect } from "react";

interface GlitchTextProps {
  text: string;
  className?: string;
  as?: React.ElementType;
}

export function GlitchText({ text, className = "", as: Tag = "span" }: GlitchTextProps) {
  const [display, setDisplay] = useState(text);
  const [isGlitching, setIsGlitching] = useState(true);

  useEffect(() => {
    if (!isGlitching) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setDisplay(text);
      setIsGlitching(false);
      return;
    }

    const glitchChars = "!@#$%^&*()_+-=[]{}|;:',.<>?/~`01";
    let iteration = 0;
    const maxIterations = text.length * 2;

    const interval = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((char, i) => {
            if (i < iteration / 2) return char;
            return glitchChars[Math.floor(Math.random() * glitchChars.length)];
          })
          .join("")
      );

      iteration++;
      if (iteration >= maxIterations) {
        setDisplay(text);
        setIsGlitching(false);
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [text, isGlitching]);

  return <Tag className={className}>{display}</Tag>;
}
