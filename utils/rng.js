import crypto from 'crypto';

/**
 * Secure random number 0-1
 */
export function random() {
  return crypto.randomInt(0, 1000000) / 1000000;
}

/**
 * Roll chance (0–100%)
 */
export function chance(percent) {
  return random() * 100 < percent;
}

/**
 * Weighted outcome picker
 * Example:
 * pick([
 *   { value: "win", weight: 30 },
 *   { value: "lose", weight: 70 }
 * ])
 */
export function pickWeighted(items) {
  const total = items.reduce((a, b) => a + b.weight, 0);
  let roll = random() * total;

  for (const item of items) {
    if (roll < item.weight) return item.value;
    roll -= item.weight;
  }
}

/**
 * Casino-style slot helper (bias control)
 */
export function slotRoll() {
  const reels = ['🍒', '🍋', '🔔', '⭐', '💎'];

  return [
    reels[Math.floor(random() * reels.length)],
    reels[Math.floor(random() * reels.length)],
    reels[Math.floor(random() * reels.length)]
  ];
}