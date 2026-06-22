type LogoMarkProps = {
  className?: string;
};

export function LogoMark({ className }: LogoMarkProps) {
  return <img alt="" aria-hidden="true" className={className} src="/app-icon.png" />;
}
