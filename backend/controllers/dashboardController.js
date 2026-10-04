import { db } from '../db.js';

export function getDashboard(req, res) {
  const userId = req.user.id;
  const user = db.findUserById(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const scans = db.getWasteScansByUserId(userId);
  const journeys = db.getJourneysByUserId(userId);
  const completedJourneys = journeys.filter(j => j.status === 'COMPLETED');
  const recyclableItems = scans.filter(s => s.category === 'RECYCLABLE');
  const badges = db.getUserBadges(userId);
  const activeJourney = journeys.find(j => j.status !== 'COMPLETED' && j.status !== 'CANCELLED') || journeys[0] || null;
  const { transactions } = db.getUserPoints(userId);
  const rewards = db.getRewards(userId);

  const sanitizedProfile = db.sanitizeUser(user);

  return res.json({
    success: true,
    // Top-level properties as specified in prompt section 15
    profile: sanitizedProfile,
    ecoPoints: user.ecoPoints,
    currentStreak: user.currentStreak,
    totalScans: scans.length,
    totalJourneys: journeys.length,
    completedJourneys: completedJourneys.length,
    recyclableItems: recyclableItems.length,
    badges: badges,
    activeJourney: activeJourney ? {
      id: activeJourney.id,
      journeyId: activeJourney.journeyId,
      itemName: activeJourney.itemName,
      category: activeJourney.category,
      status: activeJourney.status,
      destination: activeJourney.destinationName,
      createdAt: activeJourney.createdAt
    } : null,
    recentTransactions: transactions.slice(0, 5),
    availableRewards: rewards.filter(r => r.available),
    // Nested dashboard object for structured views
    dashboard: {
      profile: sanitizedProfile,
      ecoPoints: user.ecoPoints,
      currentStreak: user.currentStreak,
      stats: {
        totalScans: scans.length,
        totalJourneys: journeys.length,
        completedJourneys: completedJourneys.length,
        recyclableItemsCount: recyclableItems.length,
        landfillDiversionRate: journeys.length > 0 ? Math.round((completedJourneys.length / journeys.length) * 100) : 100
      },
      badges: {
        total: badges.length,
        unlocked: badges.filter(b => b.unlocked).length,
        activeBadge: badges.find(b => b.unlocked)?.name || 'Eco Beginner',
        nextBadge: badges.find(b => !b.unlocked) || null,
        list: badges
      },
      activeJourney: activeJourney ? {
        id: activeJourney.id,
        journeyId: activeJourney.journeyId,
        itemName: activeJourney.itemName,
        category: activeJourney.category,
        status: activeJourney.status,
        destination: activeJourney.destinationName,
        createdAt: activeJourney.createdAt
      } : null,
      recentTransactions: transactions.slice(0, 5),
      availableRewards: rewards.slice(0, 3)
    }
  });
}
