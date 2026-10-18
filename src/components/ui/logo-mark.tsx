import Svg, { Path } from 'react-native-svg';

type LogoMarkProps = {
  size: number;
  color: string;
};

/**
 * The Q Bank mark: a "Q" whose tail is a check mark (Figma "Brand · Logo"). The same paths render
 * the app icon PNGs in assets/images.
 */
export function LogoMark({ size, color }: LogoMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path
        d="M60.5 67A25 25 0 1 1 67 52"
        fill="none"
        stroke={color}
        strokeWidth={11}
        strokeLinecap="round"
      />
      <Path
        d="M44.5 62L55.5 73L78.5 45"
        fill="none"
        stroke={color}
        strokeWidth={11}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
