import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const DistributionChart = ({ distributionType, parameters, title }) => {
  const generateDistributionData = () => {
    const points = 100;
    const data = [];

    switch (distributionType) {
      case 'triangular':
        const { min, mode, max } = parameters;
        if (!min && min !== 0 || !mode && mode !== 0 || !max && max !== 0) return [];
        
        for (let i = 0; i <= points; i++) {
          const x = min + (max - min) * (i / points);
          let y;
          
          if (x <= mode) {
            y = (2 * (x - min)) / ((max - min) * (mode - min));
          } else {
            y = (2 * (max - x)) / ((max - min) * (max - mode));
          }
          
          data.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(4)) });
        }
        break;

      case 'normal':
        const { mean, stdDev } = parameters;
        if ((!mean && mean !== 0) || !stdDev) return [];
        
        const range = 4 * stdDev;
        const start = mean - range;
        const end = mean + range;
        
        for (let i = 0; i <= points; i++) {
          const x = start + (end - start) * (i / points);
          const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * 
                   Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
          
          data.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(6)) });
        }
        break;

      case 'lognormal':
        const { mean: logMean, stdDev: logStdDev } = parameters;
        if ((!logMean && logMean !== 0) || !logStdDev) return [];
        
        // For log-normal, we need to work with the underlying normal distribution parameters
        // If mean and stdDev are given as the actual mean and stdDev of the log-normal distribution,
        // we need to convert them to the underlying normal distribution parameters (mu, sigma)
        
        // Convert log-normal mean and stdDev to underlying normal parameters
        const variance = logStdDev * logStdDev;
        const meanSquared = logMean * logMean;
        const mu = Math.log(meanSquared / Math.sqrt(variance + meanSquared));
        const sigma = Math.sqrt(Math.log(1 + variance / meanSquared));
        
        // Generate points starting from a small positive value (log-normal is only defined for x > 0)
        // Show up to 4 standard deviations
        const maxRange = Math.exp(mu + 4 * sigma); 
        const minRange = Math.max(0.01, Math.exp(mu - 4 * sigma)); // Avoid x = 0
        
        for (let i = 0; i <= points; i++) {
          const x = minRange + (maxRange - minRange) * (i / points);
          if (x <= 0) continue; // Log-normal is only defined for x > 0
          
          // Log-normal PDF: f(x) = (1 / (x * σ * √(2π))) * exp(-((ln(x) - μ)²) / (2σ²))
          const y = (1 / (x * sigma * Math.sqrt(2 * Math.PI))) * 
                   Math.exp(-Math.pow(Math.log(x) - mu, 2) / (2 * sigma * sigma));
          
          data.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(6)) });
        }
        break;

      case 'uniform':
        const { minVal, maxVal } = parameters;
        if ((!minVal && minVal !== 0) || (!maxVal && maxVal !== 0)) return [];
        
        const height = 1 / (maxVal - minVal);
        
        for (let i = 0; i <= points; i++) {
          const x = minVal + (maxVal - minVal) * (i / points);
          const y = (x >= minVal && x <= maxVal) ? height : 0;
          
          data.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(6)) });
        }
        break;

      case 'beta':
        const { alpha, beta, minBeta, maxBeta } = parameters;
        if (!alpha || !beta || (!minBeta && minBeta !== 0) || (!maxBeta && maxBeta !== 0)) return [];
        
        for (let i = 0; i <= points; i++) {
          const t = i / points;
          const x = minBeta + (maxBeta - minBeta) * t;
          
          // Beta function approximation
          const B = (Math.pow(t, alpha - 1) * Math.pow(1 - t, beta - 1)) / 
                   (gamma(alpha) * gamma(beta) / gamma(alpha + beta));
          const y = B / (maxBeta - minBeta);
          
          data.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(6)) });
        }
        break;

      case 'poisson':
        const { frequencyLambda } = parameters;
        if (!frequencyLambda || frequencyLambda <= 0) return [];
        
        // For Poisson, we'll show discrete probabilities up to a reasonable range
        const maxK = Math.min(30, Math.max(10, frequencyLambda + 4 * Math.sqrt(frequencyLambda)));
        
        for (let k = 0; k <= maxK; k++) {
          // Poisson probability mass function: P(X = k) = (λ^k * e^(-λ)) / k!
          const probability = (Math.pow(frequencyLambda, k) * Math.exp(-frequencyLambda)) / factorial(k);
          data.push({ 
            x: k, 
            y: parseFloat(probability.toFixed(6)),
            name: k.toString() // Add name for better labeling
          });
        }
        break;

      case 'exponential':
        const { frequencyLambdaExp } = parameters;
        if (!frequencyLambdaExp || frequencyLambdaExp <= 0) return [];
        
        // Exponential distribution range (0 to ~5/λ covers most of the distribution)
        const expRange = 5 / frequencyLambdaExp;
        
        for (let i = 0; i <= points; i++) {
          const x = (expRange * i) / points;
          // Exponential PDF: f(x) = λ * e^(-λx) for x ≥ 0
          const y = frequencyLambdaExp * Math.exp(-frequencyLambdaExp * x);
          
          data.push({ x: parseFloat(x.toFixed(3)), y: parseFloat(y.toFixed(6)) });
        }
        break;

      default:
        return [];
    }

    return data;
  };

  // Factorial function for Poisson distribution
  const factorial = (n) => {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  };

  // Gamma function approximation for beta distribution
  const gamma = (z) => {
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
    z -= 1;
    let x = 0.99999999999980993;
    const coefficients = [
      676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059,
      12.507343278686905, -0.13857109526572012,
      9.9843695780195716e-6, 1.5056327351493116e-7
    ];
    
    for (let i = 0; i < coefficients.length; i++) {
      x += coefficients[i] / (z + i + 1);
    }
    
    const t = z + coefficients.length - 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  };

  const data = generateDistributionData();

  if (data.length === 0) {
    return (
      <div className="rar-distribution-chart-placeholder">
        <p>Enter parameters to view distribution chart</p>
      </div>
    );
  }

  // Use bar chart for discrete distributions (Poisson), line chart for continuous
  const isDiscrete = distributionType === 'poisson';

  return (
    <div className="rar-distribution-chart-container">
      <h5 className="rar-distribution-chart-title">{title}</h5>
      <ResponsiveContainer width="100%" height={200}>
        {isDiscrete ? (
          <BarChart 
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="x"
              type="category"
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              width={60}
            />
            <Tooltip 
              formatter={(value, name) => [value.toFixed(6), 'Probability']}
              labelFormatter={(value) => `Events: ${value}`}
            />
            <Bar 
              dataKey="y" 
              fill="#0099cc" 
              stroke="#0099cc"
              strokeWidth={1}
            />
          </BarChart>
        ) : (
          <LineChart 
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="x" 
              type="number" 
              scale="linear" 
              domain={['dataMin', 'dataMax']}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              width={60}
            />
            <Tooltip 
              formatter={(value, name) => [value.toFixed(6), 'Probability Density']}
              labelFormatter={(value) => `Value: ${value}`}
            />
            <Line 
              type="monotone" 
              dataKey="y" 
              stroke="#0099cc" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default DistributionChart;