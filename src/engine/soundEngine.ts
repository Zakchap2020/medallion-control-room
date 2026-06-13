export type SoundType =
  | "tick"
  | "promotion_silver"
  | "promotion_gold"
  | "incident_medium"
  | "incident_critical"
  | "breach"
  | "audit_pass"
  | "audit_fail"
  | "person_departing"
  | "silo_contained"
  | "resolve_incident"
  | "toast_success"
  | "toast_warning"
  | "toast_error";

let _ctx: AudioContext | null = null;
let _muted = false;

function ctx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

export function setMuted(value: boolean) { _muted = value; }
export function getMuted() { return _muted; }

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.2,
  delay = 0
) {
  if (_muted) return;
  try {
    const ac = ctx();
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const t = ac.currentTime + delay;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  } catch {
    // Audio unavailable — fail silently
  }
}

export function playSound(type: SoundType) {
  if (_muted) return;
  switch (type) {
    case "tick":
      tone(90, 0.04, "sine", 0.04);
      break;

    case "promotion_silver":
      tone(440, 0.18, "sine", 0.22);
      tone(554, 0.25, "sine", 0.22, 0.14);
      break;

    case "promotion_gold":
      tone(440, 0.13, "sine", 0.25);
      tone(554, 0.13, "sine", 0.25, 0.11);
      tone(659, 0.35, "sine", 0.3, 0.22);
      break;

    case "incident_medium":
      tone(220, 0.18, "square", 0.13);
      break;

    case "incident_critical":
      tone(200, 0.1, "square", 0.18);
      tone(160, 0.18, "square", 0.18, 0.13);
      break;

    case "breach":
      tone(130, 0.25, "sawtooth", 0.22);
      tone(90,  0.4,  "sawtooth", 0.18, 0.22);
      break;

    case "audit_pass":
      tone(523, 0.1, "sine", 0.2);
      tone(659, 0.1, "sine", 0.2, 0.1);
      tone(784, 0.3, "sine", 0.25, 0.2);
      break;

    case "audit_fail":
      tone(300, 0.15, "square", 0.18);
      tone(200, 0.35, "square", 0.18, 0.16);
      break;

    case "person_departing":
      tone(330, 0.2,  "sine", 0.14);
      tone(262, 0.35, "sine", 0.1, 0.2);
      break;

    case "silo_contained":
      tone(400, 0.08, "sine", 0.18);
      tone(500, 0.15, "sine", 0.18, 0.07);
      break;

    case "resolve_incident":
      tone(440, 0.1,  "sine", 0.14);
      tone(550, 0.18, "sine", 0.14, 0.09);
      break;

    case "toast_success":
      tone(523, 0.13, "sine", 0.11);
      break;

    case "toast_warning":
      tone(330, 0.16, "sine", 0.11);
      break;

    case "toast_error":
      tone(200, 0.22, "square", 0.13);
      break;
  }
}
