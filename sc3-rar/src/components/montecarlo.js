import {
  triangular,
  normal,
  logNormal,
  uniform,
  beta,
  poisson,
  exponential
} from "./distributions";

// Dynamically sample any distribution
export function sampleDistribution(params) {
  const { type, ...rest } = params;
  switch (type) {
    case "triangular":
      return triangular(rest.min, rest.mode, rest.max);
    case "normal":
      return normal(rest.mean, rest.stdDev);
    case "logNormal":
      return logNormal(rest.mean, rest.stdDev);
    case "uniform":
      return uniform(rest.min, rest.max);
    case "beta":
      return rest.min + beta(rest.alpha, rest.beta) * (rest.max - rest.min);
    case "poisson":
      return poisson(rest.lambda);
    case "exponential":
      // Convert inter-arrival time to annual frequency
      return Math.floor(365 / exponential(rest.lambda));
    default:
      return 0;
  }
}

// Monte Carlo engine
export function runMonteCarlo(events, iterations = 10000, confidenceLevel = 0.95) {
  const annualLosses = [];

  for (let i = 0; i < iterations; i++) {
    let totalLoss = 0;

    events.forEach((event) => {
      const freq = Math.max(0, Math.round(sampleDistribution(event.frequency)));
      for (let j = 0; j < freq; j++) {
        totalLoss += sampleDistribution(event.severity);
      }
    });

    annualLosses.push(totalLoss);
  }

  annualLosses.sort((a, b) => a - b);
  const varIndex = Math.floor(confidenceLevel * annualLosses.length);
  const valueAtRisk = annualLosses[varIndex];
  const expectedAnnualLoss =
    annualLosses.reduce((sum, val) => sum + val, 0) / iterations;

  return { expectedAnnualLoss, valueAtRisk, annualLosses };
}