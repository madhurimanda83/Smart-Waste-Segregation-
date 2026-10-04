import { db } from '../db.js';

export function getRewards(req, res) {
  const rewards = db.getRewards(req.user.id);
  const user = db.findUserById(req.user.id);

  return res.json({
    success: true,
    userBalance: user ? user.ecoPoints : 0,
    rewards,
    prototypeNotice: 'Prototype partner catalog • Ready for regional business & merchant voucher APIs'
  });
}

export function redeemReward(req, res) {
  try {
    const { id } = req.params;
    const result = db.redeemReward(req.user.id, id);

    return res.json({
      success: true,
      message: 'Reward redeemed successfully',
      redemption: result.redemption,
      newBalance: result.currentBalance
    });
  } catch (err) {
    console.error('[Redeem Reward Error]:', err);
    return res.status(400).json({
      success: false,
      error: err.message || 'Failed to redeem reward'
    });
  }
}

export function getRedemptionHistory(req, res) {
  const redemptions = db.getRedemptionsByUserId(req.user.id);
  return res.json({
    success: true,
    totalRedemptions: redemptions.length,
    redemptions
  });
}
