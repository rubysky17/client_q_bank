/** Where the term tooltip goes on screen (pure). Coordinates are window points (`pageX/pageY`). */

/** Distance kept from the screen edges. */
export const TOOLTIP_MARGIN = 16;
export const TOOLTIP_MAX_WIDTH = 340;
/** From the tap point to the bubble: about half a line of text plus a gap. */
const GAP_ABOVE = 14;
const GAP_BELOW = 22;

type PlaceInput = {
  /** Tap point. */
  x: number;
  y: number;
  /** Bubble height, once measured. */
  height: number;
  windowWidth: number;
  windowHeight: number;
  /** Safe area (status bar, gesture bar). */
  safeTop: number;
  safeBottom: number;
};

export type TooltipPlacement = {
  left: number;
  top: number;
  width: number;
  /** `above`: the bubble ends over the tap point; `below`: it starts under it. */
  side: 'above' | 'below';
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Above the tap point, centered on it and kept inside the screen; below it when there is no room
 * above (near the top of the screen).
 */
export function placeTooltip({
  x,
  y,
  height,
  windowWidth,
  windowHeight,
  safeTop,
  safeBottom,
}: PlaceInput): TooltipPlacement {
  const width = Math.max(0, Math.min(windowWidth - 2 * TOOLTIP_MARGIN, TOOLTIP_MAX_WIDTH));
  const left = clamp(x - width / 2, TOOLTIP_MARGIN, windowWidth - TOOLTIP_MARGIN - width);
  const minTop = safeTop + TOOLTIP_MARGIN / 2;
  const maxTop = Math.max(minTop, windowHeight - safeBottom - TOOLTIP_MARGIN / 2 - height);

  const aboveTop = y - GAP_ABOVE - height;
  if (aboveTop >= minTop) return { left, top: aboveTop, width, side: 'above' };
  return { left, top: clamp(y + GAP_BELOW, minTop, maxTop), width, side: 'below' };
}
