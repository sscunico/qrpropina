import { Info } from "lucide-react";

type Props = {
  text: string;
  position?: "top" | "bottom" | "left" | "right";
};

export function InfoTooltip({ text, position = "top" }: Props) {
  return (
    <span className={`info-tooltip info-tooltip--${position}`} aria-label={text}>
      <Info size={14} />
      <span className="info-tooltip__content" role="tooltip">{text}</span>
    </span>
  );
}
