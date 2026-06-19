type Props = {
  className?: string;
  size?: number;
};

export function MercadoPagoMark({ className, size = 32 }: Props) {
  return (
    <svg
      aria-label="Mercado Pago"
      className={className}
      fill="none"
      height={size}
      role="img"
      viewBox="0 0 48 48"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill="#009EE3" height="48" rx="10" width="48" />
      <path
        d="M8 30.5c0-7.5 7.2-13.5 16-13.5s16 6 16 13.5"
        stroke="#fff"
        strokeLinecap="round"
        strokeWidth="4.5"
      />
      <circle cx="24" cy="18" fill="#fff" r="4.5" />
    </svg>
  );
}
