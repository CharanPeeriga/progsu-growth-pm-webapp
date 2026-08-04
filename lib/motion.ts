// Motion tokens. These are plain numbers/strings consumed by CSS transitions —
// the framer-motion variant objects that used to live here are gone along with
// the library itself; animation is now done in globals.css.

export const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

/** durations in seconds (multiply by 1000 for CSS ms) */
export const T = {
  press: 0.12,
  hover: 0.16,
  enter: 0.22,
  modal: 0.32,
} as const;
