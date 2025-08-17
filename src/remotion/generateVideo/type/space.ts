export interface LogoPosition {
  x: number; // Position horizontale en pourcentage (0-100)
  y: number; // Position verticale en pourcentage (0-100)
}

export interface Logo {
  url?: string;
  position?: LogoPosition;
  show?: boolean;
  size?: number;
}