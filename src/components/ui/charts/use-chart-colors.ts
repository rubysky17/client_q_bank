import { useThemeColor } from 'heroui-native';
import { useCSSVariable } from 'uniwind';

const SERIES_VARIABLES = [
  '--color-chart-1',
  '--color-chart-2',
  '--color-chart-3',
  '--color-chart-4',
  '--color-chart-5',
] as const;

/** Categorical colors for chart series (global.css `--chart-N`), resolved for the current theme. */
export function useSeriesColors(): string[] {
  const fallback = useThemeColor('accent');
  return useCSSVariable([...SERIES_VARIABLES]).map((color) =>
    typeof color === 'string' ? color : fallback,
  );
}

/** Answer outcome colors, matching the `bg-success` / `bg-danger` / `bg-muted` bars. */
export function useOutcomeColors() {
  const [correct, wrong, unanswered] = useThemeColor(['success', 'danger', 'muted']);
  return { correct, wrong, unanswered };
}
