import { placeTooltip, TOOLTIP_MARGIN, TOOLTIP_MAX_WIDTH } from './tooltip-position';

const SCREEN = { windowWidth: 400, windowHeight: 800, safeTop: 40, safeBottom: 20 };

describe('placeTooltip', () => {
  it('sits above the tap point, centered on it', () => {
    const place = placeTooltip({ ...SCREEN, x: 200, y: 500, height: 120 });
    expect(place.side).toBe('above');
    expect(place.width).toBe(TOOLTIP_MAX_WIDTH);
    expect(place.left).toBe(200 - TOOLTIP_MAX_WIDTH / 2);
    expect(place.top + 120).toBeLessThan(500);
  });

  it('stays inside the screen horizontally', () => {
    expect(placeTooltip({ ...SCREEN, x: 5, y: 500, height: 100 }).left).toBe(TOOLTIP_MARGIN);
    const right = placeTooltip({ ...SCREEN, x: 395, y: 500, height: 100 });
    expect(right.left + right.width).toBe(400 - TOOLTIP_MARGIN);
  });

  it('narrows on small screens', () => {
    const place = placeTooltip({ ...SCREEN, windowWidth: 320, x: 160, y: 500, height: 100 });
    expect(place.width).toBe(320 - 2 * TOOLTIP_MARGIN);
    expect(place.left).toBe(TOOLTIP_MARGIN);
  });

  it('flips below the tap point near the top of the screen', () => {
    const place = placeTooltip({ ...SCREEN, x: 200, y: 120, height: 150 });
    expect(place.side).toBe('below');
    expect(place.top).toBeGreaterThan(120);
  });

  it('never goes under the status bar or past the bottom', () => {
    const tall = placeTooltip({ ...SCREEN, x: 200, y: 100, height: 760 });
    expect(tall.top).toBe(SCREEN.safeTop + TOOLTIP_MARGIN / 2);
    const low = placeTooltip({ ...SCREEN, x: 200, y: 150, height: 700 });
    expect(low.top + 700).toBeLessThanOrEqual(800 - SCREEN.safeBottom);
  });
});
