/**
 * Box-Muller transform for generating standard normally distributed random numbers
 * @returns {number} Standard normal random number (mean 0, stdDev 1)
 */
function randomNormal() {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); 
  while(v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Normal distribution with given mean and standard deviation
 */
function normalDistribution(mean, stdDev) {
  return mean + stdDev * randomNormal();
}

function getPercentile(sortedArray, percentile) {
  const index = (percentile / 100) * (sortedArray.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  if (upper >= sortedArray.length) return sortedArray[lower];
  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
}

function formatCurrency(num) {
  if (num >= 1e7) return `₹${(num / 1e7).toFixed(1)}Cr`;
  if (num >= 1e5) return `₹${(num / 1e5).toFixed(1)}L`;
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
}

function createHistogram(sortedData, numBins) {
  if (sortedData.length === 0) return { bins: [], counts: [] };
  const min = sortedData[0];
  const max = sortedData[sortedData.length - 1];
  
  if (min === max) {
    return { bins: [`${Math.round(min)}`], counts: [sortedData.length] };
  }

  const binWidth = (max - min) / numBins;
  const bins = [];
  const counts = new Array(numBins).fill(0);

  for (let i = 0; i < numBins; i++) {
    const binStart = min + i * binWidth;
    const binEnd = min + (i + 1) * binWidth;
    bins.push(`${formatCurrency(binStart)} - ${formatCurrency(binEnd)}`);
  }

  for (const value of sortedData) {
    let binIndex = Math.floor((value - min) / binWidth);
    if (binIndex >= numBins) binIndex = numBins - 1; // Edge case for max value
    if (binIndex < 0) binIndex = 0;
    counts[binIndex]++;
  }

  return { bins, counts };
}


/**
 * Runs the Monte Carlo simulation
 */
export const runSimulation = (params) => {
  const {
    currentNetWorth,
    annualIncome,
    annualExpenses,
    timeHorizonYears,
    numSimulations,
    inflationRate,
    portfolio,
    sdgInitialScore
  } = params;

  let weightedReturn = 0;
  let weightedVolatility = 0;
  let weightedSDGFactor = 0;

  portfolio.forEach(asset => {
    const weight = asset.allocation / 100;
    weightedReturn += weight * asset.expectedReturn;
    weightedVolatility += weight * asset.volatility;
    weightedSDGFactor += weight * asset.sdgFactor;
  });

  const allSimulationsNW = []; 
  const allSimulationsSDG = []; 

  for (let sim = 0; sim < numSimulations; sim++) {
    const nwPath = [currentNetWorth];
    const sdgPath = [sdgInitialScore];

    let currentNW = currentNetWorth;
    let currentSDG = sdgInitialScore;

    for (let year = 1; year <= timeHorizonYears; year++) {
      const randomReturn = normalDistribution(weightedReturn, weightedVolatility);
      const savings = annualIncome - annualExpenses;
      currentNW = currentNW * (1 + randomReturn - inflationRate) + savings;
      nwPath.push(currentNW);

      const sdgNoise = normalDistribution(0, 0.02); 
      currentSDG = currentSDG * (1 + weightedSDGFactor * 0.08 + sdgNoise);
      if (currentSDG > 100) currentSDG = 100;
      if (currentSDG < 0) currentSDG = 0;
      
      sdgPath.push(currentSDG);
    }
    allSimulationsNW.push(nwPath);
    allSimulationsSDG.push(sdgPath);
  }

  const years = Array.from({ length: timeHorizonYears }, (_, i) => i + 1);
  const meanNetWorth = [];
  const medianNetWorth = [];
  const p10NetWorth = [];
  const p90NetWorth = [];
  const meanSDGScore = [];
  const medianSDGScore = [];

  for (let yearIdx = 1; yearIdx <= timeHorizonYears; yearIdx++) {
    const nwValues = allSimulationsNW.map(sim => sim[yearIdx]).sort((a, b) => a - b);
    const sdgValues = allSimulationsSDG.map(sim => sim[yearIdx]).sort((a, b) => a - b);

    meanNetWorth.push(nwValues.reduce((a, b) => a + b, 0) / numSimulations);
    medianNetWorth.push(getPercentile(nwValues, 50));
    p10NetWorth.push(getPercentile(nwValues, 10));
    p90NetWorth.push(getPercentile(nwValues, 90));

    meanSDGScore.push(sdgValues.reduce((a, b) => a + b, 0) / numSimulations);
    medianSDGScore.push(getPercentile(sdgValues, 50));
  }

  const finalNetWorths = allSimulationsNW.map(sim => sim[timeHorizonYears]).sort((a, b) => a - b);
  const probabilityOfDoubling = (finalNetWorths.filter(nw => nw >= currentNetWorth * 2).length / numSimulations) * 100;

  const samplePaths = [];
  for (let i = 0; i < 5; i++) {
    samplePaths.push({
      year: years,
      netWorth: allSimulationsNW[i].slice(1), 
      sdgScore: allSimulationsSDG[i].slice(1)
    });
  }

  return {
    projections: {
      years,
      meanNetWorth,
      medianNetWorth,
      p10NetWorth,
      p90NetWorth,
      meanSDGScore,
      medianSDGScore
    },
    summary: {
      finalMeanNetWorth: meanNetWorth[meanNetWorth.length - 1],
      finalP10NetWorth: p10NetWorth[p10NetWorth.length - 1],
      finalP90NetWorth: p90NetWorth[p90NetWorth.length - 1],
      probabilityOfDoubling,
      finalMeanSDGScore: meanSDGScore[meanSDGScore.length - 1]
    },
    distribution: createHistogram(finalNetWorths, 20),
    samplePaths
  };
};
