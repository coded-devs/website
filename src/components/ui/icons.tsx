import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Shared wrapper for outline-style icons. Keeps the stroke attributes in one
 * place so every icon renders at a consistent weight and inherits text colour.
 */
function StrokeIcon({
  children,
  ...props
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Brand and social marks                                                      */
/* -------------------------------------------------------------------------- */

export function GithubIcon(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2C6.48 2 2 6.58 2 12.24c0 4.51 2.87 8.34 6.84 9.7.5.1.68-.22.68-.49v-1.9c-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.56 2.35 1.11 2.92.85.09-.67.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.05 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.32 9.32 0 0 1 12 6.95c.85 0 1.7.12 2.5.34 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.92-2.34 4.79-4.57 5.04.36.32.68.95.68 1.91v2.8c0 .27.18.59.69.49A10.13 10.13 0 0 0 22 12.24C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.9 10.47 21.35 2h-1.76l-6.47 7.35L7.95 2H2l7.82 11.12L2 22h1.76l6.84-7.77L16.05 22H22l-8.1-11.53Zm-2.42 2.75-.8-1.11L4.38 3.3h2.72l5.08 7.1.79 1.11 6.62 9.27h-2.72l-5.39-7.56Z" />
    </svg>
  );
}

export function TiktokIcon(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M16.61 3c.35 2.35 1.66 3.75 3.89 3.9v3.03a6.85 6.85 0 0 1-3.83-1.17v5.73c0 2.9-1.72 5.51-4.68 6.32-4.69 1.28-8.77-2.39-8.04-7.09.48-3.1 3.23-5.32 6.38-5.2v3.21a2.74 2.74 0 0 0-2.87 3.6 2.73 2.73 0 0 0 5.24-.97V3h3.91Z" />
    </svg>
  );
}

export function YoutubeIcon(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M21.58 7.18a2.74 2.74 0 0 0-1.93-1.94C17.95 4.78 12 4.78 12 4.78s-5.95 0-7.65.46a2.74 2.74 0 0 0-1.93 1.94A28.63 28.63 0 0 0 2 12a28.63 28.63 0 0 0 .42 4.82 2.74 2.74 0 0 0 1.93 1.94c1.7.46 7.65.46 7.65.46s5.95 0 7.65-.46a2.74 2.74 0 0 0 1.93-1.94A28.63 28.63 0 0 0 22 12a28.63 28.63 0 0 0-.42-4.82ZM10 15.2V8.8l5.2 3.2L10 15.2Z" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 2A3.75 3.75 0 0 0 4 7.75v8.5A3.75 3.75 0 0 0 7.75 20h8.5A3.75 3.75 0 0 0 20 16.25v-8.5A3.75 3.75 0 0 0 16.25 4h-8.5ZM12 7.25A4.75 4.75 0 1 1 12 16.75 4.75 4.75 0 0 1 12 7.25Zm0 2A2.75 2.75 0 1 0 12 14.75 2.75 2.75 0 0 0 12 9.25Zm5-2.45a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" />
    </svg>
  );
}

export function LinkedinIcon(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6.94 8.98H3.72v10.3h3.22V8.98ZM5.33 4.86c-1.03 0-1.87.84-1.87 1.87s.84 1.87 1.87 1.87 1.87-.84 1.87-1.87-.84-1.87-1.87-1.87Zm13.95 8.77c0-3.05-1.63-4.46-3.8-4.46-1.75 0-2.54.96-2.97 1.64V8.98H9.42v10.3h3.22v-5.1c0-1.35.26-2.66 1.93-2.66 1.65 0 1.67 1.54 1.67 2.75v5h3.04v-5.64Z" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Interface icons                                                             */
/* -------------------------------------------------------------------------- */

export function ArrowLeftIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </StrokeIcon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </StrokeIcon>
  );
}

export function BrainCircuitIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M9 13a4.5 4.5 0 0 0 3-4" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M12 13h4" />
      <path d="M12 18h6a2 2 0 0 1 2 2v1" />
      <path d="M12 8h8" />
      <path d="M16 8V5a2 2 0 0 1 2-2" />
      <circle cx="16" cy="13" r=".5" />
      <circle cx="18" cy="3" r=".5" />
      <circle cx="20" cy="21" r=".5" />
      <circle cx="20" cy="8" r=".5" />
    </StrokeIcon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </StrokeIcon>
  );
}

export function CreditCardIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </StrokeIcon>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </StrokeIcon>
  );
}

export function FileTextIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </StrokeIcon>
  );
}

export function LayoutDashboardIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </StrokeIcon>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </StrokeIcon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </StrokeIcon>
  );
}

export function NetworkIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="16" y="16" width="6" height="6" rx="1" />
      <rect x="2" y="16" width="6" height="6" rx="1" />
      <rect x="9" y="2" width="6" height="6" rx="1" />
      <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
      <path d="M12 12V8" />
    </StrokeIcon>
  );
}

export function PackageIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </StrokeIcon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </StrokeIcon>
  );
}

export function ShoppingBagIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </StrokeIcon>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </StrokeIcon>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </StrokeIcon>
  );
}

export function UsersRoundIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M18 21a8 8 0 0 0-16 0" />
      <circle cx="10" cy="8" r="5" />
      <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
    </StrokeIcon>
  );
}

/* -------------------------------------------------------------------------- */
/* Recognition placement medals                                                */
/* -------------------------------------------------------------------------- */

/** Single glyph for every recognition entry — placement is carried by the
 *  adjacent label and by colour, not by a different shape per rank. */
export function AwardIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </StrokeIcon>
  );
}

function MedalIcon({ place, ...props }: IconProps & { place: "1" | "2" | "3" }) {
  return (
    <StrokeIcon {...props}>
      <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" />
      <path d="M11 12 5.12 2.2" />
      <path d="m13 12 5.88-9.8" />
      <circle cx="12" cy="17" r="5" />
      <text x="12" y="19.5" textAnchor="middle" fill="currentColor" stroke="none" fontSize="7" fontWeight="700">
        {place}
      </text>
    </StrokeIcon>
  );
}

export function Medal1Icon(props: IconProps) {
  return <MedalIcon place="1" {...props} />;
}

export function Medal2Icon(props: IconProps) {
  return <MedalIcon place="2" {...props} />;
}

export function Medal3Icon(props: IconProps) {
  return <MedalIcon place="3" {...props} />;
}
