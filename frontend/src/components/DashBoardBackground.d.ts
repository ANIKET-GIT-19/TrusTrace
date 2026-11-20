import type { CSSProperties } from "react";

export interface DashBoardBackgroundProps {
  className?: string;
  style?: CSSProperties;
  layout?: "fill" | "block";
  paused?: boolean;
  label?: string;
}

declare function DashBoardBackground(props: DashBoardBackgroundProps): React.JSX.Element;
export default DashBoardBackground;
