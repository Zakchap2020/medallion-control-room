// Sprite sheet: public/people-avatars.png — 5×5 grid, 3800×4500px original
// Adjust these constants if cropping looks off:
const IMG_W    = 3800;
const IMG_H    = 4500;
const TITLE_H  = 530;   // pixels from top to first avatar row
const COLS     = 5;
const ROWS     = 5;
const CELL_W   = IMG_W / COLS;                     // 760
const CELL_H   = (IMG_H - TITLE_H) / ROWS;         // 794
const PAD_X    = 38;                                // horizontal padding inside cell
const PAD_Y    = 28;                                // vertical padding inside cell
const SRC_W    = CELL_W - PAD_X * 2;               // 684
const SRC_H    = CELL_H - PAD_Y * 2;               // 738

interface Props {
  index: number;            // 0–24, left-to-right, top-to-bottom
  size?: number;            // display diameter in px
  className?: string;
  style?: React.CSSProperties;
}

export function Avatar({ index, size = 34, className, style }: Props) {
  const row  = Math.floor(index / COLS);
  const col  = index % COLS;
  const srcX = col * CELL_W + PAD_X;
  const srcY = TITLE_H + row * CELL_H + PAD_Y;

  // Scale so the avatar's usable area fills `size` pixels
  const scale = size / Math.min(SRC_W, SRC_H);
  const bgW   = IMG_W * scale;
  const bgH   = IMG_H * scale;
  const bgX   = -(srcX * scale);
  const bgY   = -(srcY * scale);

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        border: "1px solid #1e1e1e",
        background: "#111",    // fallback while image loads
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundImage: "url('/people-avatars.png')",
          backgroundSize: `${bgW}px ${bgH}px`,
          backgroundPosition: `${bgX}px ${bgY}px`,
          backgroundRepeat: "no-repeat",
        }}
      />
    </div>
  );
}
