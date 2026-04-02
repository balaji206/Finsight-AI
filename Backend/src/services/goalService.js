/**
 * Deterministic financial goal metrics calculator.
 * Computes inflation-adjusted target, success probability, and SDG contribution.
 */
export const calculateGoalMetrics = (goal, simulatedMonthlySaving = null) => {
  const now = new Date();
  const targetDate = new Date(goal.targetDate);
  const monthsRemaining =
    (targetDate.getFullYear() - now.getFullYear()) * 12 +
    (targetDate.getMonth() - now.getMonth());
  const yearsRemaining = Math.max(0.1, monthsRemaining / 12);

  const progressPercent = Math.min(
    100,
    (goal.currentAmount / goal.targetAmount) * 100
  );

  if (monthsRemaining <= 0) {
    return {
      status: goal.currentAmount >= goal.targetAmount ? "Completed" : "At Risk",
      progressPercent: Number(progressPercent.toFixed(1)),
      healthScore: goal.currentAmount >= goal.targetAmount ? 100 : 30,
      successProbability: goal.currentAmount >= goal.targetAmount ? 100 : 0,
      inflationAdjustedTarget: goal.targetAmount,
      requiredMonthlySavings: 0,
      riskFactors: ["Timeline has expired"],
      sdgContribution: 0,
    };
  }

  // ── Inflation-adjusted target ────────────────────────────────────────────
  const inflation = (goal.inflationRate || 6) / 100;
  const inflationAdjustedTarget =
    goal.targetAmount * Math.pow(1 + inflation, yearsRemaining);

  // ── Future value of current savings at assumed 10% p.a. return ──────────
  const assumedReturnRate = 0.1;
  const r = assumedReturnRate / 12;
  const n = monthsRemaining;
  const fvCurrentAmount =
    goal.currentAmount * Math.pow(1 + assumedReturnRate, yearsRemaining);

  // ── Required monthly savings (annuity due formula) ──────────────────────
  const shortfall = Math.max(0, inflationAdjustedTarget - fvCurrentAmount);
  let requiredMonthlySavings = 0;
  if (shortfall > 0) {
    requiredMonthlySavings =
      shortfall / (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
  }

  // ── Success probability ──────────────────────────────────────────────────
  let successProbability = 0;
  if (inflationAdjustedTarget <= fvCurrentAmount) {
    successProbability = 100;
  } else {
    const annuityFactor = ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const projectedFVAnnuity =
      simulatedMonthlySaving !== null
        ? simulatedMonthlySaving * annuityFactor
        : requiredMonthlySavings > 0
        ? requiredMonthlySavings * 0.8 * annuityFactor
        : 0;

    const totalProjected = fvCurrentAmount + projectedFVAnnuity;
    successProbability = Math.min(
      100,
      (totalProjected / inflationAdjustedTarget) * 100
    );
  }

  // SDG alignment boosts probability slightly (max +9% for 3 SDGs)
  const sdgBoost = goal.sdgs?.length > 0 ? goal.sdgs.length * 3 : 0;
  successProbability = Math.min(100, successProbability + sdgBoost);

  // ── Status & health ──────────────────────────────────────────────────────
  let status = "On Track";
  if (successProbability < 60) status = "At Risk";
  if (successProbability >= 100 && goal.currentAmount >= goal.targetAmount)
    status = "Completed";

  // ── Risk factors ─────────────────────────────────────────────────────────
  const riskFactors = [];
  if (goal.inflationRate > 6)
    riskFactors.push("High inflation rate limits future purchasing power");
  if (yearsRemaining < 3)
    riskFactors.push("Short timeline requires aggressive saving");
  if (requiredMonthlySavings > goal.targetAmount * 0.05)
    riskFactors.push("High required monthly savings relative to goal");
  if (successProbability < 50)
    riskFactors.push("Your current trajectory may fall short of target");

  // ── SDG contribution value ────────────────────────────────────────────────
  const monthlyBase =
    simulatedMonthlySaving !== null
      ? simulatedMonthlySaving
      : requiredMonthlySavings || 5000;
  const sdgContribution =
    monthlyBase *
    12 *
    yearsRemaining *
    ((goal.sdgs?.length > 0 ? goal.sdgs.length : 0.5) * 0.1);

  return {
    status,
    progressPercent: Number(progressPercent.toFixed(1)),
    healthScore: Math.round(successProbability),
    successProbability: Math.round(successProbability),
    inflationAdjustedTarget: Math.round(inflationAdjustedTarget),
    requiredMonthlySavings: Math.max(0, Math.round(requiredMonthlySavings)),
    riskFactors,
    sdgContribution: Math.round(sdgContribution),
  };
};
