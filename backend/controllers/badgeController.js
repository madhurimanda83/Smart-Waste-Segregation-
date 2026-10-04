import { db } from '../db.js';

export function getBadges(req, res) {
  const rawBadges = db.getUserBadges(req.user.id);
  const badges = rawBadges.map(b => ({
    ...b,
    isEarned: Boolean(b.unlocked)
  }));
  const unlockedCount = badges.filter(b => b.unlocked).length;

  return res.json({
    success: true,
    totalBadges: badges.length,
    unlockedCount,
    earnedBadges: unlockedCount,
    badges,
    nextBadge: badges.find(b => !b.unlocked) || null
  });
}
