// ─────────────────────────────────────────────
// EBOS — ID Generator Utility
// Generates collision-resistant prefixed local IDs
// ─────────────────────────────────────────────

/**
 * Generates a unique local ID.
 * Format: {prefix}_{base36_timestamp}_{base36_random}
 * Example: ord_lzf8abc1_x4y9z1kq
 *
 * @param {string} prefix - Short prefix identifying entity type
 * @returns {string} Unique ID string
 */
export function generateId(prefix) {
  const rand = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}_${time}_${rand}`;
}
