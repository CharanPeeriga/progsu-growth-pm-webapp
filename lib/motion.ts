import type { Variants, Transition } from "framer-motion";

export const EASE = [0.2, 0.8, 0.2, 1] as const;

export const T = {
  press: 0.12,
  hover: 0.16,
  enter: 0.22,
  modal: 0.32,
} as const;

export const spring: Transition = { type: "spring", stiffness: 260, damping: 24 };

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: T.enter, ease: EASE } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.16, ease: EASE } },
};

export const staggerParent: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.045, delayChildren: 0.04 } },
};

export const staggerChild: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: T.enter, ease: EASE } },
};

export const fadeChild: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: T.enter, ease: EASE } },
};

export const sheetVariants: Variants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: spring },
  exit:    { opacity: 0, x: 24, transition: { duration: 0.18, ease: EASE } },
};

export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.97, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: spring },
  exit:    { opacity: 0, scale: 0.98, y: 4, transition: { duration: 0.16, ease: EASE } },
};

export const toastVariants: Variants = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0, transition: { duration: T.enter, ease: EASE } },
  exit:    { opacity: 0, x: 16, transition: { duration: 0.16, ease: EASE } },
};
