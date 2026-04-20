const cooldowns = new Map();

/**
 * Check if user is on cooldown
 * @returns {boolean}
 */
export function isOnCooldown(userId, command, seconds) {
  const key = `${userId}-${command}`;
  const now = Date.now();

  if (!cooldowns.has(key)) return false;

  const expires = cooldowns.get(key);
  if (now > expires) {
    cooldowns.delete(key);
    return false;
  }

  return true;
}

/**
 * Start cooldown
 */
export function setCooldown(userId, command, seconds) {
  const key = `${userId}-${command}`;
  const expires = Date.now() + seconds * 1000;

  cooldowns.set(key, expires);
}

/**
 * Get remaining time
 */
export function getCooldownTime(userId, command) {
  const key = `${userId}-${command}`;
  if (!cooldowns.has(key)) return 0;

  const remaining = cooldowns.get(key) - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}