"use client";

import { motion } from "framer-motion";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface LetterState {
  char: string;
  isMatrix: boolean;
  isSpace: boolean;
}

interface MatrixSloganTransitionProps {
  slogans: Array<{ id: number; text: string; color?: string }>;
  className?: string;
  displayDuration?: number; // How long to display each slogan
  transitionDuration?: number; // How long the matrix transition takes
  letterInterval?: number; // Delay between each letter animation
}

export const MatrixSloganTransition = memo(function MatrixSloganTransition({
  slogans,
  className,
  displayDuration = 3000,
  transitionDuration = 1500,
  letterInterval = 50,
  paused = false, // NEW: Add paused prop for performance optimization
}: MatrixSloganTransitionProps & { paused?: boolean }) {
  // SSR Safety: Initialize with first slogan if available
  const [currentIndex, setCurrentIndex] = useState(0);
  const initialText = slogans[0]?.text || "";
  const maxLen = slogans.length > 0 ? Math.max(...slogans.map((s) => s.text.length)) : 0;

  const [letters, setLetters] = useState<LetterState[]>(() => {
    if (!initialText) return [];
    const paddedText = initialText.padEnd(maxLen, " ");
    return paddedText.split("").map((char) => ({
      char,
      isMatrix: false,
      isSpace: char === " ",
    }));
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentText = slogans[currentIndex]?.text || "";
  const currentColor = slogans[currentIndex]?.color || "#00ff00";
  const maxLength = Math.max(...slogans.map((s) => s.text.length));

  // Matrix characters - mix of 0s, 1s and Japanese characters for authentic matrix effect
  const matrixChars = useMemo(
    () => [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "ｱ",
      "ｲ",
      "ｳ",
      "ｴ",
      "ｵ",
      "ｶ",
      "ｷ",
      "ｸ",
      "ｹ",
      "ｺ",
      "ｻ",
      "ｼ",
      "ｽ",
      "ｾ",
      "ｿ",
      "ﾀ",
      "ﾁ",
      "ﾂ",
      "ﾃ",
      "ﾄ",
      "ﾅ",
      "ﾆ",
      "ﾇ",
      "ﾈ",
      "ﾉ",
      "ﾊ",
      "ﾋ",
      "ﾌ",
      "ﾍ",
      "ﾎ",
      "ﾏ",
      "ﾐ",
      "ﾑ",
      "ﾒ",
      "ﾓ",
      "ﾔ",
      "ﾕ",
      "ﾖ",
      "ﾗ",
      "ﾘ",
      "ﾙ",
      "ﾚ",
      "ﾛ",
      "ﾜ",
      "ｦ",
      "ﾝ",
    ],
    [],
  );

  const getRandomMatrixChar = useCallback(() => {
    return matrixChars[Math.floor(Math.random() * matrixChars.length)];
  }, [matrixChars]);

  // Initialize letters for current text
  useEffect(() => {
    const paddedText = currentText.padEnd(maxLength, " ");
    setLetters(
      paddedText.split("").map((char) => ({
        char,
        isMatrix: false,
        isSpace: char === " ",
      })),
    );
  }, [currentText, maxLength]);

  // Transition to next slogan with matrix effect
  const transitionToNext = useCallback(() => {
    if (isTransitioning || slogans.length === 0 || paused) return;

    setIsTransitioning(true);
    const nextIndex = (currentIndex + 1) % slogans.length;
    const nextText = slogans[nextIndex]?.text || "";
    const paddedNextText = nextText.padEnd(maxLength, " ");

    // Start matrix effect - convert all letters to matrix characters
    const letterIndices = letters.map((_, index) => index).filter((i) => !letters[i]?.isSpace);

    // Randomize the order for more organic effect
    const shuffledIndices = [...letterIndices].sort(() => Math.random() - 0.5);

    // Phase 1: Convert to matrix characters
    shuffledIndices.forEach((index, i) => {
      setTimeout(() => {
        setLetters((prev) => {
          const newLetters = [...prev];
          if (index < newLetters.length && newLetters[index] && !newLetters[index].isSpace) {
            newLetters[index] = {
              ...newLetters[index]!,
              char: getRandomMatrixChar()!,
              isMatrix: true,
            };
          }
          return newLetters;
        });
      }, i * letterInterval);
    });

    // Phase 2: Convert to new text
    setTimeout(() => {
      const newLetterIndices = paddedNextText
        .split("")
        .map((_, index) => index)
        .filter((i) => paddedNextText[i] !== " ");

      const shuffledNewIndices = [...newLetterIndices].sort(() => Math.random() - 0.5);

      shuffledNewIndices.forEach((index, i) => {
        setTimeout(() => {
          setLetters((prev) => {
            const newLetters = [...prev];
            if (index < paddedNextText.length) {
              newLetters[index] = {
                char: paddedNextText[index]!,
                isMatrix: false,
                isSpace: paddedNextText[index] === " ",
              };
            }
            return newLetters;
          });
        }, i * letterInterval);
      });

      // Update current index after transition completes
      setTimeout(() => {
        setCurrentIndex(nextIndex);
        setIsTransitioning(false);
      }, shuffledNewIndices.length * letterInterval);
    }, transitionDuration / 2);
  }, [
    currentIndex,
    slogans,
    letters,
    isTransitioning,
    letterInterval,
    transitionDuration,
    getRandomMatrixChar,
    maxLength,
  ]);

  // Auto-transition effect
  useEffect(() => {
    if (slogans.length === 0) return;

    const interval = setInterval(() => {
      transitionToNext();
    }, displayDuration);

    return () => clearInterval(interval);
  }, [transitionToNext, displayDuration, slogans.length]);

  const motionVariants = useMemo(
    () => ({
      matrix: {
        color: currentColor.startsWith("#") ? currentColor : "#00ff00",
        textShadow: `0 0 10px ${
          currentColor.startsWith("#") ? currentColor : "#00ff00"
        }cc, 0 0 20px ${currentColor.startsWith("#") ? currentColor : "#00ff00"}66`,
        filter: "blur(0.5px)",
      },
      normal: {
        color: "rgba(255, 255, 255, 0.9)",
        textShadow: "0 0 20px rgba(255, 255, 255, 0.3)",
        filter: "blur(0px)",
      },
    }),
    [currentColor],
  );

  if (slogans.length === 0) return null;

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="inline-block">
        {letters.map((letter, index) => (
          <motion.span
            key={`${currentIndex}-${index}`}
            className=""
            initial="normal"
            animate={letter.isMatrix ? "matrix" : "normal"}
            variants={motionVariants}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              fontSize: "inherit",
              lineHeight: "inherit",
              fontWeight: "inherit",
              fontStyle: "inherit",
            }}
          >
            {letter.char}
          </motion.span>
        ))}
      </div>
    </div>
  );
});
