import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, ReferenceLine } from 'recharts';

// Factorial function for Poisson distribution
const factorial = (n) => {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
};

const DistributionChart = ({ distributionType, parameters, title, formatCurrency }) => {
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
        const { mean: inputMu, stdDev: inputSigma } = parameters;
        if ((!inputMu && inputMu !== 0) || !inputSigma) return [];
        
        // The parameters from the form are already the underlying normal distribution parameters (mu, sigma)
        // No conversion needed - use them directly
        const mu = inputMu;
        const sigma = inputSigma;
        
        // Generate points starting from a small positive value (log-normal is only defined for x > 0)
        // Use percentiles of the log-normal distribution for more intuitive ranging
        // Show from 1st percentile to 99th percentile for better visual comprehension
        const p01 = Math.exp(mu + sigma * (-2.326)); // 1st percentile
        const p99 = Math.exp(mu + sigma * 2.326);    // 99th percentile
        const minRange = Math.max(0.01, p01);
        const maxRange = p99;
        
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
      <ResponsiveContainer width="100%" height={250}>
        {isDiscrete ? (
          <BarChart 
            data={data}
            margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="x"
              type="category"
              interval={0}
              angle={-45}
              textAnchor="end"
              height={25}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatCurrency ? formatCurrency(value) : value.toLocaleString()}
              label={{ value: formatCurrency ? 'Loss Amount' : 'Event Frequency', position: 'insideBottom', offset: -15 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              width={100}
              label={{ value: 'Probability Density', angle: -90, position: 'outside', style: { textAnchor: 'middle' }, offset: 50 }}
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
            margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="x" 
              type="number" 
              scale="linear" 
              domain={['dataMin', 'dataMax']}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatCurrency ? formatCurrency(value) : value.toLocaleString()}
              label={{ value: formatCurrency ? 'Loss Amount' : 'Event Frequency', position: 'insideBottom', offset: -15 }}
              height={25}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              width={100}
              label={{ value: 'Probability Density', angle: -90, position: 'outside', style: { textAnchor: 'middle' }, offset: 50 }}
            />
            <Tooltip 
              formatter={(value, name) => [value.toFixed(6), 'Probability Density']}
              labelFormatter={(value) => `Value: ${formatCurrency ? formatCurrency(value) : value.toLocaleString()}`}
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

// Cumulative Distribution Function Chart Component
export const CumulativeDistributionChart = ({ distributionType, parameters, title, formatCurrency }) => {
  const [percentile, setPercentile] = React.useState(95);
  
  const generateCDFData = () => {
    const points = 100;
    const data = [];

    switch (distributionType) {
      case 'triangular':
        const { min, mode, max } = parameters;
        if (!min && min !== 0 || !mode && mode !== 0 || !max && max !== 0) return [];
        
        for (let i = 0; i <= points; i++) {
          const x = min + (max - min) * (i / points);
          let cdf;
          
          if (x <= min) {
            cdf = 0;
          } else if (x <= mode) {
            cdf = Math.pow(x - min, 2) / ((max - min) * (mode - min));
          } else if (x <= max) {
            cdf = 1 - Math.pow(max - x, 2) / ((max - min) * (max - mode));
          } else {
            cdf = 1;
          }
          
          data.push({ 
            x: parseFloat(x.toFixed(2)), 
            cdf: parseFloat((cdf * 100).toFixed(2)),
            value: x,
            isSelected: (cdf * 100) <= percentile
          });
        }
        break;

      case 'normal':
        const { mean, stdDev } = parameters;
        if ((!mean && mean !== 0) || !stdDev) return [];
        
        const range = 4 * stdDev;
        const start = Math.max(0, mean - range);
        const end = mean + range;
        
        for (let i = 0; i <= points; i++) {
          const x = start + (end - start) * (i / points);
          // Approximate normal CDF using error function approximation
          const z = (x - mean) / stdDev;
          const cdf = 0.5 * (1 + erf(z / Math.sqrt(2)));
          
          data.push({ 
            x: parseFloat(x.toFixed(2)), 
            cdf: parseFloat((cdf * 100).toFixed(2)),
            value: x,
            isSelected: (cdf * 100) <= percentile
          });
        }
        break;

      case 'lognormal':
        const { mean: inputMu, stdDev: inputSigma } = parameters;
        if ((!inputMu && inputMu !== 0) || !inputSigma) return [];
        
        // The parameters from the form are already the underlying normal distribution parameters (mu, sigma)
        // No conversion needed - use them directly
        const mu = inputMu;
        const sigma = inputSigma;
        
        // Use percentiles of the log-normal distribution for more intuitive ranging
        const p01 = Math.exp(mu + sigma * (-2.326)); // 1st percentile
        const p99 = Math.exp(mu + sigma * 2.326);    // 99th percentile
        const minRange = Math.max(0.01, p01);
        const maxRange = p99;
        
        for (let i = 0; i <= points; i++) {
          const x = minRange + (maxRange - minRange) * (i / points);
          const z = (Math.log(x) - mu) / sigma;
          const cdf = 0.5 * (1 + erf(z / Math.sqrt(2)));
          
          data.push({ 
            x: parseFloat(x.toFixed(2)), 
            cdf: parseFloat((cdf * 100).toFixed(2)),
            value: x,
            isSelected: (cdf * 100) <= percentile
          });
        }
        break;

      case 'uniform':
        const { minVal, maxVal } = parameters;
        if ((!minVal && minVal !== 0) || (!maxVal && maxVal !== 0)) return [];
        
        for (let i = 0; i <= points; i++) {
          const x = minVal + (maxVal - minVal) * (i / points);
          let cdf;
          
          if (x <= minVal) {
            cdf = 0;
          } else if (x >= maxVal) {
            cdf = 1;
          } else {
            cdf = (x - minVal) / (maxVal - minVal);
          }
          
          data.push({ 
            x: parseFloat(x.toFixed(2)), 
            cdf: parseFloat((cdf * 100).toFixed(2)),
            value: x,
            isSelected: (cdf * 100) <= percentile
          });
        }
        break;

      case 'beta':
        const { alpha, beta, minBeta, maxBeta } = parameters;
        if (!alpha || !beta || (!minBeta && minBeta !== 0) || (!maxBeta && maxBeta !== 0)) return [];
        
        for (let i = 0; i <= points; i++) {
          const x = minBeta + (maxBeta - minBeta) * (i / points);
          // For beta distribution, we need to transform x to [0,1] range
          const normalizedX = (x - minBeta) / (maxBeta - minBeta);
          
          // Calculate beta CDF using regularized incomplete beta function approximation
          const cdf = incompleteBeta(normalizedX, alpha, beta);
          
          data.push({ 
            x: parseFloat(x.toFixed(2)), 
            cdf: parseFloat((cdf * 100).toFixed(2)),
            value: x,
            isSelected: (cdf * 100) <= percentile
          });
        }
        break;

      case 'poisson':
        const { frequencyLambda } = parameters;
        if (!frequencyLambda || frequencyLambda <= 0) return [];
        
        // For Poisson CDF, we need to sum probabilities up to each point
        const maxK = Math.max(20, Math.ceil(frequencyLambda + 5 * Math.sqrt(frequencyLambda)));
        
        for (let k = 0; k <= maxK; k++) {
          // Calculate cumulative probability P(X <= k)
          let cdf = 0;
          for (let i = 0; i <= k; i++) {
            // Poisson PMF: P(X = i) = (λ^i * e^(-λ)) / i!
            const pmf = Math.pow(frequencyLambda, i) * Math.exp(-frequencyLambda) / factorial(i);
            cdf += pmf;
          }
          
          data.push({ 
            x: k, 
            cdf: parseFloat((cdf * 100).toFixed(2)),
            value: k,
            isSelected: (cdf * 100) <= percentile
          });
        }
        break;

      case 'exponential':
        const { frequencyLambdaExp } = parameters;
        if (!frequencyLambdaExp || frequencyLambdaExp <= 0) return [];
        
        // For exponential distribution, range from 0 to a reasonable upper bound
        const maxTime = Math.max(10, 5 / frequencyLambdaExp); // 5 times the expected value
        
        for (let i = 0; i <= points; i++) {
          const x = (maxTime * i) / points;
          // Exponential CDF: F(x) = 1 - e^(-λx) for x >= 0
          const cdf = x >= 0 ? 1 - Math.exp(-frequencyLambdaExp * x) : 0;
          
          data.push({ 
            x: parseFloat(x.toFixed(3)), 
            cdf: parseFloat((cdf * 100).toFixed(2)),
            value: x,
            isSelected: (cdf * 100) <= percentile
          });
        }
        break;

      default:
        return [];
    }

    return data;
  };

  // Incomplete beta function approximation for beta distribution CDF
  const incompleteBeta = (x, a, b) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    
    // Use continued fraction approximation for the incomplete beta function
    // This is a simplified approximation - for production use, consider a more robust implementation
    const logBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
    
    if (x < (a + 1) / (a + b + 2)) {
      return Math.exp(a * Math.log(x) + b * Math.log(1 - x) - logBeta) * 
             continuedFraction(a, b, x) / a;
    } else {
      return 1 - Math.exp(a * Math.log(x) + b * Math.log(1 - x) - logBeta) * 
             continuedFraction(b, a, 1 - x) / b;
    }
  };

  // Log gamma function approximation
  const logGamma = (z) => {
    const g = 7;
    const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
              771.32342877765313, -176.61502916214059, 12.507343278686905,
              -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    
    if (z < 0.5) {
      return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
    }
    
    z -= 1;
    let x = c[0];
    for (let i = 1; i < g + 2; i++) {
      x += c[i] / (z + i);
    }
    
    const t = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  };

  // Continued fraction for incomplete beta function
  const continuedFraction = (a, b, x) => {
    const maxIterations = 100;
    const tolerance = 1e-10;
    
    const qab = a + b;
    const qap = a + 1;
    const qam = a - 1;
    let c = 1;
    let d = 1 - qab * x / qap;
    
    if (Math.abs(d) < tolerance) d = tolerance;
    d = 1 / d;
    let h = d;
    
    for (let m = 1; m <= maxIterations; m++) {
      const m2 = 2 * m;
      const aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < tolerance) d = tolerance;
      c = 1 + aa / c;
      if (Math.abs(c) < tolerance) c = tolerance;
      d = 1 / d;
      h *= d * c;
      
      const aa2 = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa2 * d;
      if (Math.abs(d) < tolerance) d = tolerance;
      c = 1 + aa2 / c;
      if (Math.abs(c) < tolerance) c = tolerance;
      d = 1 / d;
      const del = d * c;
      h *= del;
      
      if (Math.abs(del - 1) < tolerance) break;
    }
    
    return h;
  };

  // Error function approximation for normal distribution
  const erf = (x) => {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  };

  const data = generateCDFData();
  
  if (data.length === 0) {
    return (
      <div className="rar-cdf-chart-placeholder">
        <p>Enter parameters to view cumulative distribution chart</p>
      </div>
    );
  }

  // Find the value at the selected percentile with more precision
  let percentileValue = null;
  
  // Find the closest data point to the target percentile
  let minDiff = Infinity;
  for (let i = 0; i < data.length; i++) {
    const diff = Math.abs(data[i].cdf - percentile);
    if (diff < minDiff) {
      minDiff = diff;
      percentileValue = data[i];
    }
  }
  
  // If no exact match, interpolate between closest points
  if (!percentileValue) {
    percentileValue = data[data.length - 1];
  }
  
  const percentileX = percentileValue ? percentileValue.x : 0;
  
  // Calculate the gradient stop position based on the actual X value relative to the data range
  const minX = data[0]?.x || 0;
  const maxX = data[data.length - 1]?.x || 1;
  const xRange = maxX - minX;
  
  // Ensure gradient position is calculated correctly and clamped between 0-100
  let gradientStopPosition = 0;
  if (xRange > 0 && percentileValue) {
    gradientStopPosition = Math.max(0, Math.min(100, ((percentileX - minX) / xRange) * 100));
  }
  
  // Create a unique gradient ID that includes the percentile and position to force re-render
  const gradientId = `colorGradient-${distributionType}-${percentile}-${gradientStopPosition.toFixed(1)}`;

  return (
    <div className="rar-cdf-chart-container">
      <h5 className="rar-cdf-chart-title">{title} - Cumulative Distribution</h5>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart 
          key={`${distributionType}-${JSON.stringify(parameters)}-${percentile}`}
          data={data} 
          margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset={`${gradientStopPosition}%`} stopColor="#0099cc" stopOpacity={0.6}/>
              <stop offset={`${gradientStopPosition}%`} stopColor="#0099cc" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="x" 
            type="number" 
            scale="linear" 
            domain={['dataMin', 'dataMax']}
            tickFormatter={(value) => formatCurrency ? formatCurrency(value) : value.toLocaleString()}
            label={{ value: formatCurrency ? 'Loss Amount' : 'Event Frequency', position: 'insideBottom', offset: -15 }}
            height={25}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            label={{ value: 'Cumulative Probability (%)', angle: -90, position: 'outside', style: { textAnchor: 'middle' }, offset: 50 }}
            width={100}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value, name) => [`${value.toFixed(1)}%`, 'Probability']}
            labelFormatter={(value) => formatCurrency ? `Loss: ${formatCurrency(value)}` : `Frequency: ${value.toLocaleString()} events`}
          />
          <Area 
            type="monotone" 
            dataKey="cdf" 
            stroke="#0099cc" 
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            fillOpacity={0.3}
          />
          <ReferenceLine 
            x={percentileX} 
            stroke="#ff4444" 
            strokeWidth={2} 
            strokeDasharray="5 5"
          />
        </AreaChart>
      </ResponsiveContainer>
      
      <div className="rar-percentile-controls">
        <div className="rar-percentile-slider-container">
          <label className="rar-percentile-label">
            Percentile: {percentile}%
          </label>
          <input
            type="range"
            min="1"
            max="99"
            value={percentile}
            onChange={(e) => setPercentile(Number(e.target.value))}
            className="rar-percentile-slider"
          />
          <div className="rar-percentile-markers">
            <span>1%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>99%</span>
          </div>
        </div>
        
        <div className="rar-percentile-info">
          <div className="rar-percentile-result">
            <span className="rar-percentile-text">
              There is a {percentile}% probability that the {formatCurrency ? 'loss' : 'frequency'} will be ≤ 
            </span>
            <span className="rar-percentile-value">
              {formatCurrency ? formatCurrency(percentileX) : `${percentileX.toLocaleString()} events`}
            </span>
          </div>
          <div className="rar-percentile-interpretation">
            {formatCurrency 
              ? `Value at Risk (VaR) at ${percentile}th percentile: ${formatCurrency(percentileX)}`
              : `Frequency at ${percentile}th percentile: ${percentileX.toLocaleString()} events`
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistributionChart;