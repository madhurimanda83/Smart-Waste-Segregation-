import { db } from '../db.js';

export function getPointsBalance(req, res) {
  const { totalPoints, transactions } = db.getUserPoints(req.user.id);
  const user = db.findUserById(req.user.id);

  return res.json({
    success: true,
    totalPoints,
    currentStreak: user ? user.currentStreak : 1,
    activeBadge: 'Responsible Collector',
    recentTransactions: transactions.slice(0, 5)
  });
}

export function getPointsHistory(req, res) {
  const { totalPoints, transactions } = db.getUserPoints(req.user.id);

  return res.json({
    success: true,
    totalPoints,
    count: transactions.length,
    transactions
  });
}

export function getPointRules(_req, res) {
  return res.json({
    success: true,
    rules: [
      { action: 'WASTE_IDENTIFIED', points: 5, description: 'Scan and identify a discarded item via AI computer vision' },
      { action: 'DISPOSAL_GUIDANCE_COMPLETED', points: 10, description: 'Follow preparation protocols (rinse, crush, remove labels)' },
      { action: 'COLLECTION_COMPLETED', points: 20, description: 'Curbside collection vehicle verifies bin pickup' },
      { action: 'RECOVERY_VERIFIED', points: 50, description: 'Certified facility check-in verifies circular processing or recycling' },
      { action: 'DONATE_REUSE_ITEM', points: 50, description: 'Redirect functional furniture/goods to community donation recipient' },
      { action: 'STREAK_BONUS', points: 25, description: 'Maintain active zero-contamination sorting for 5 consecutive days' }
    ]
  });
}
