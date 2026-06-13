type LogoMarkProps = {
  className?: string;
};

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill="currentColor" height="11" rx="2.5" width="11" x="8" y="8" />
      <rect fill="#101828" height="3.5" rx="1" width="3.5" x="11.75" y="11.75" />
      <rect fill="currentColor" height="11" rx="2.5" width="11" x="29" y="8" />
      <rect fill="#101828" height="3.5" rx="1" width="3.5" x="32.75" y="11.75" />
      <rect fill="currentColor" height="11" rx="2.5" width="11" x="8" y="29" />
      <rect fill="#101828" height="3.5" rx="1" width="3.5" x="11.75" y="32.75" />

      <rect fill="currentColor" height="4" rx="1" width="4" x="22" y="8" />
      <rect fill="currentColor" height="4" rx="1" width="4" x="22" y="15" />
      <rect fill="currentColor" height="4" rx="1" width="4" x="8" y="22" />
      <rect fill="currentColor" height="4" rx="1" width="4" x="15" y="22" />
      <rect fill="currentColor" height="4" rx="1" width="4" x="36" y="22" />
      <rect fill="currentColor" height="4" rx="1" width="4" x="29" y="29" />
      <rect fill="currentColor" height="4" rx="1" width="4" x="36" y="36" />
      <rect fill="currentColor" height="4" rx="1" width="4" x="29" y="38" />

      <path
        d="M24 36.5s-8.5-4.7-8.5-10.3c0-3 2-5.1 4.7-5.1 1.6 0 3 .8 3.8 2.1.8-1.3 2.2-2.1 3.8-2.1 2.7 0 4.7 2.1 4.7 5.1 0 5.6-8.5 10.3-8.5 10.3Z"
        fill="#ff6b6b"
      />
      <path
        d="M20.4 24.7c.9 0 1.6.5 2.2 1.3l1.4 2 1.4-2c.6-.8 1.3-1.3 2.2-1.3"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}
