// Loss severity distributions
export function triangular(min, mode, max) {
  const u = Math.random();
  return u < (mode - min) / (max - min)
    ? min + Math.sqrt(u * (max - min) * (mode - min))
    : max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

export function pert(min, mode, max, gamma = 4) {
  // Modified PERT distribution using Beta distribution with gamma parameter
  // Calculate position of mode within the range [0,1]
  const modePosition = (mode - min) / (max - min);
  
  // Calculate alpha and beta parameters for Beta distribution
  // Higher gamma values create more concentration around the mode
  const alpha = 1 + gamma * modePosition;
  const betaParam = 1 + gamma * (1 - modePosition);
  
  // Sample from Beta distribution and transform to [min, max] range
  const betaSample = beta(alpha, betaParam);
  return min + betaSample * (max - min);
}

export function normal(mean, stdDev) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + stdDev * z;
}

export function logNormal(mean, stdDev) {
  return Math.exp(normal(mean, stdDev));
}

export function uniform(min, max) {
  return min + Math.random() * (max - min);
}

export function beta(alpha, beta) {
  const gammaSample = (a) => {
    const u = Math.random();
    return Math.pow(-Math.log(u), 1 / a);
  };
  const x = gammaSample(alpha);
  const y = gammaSample(beta);
  return x / (x + y);
}

// Event frequency distributions
export function poisson(lambda) {
  let L = Math.exp(-lambda), p = 1, k = 0;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

export function exponential(lambda) {
  return -Math.log(1 - Math.random()) / lambda;
}

// Additional loss severity distributions
export function gamma(shape, scale) {
  // Gamma distribution using Marsaglia and Tsang's method
  if (shape < 1) {
    // For shape < 1, use the transformation method
    const d = shape + 1;
    const c = 1 / Math.sqrt(9 * d);
    const u = Math.random();
    const sample = gamma(d, scale) * Math.pow(u, 1 / shape);
    return sample;
  }
  
  // For shape >= 1, use Marsaglia and Tsang's method
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  
  while (true) {
    let x, v;
    do {
      x = normal(0, 1);
      v = 1 + c * x;
    } while (v <= 0);
    
    v = v * v * v;
    const u = Math.random();
    
    if (u < 1 - 0.0331 * x * x * x * x) {
      return d * v * scale;
    }
    
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
      return d * v * scale;
    }
  }
}

export function pareto(xMin, alpha) {
  const u = Math.random();
  return xMin / Math.pow(u, 1 / alpha);
}

export function weibull(k, lambda) {
  const u = Math.random();
  return lambda * Math.pow(-Math.log(1 - u), 1 / k);
}

// Additional frequency distributions
export function negativeBinomial(r, p) {
  // Number of trials to get r successes
  let failures = 0;
  let successes = 0;
  
  while (successes < r) {
    if (Math.random() < p) {
      successes++;
    } else {
      failures++;
    }
  }
  
  return r + failures; // Total trials
}

export function binomial(n, p) {
  let successes = 0;
  for (let i = 0; i < n; i++) {
    if (Math.random() < p) {
      successes++;
    }
  }
  return successes;
}

export function geometric(p) {
  // Number of trials until first success
  let trials = 1;
  while (Math.random() >= p) {
    trials++;
  }
  return trials;
}

export function discreteUniform(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}