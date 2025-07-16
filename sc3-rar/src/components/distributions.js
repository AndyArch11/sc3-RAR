// Loss severity distributions
export function triangular(min, mode, max) {
  const u = Math.random();
  return u < (mode - min) / (max - min)
    ? min + Math.sqrt(u * (max - min) * (mode - min))
    : max - Math.sqrt((1 - u) * (max - min) * (max - mode));
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