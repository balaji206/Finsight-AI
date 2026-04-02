import { runSimulation } from '../services/monteCarloService.js';

export const generateForecast = (req, res) => {
  try {
    const {
      currentNetWorth,
      annualIncome,
      annualExpenses,
      timeHorizonYears,
      numSimulations,
      inflationRate,
      portfolio,
      sdgInitialScore
    } = req.body;

    if (
      currentNetWorth === undefined ||
      annualIncome === undefined ||
      annualExpenses === undefined ||
      timeHorizonYears === undefined ||
      numSimulations === undefined ||
      inflationRate === undefined ||
      !portfolio ||
      sdgInitialScore === undefined
    ) {
      return res.status(400).json({ error: 'Missing required fields in the request body.' });
    }

    const totalAllocation = portfolio.reduce((sum, asset) => sum + asset.allocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      return res.status(400).json({ error: `Portfolio allocation must sum to 100. Current sum: ${totalAllocation}` });
    }

    const cappedSimulations = Math.min(Math.max(numSimulations, 1), 10000);

    const forecastData = runSimulation({
      currentNetWorth,
      annualIncome,
      annualExpenses,
      timeHorizonYears,
      numSimulations: cappedSimulations,
      inflationRate,
      portfolio,
      sdgInitialScore
    });

    res.status(200).json(forecastData);
  } catch (error) {
    console.error('Error generating forecast:', error);
    res.status(500).json({ error: 'Internal server error running forecast simulation.' });
  }
};
