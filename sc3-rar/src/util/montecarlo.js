import {
  triangular,
  pert,
  normal,
  logNormal,
  uniform,
  beta,
  poisson,
  exponential,
  gamma,
  pareto,
  weibull,
  negativeBinomial,
  binomial,
  geometric,
  discreteUniform
} from "./distributions";

// Dynamically sample any distribution
export function sampleDistribution(params) {
  const { type, ...rest } = params;
  switch (type) {
    case "triangular":
      return triangular(rest.min, rest.mode, rest.max);
    case "pert":
      return pert(rest.min, rest.mode, rest.max, rest.gamma || 4);
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
      // For exponential distribution as annual frequency, sample directly
      // lambda represents the rate parameter (average events per year)
      return exponential(rest.lambda);
    case "gamma":
      return gamma(rest.shape, rest.scale);
    case "pareto":
      return pareto(rest.xMin, rest.alpha);
    case "weibull":
      return weibull(rest.k, rest.lambda);
    case "negative-binomial":
      return negativeBinomial(rest.r, rest.p);
    case "binomial":
      return binomial(rest.n, rest.p);
    case "geometric":
      return geometric(rest.p);
    case "discrete-uniform":
      return discreteUniform(rest.min, rest.max);
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
      const sampledFreq = Math.max(0, sampleDistribution(event.frequency));
      
      // Handle fractional frequencies by using probability
      // For example, 0.3 events/year means 30% chance of 1 event, 70% chance of 0 events
      const wholeEvents = Math.floor(sampledFreq);
      const fractionalPart = sampledFreq - wholeEvents;
      
      // Generate losses for whole events
      for (let j = 0; j < wholeEvents; j++) {
        totalLoss += sampleDistribution(event.severity);
      }
      
      // Handle fractional part probabilistically
      if (fractionalPart > 0 && Math.random() < fractionalPart) {
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