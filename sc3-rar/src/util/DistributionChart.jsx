import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, ReferenceLine } from 'recharts';

// Helper function to ensure unique x values in chart data
const deduplicateData = (data) => {
  const seenX = new Map();
  const uniqueData = [];
  
  data.forEach((point) => {
    const roundedX = parseFloat(point.x.toFixed(3)); // Use 3 decimal places for precision
    if (!seenX.has(roundedX)) {
      seenX.set(roundedX, true);
      uniqueData.push({ ...point, x: roundedX });
    }
  });
  
  return uniqueData;
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

// Combination function for binomial coefficients
const combination = (n, k) => {
  if (k > n || k < 0) return 0;
  if (k === 0 || k === n) return 1;
  
  // Use the more efficient formula: C(n,k) = n! / (k! * (n-k)!)
  // But avoid large factorials by computing iteratively
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return result;
};

// Incomplete beta function approximation for Beta CDF
const incompleteBeta = (x, a, b) => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  
  // Use continued fraction for better approximation
  const EPSILON = 1e-8;
  const MAXITER = 100;
  
  // Beta function B(a,b) = Γ(a)Γ(b)/Γ(a+b)
  const logBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  
  // Use series expansion for small x, continued fraction for large x
  if (x < (a + 1) / (a + b + 2)) {
    // Series expansion
    let sum = 0;
    let term = 1;
    for (let n = 0; n < MAXITER; n++) {
      if (n > 0) {
        term *= x * (a + n - 1) / (a + b + n - 1);
      }
      sum += term / (a + n);
      if (Math.abs(term) < EPSILON) break;
    }
    return Math.exp(a * Math.log(x) + b * Math.log(1 - x) - logBeta) * sum;
  } else {
    // Use symmetry: I_x(a,b) = 1 - I_(1-x)(b,a)
    return 1 - incompleteBeta(1 - x, b, a);
  }
};

// Log gamma function approximation
const logGamma = (z) => {
  if (z === 1 || z === 2) return 0;
  if (z < 1) return logGamma(z + 1) - Math.log(z);
  
  // Stirling's approximation for z > 1
  return (z - 0.5) * Math.log(z) - z + 0.5 * Math.log(2 * Math.PI) + 
         1 / (12 * z) - 1 / (360 * z * z * z);
};

const DistributionChart = ({ distributionType, parameters, title, formatCurrency }) => {
  // Force chart dimensions for 768px viewport compatibility
  const [chartDimensions, setChartDimensions] = React.useState({ width: 0, height: 250 });
  const chartRef = React.useRef(null);
  // Add state for log scale toggle (only for loss charts)
  const [useLogScale, setUseLogScale] = React.useState(false);

  React.useEffect(() => {
    const updateDimensions = () => {
      if (chartRef.current) {
        const containerWidth = chartRef.current.offsetWidth;
        setChartDimensions({
          width: Math.max(containerWidth - 40, 300), // Minimum 300px width
          height: 250
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  const generateDistributionData = () => {
    const points = 100;
    const data = [];

    switch (distributionType) {
      case 'triangular':
        const { min, mode, max } = parameters;
        if ((!min && min !== 0) || (!mode && mode !== 0) || (!max && max !== 0)) return [];

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

      case 'pert':
        const { min: pertMin, mode: pertMode, max: pertMax, gamma: pertGamma = 4 } = parameters;
        if ((!pertMin && pertMin !== 0) || (!pertMode && pertMode !== 0) || (!pertMax && pertMax !== 0)) return [];
        
        // Modified PERT distribution uses Beta distribution with gamma parameter controlling mode weight
        // Calculate shape parameters based on gamma value
        const modePosition = (pertMode - pertMin) / (pertMax - pertMin); // Mode position as fraction [0,1]
        
        // Calculate alpha and beta parameters for Beta distribution
        // Higher gamma values create more concentration around the mode
        const pertAlpha = 1 + pertGamma * modePosition;
        const pertBeta = 1 + pertGamma * (1 - modePosition);
        
        // Use a simplified Beta function approximation
        const betaFunction = (a, b) => {
          // Using Stirling's approximation for large values and direct calculation for small values
          if (a <= 1 && b <= 1) return 1;
          if (a === 1) return 1 / b;
          if (b === 1) return 1 / a;
          
          // Simplified approximation: B(a,b) ≈ sqrt(2π) * (a^(a-0.5) * b^(b-0.5)) / (a+b)^(a+b-0.5)
          const logBeta = 0.5 * Math.log(2 * Math.PI) + 
                         (a - 0.5) * Math.log(a) + 
                         (b - 0.5) * Math.log(b) - 
                         (a + b - 0.5) * Math.log(a + b);
          return Math.exp(logBeta);
        };
        
        const betaConstant = betaFunction(pertAlpha, pertBeta);
        
        for (let i = 0; i <= points; i++) {
          const x = pertMin + (pertMax - pertMin) * (i / points);
          const t = (x - pertMin) / (pertMax - pertMin); // Normalize to [0,1]
          
          if (t <= 0 || t >= 1) {
            data.push({ x: parseFloat(x.toFixed(2)), y: 0 });
          } else {
            // Beta PDF: f(t) = (t^(α-1) * (1-t)^(β-1)) / B(α,β)
            // Scale by 1/(max-min) to account for transformation from [0,1] to [min,max]
            const betaPdf = Math.pow(t, pertAlpha - 1) * Math.pow(1 - t, pertBeta - 1) / betaConstant;
            const y = betaPdf / (pertMax - pertMin);
            
            data.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(Math.max(0, y).toFixed(6)) });
          }
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

      case 'gamma':
        const { shape, scale } = parameters;
        if (!shape || shape <= 0 || !scale || scale <= 0) return [];
        
        // Gamma distribution range - use percentiles for better visualization
        // Gamma distribution has support on (0, ∞), so we'll show a reasonable range
        const gammaRange = scale * (shape + 4 * Math.sqrt(shape)); // Approximate 99th percentile
        const minGamma = 0.01; // Start slightly above 0
        
        for (let i = 0; i <= points; i++) {
          const x = minGamma + (gammaRange - minGamma) * (i / points);
          if (x <= 0) continue; // Gamma is only defined for x > 0
          
          // Gamma PDF: f(x) = (1/(scale^shape * Γ(shape))) * x^(shape-1) * e^(-x/scale)
          // Using log for numerical stability with large values
          const logPdf = (shape - 1) * Math.log(x) - (x / scale) - shape * Math.log(scale) - logGamma(shape);
          const y = Math.exp(logPdf);
          
          data.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(8)) });
        }
        break;

      case 'pareto':
        const { xMin, alpha: paretoAlpha } = parameters;
        if (!xMin || xMin <= 0 || !paretoAlpha || paretoAlpha <= 0) return [];
        
        // Pareto distribution range - show from xMin to reasonable upper bound
        const paretoRange = xMin * Math.pow(100, 1/paretoAlpha); // Value where CDF = 0.99
        
        for (let i = 0; i <= points; i++) {
          const x = xMin + (paretoRange - xMin) * (i / points);
          if (x < xMin) continue; // Pareto is only defined for x >= xMin
          
          // Pareto PDF: f(x) = (α * xₘ^α) / x^(α+1) for x >= xₘ
          const y = (paretoAlpha * Math.pow(xMin, paretoAlpha)) / Math.pow(x, paretoAlpha + 1);
          
          data.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(8)) });
        }
        break;

      case 'weibull':
        const { k, lambda } = parameters;
        if (!k || k <= 0 || !lambda || lambda <= 0) return [];
        
        // Weibull distribution range - show from 0 to reasonable upper bound
        const weibullRange = lambda * Math.pow(-Math.log(0.01), 1/k); // Value where CDF = 0.99
        
        for (let i = 0; i <= points; i++) {
          const x = (weibullRange * i) / points;
          if (x < 0) continue; // Weibull is only defined for x >= 0
          
          // Weibull PDF: f(x) = (k/λ) * (x/λ)^(k-1) * e^(-(x/λ)^k) for x >= 0
          if (x === 0) {
            // Handle x = 0 case
            const y = k === 1 ? k / lambda : 0;
            data.push({ x: 0, y: parseFloat(y.toFixed(8)) });
          } else {
            const y = (k / lambda) * Math.pow(x / lambda, k - 1) * Math.exp(-Math.pow(x / lambda, k));
            data.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(8)) });
          }
        }
        break;

      case 'negative-binomial':
        const { r, p } = parameters;
        if (!r || r <= 0 || !p || p <= 0 || p >= 1) return [];
        
        // Negative binomial distribution shows number of trials to get r successes
        const maxTrials = Math.max(30, Math.ceil(r/p + 4*Math.sqrt(r*(1-p)/p/p)));
        
        for (let k = r; k <= maxTrials; k++) {
          // Negative binomial PMF: P(X = k) = C(k-1, r-1) * p^r * (1-p)^(k-r)
          const coefficient = combination(k - 1, r - 1);
          const probability = coefficient * Math.pow(p, r) * Math.pow(1 - p, k - r);
          
          data.push({ 
            x: k, 
            y: parseFloat(probability.toFixed(8)),
            name: k.toString()
          });
        }
        break;

      case 'binomial':
        const { n, p: binomialP } = parameters;
        if (!n || n <= 0 || !binomialP || binomialP < 0 || binomialP > 1) return [];
        
        for (let k = 0; k <= n; k++) {
          // Binomial PMF: P(X = k) = C(n, k) * p^k * (1-p)^(n-k)
          const coefficient = combination(n, k);
          const probability = coefficient * Math.pow(binomialP, k) * Math.pow(1 - binomialP, n - k);
          
          data.push({ 
            x: k, 
            y: parseFloat(probability.toFixed(8)),
            name: k.toString()
          });
        }
        break;

      case 'geometric':
        const { p: geomP } = parameters;
        if (!geomP || geomP <= 0 || geomP >= 1) {
          return [];
        }
        
        // Geometric distribution shows number of trials until first success
        // Calculate range where probability > 0.001: P(X = k) = (1-p)^(k-1) * p > 0.001
        // Solve: k > 1 + log(0.001/p) / log(1-p)
        const maxGeomTrials = Math.min(50, Math.ceil(1 + Math.log(0.001 / geomP) / Math.log(1 - geomP)));
        
        for (let k = 1; k <= maxGeomTrials; k++) {
          // Geometric PMF: P(X = k) = (1-p)^(k-1) * p
          const probability = Math.pow(1 - geomP, k - 1) * geomP;
          
          data.push({ 
            x: k, 
            y: parseFloat(probability.toFixed(8)),
            name: k.toString()
          });
        }
        break;

      case 'discrete-uniform':
        const { min: uniformMin, max: uniformMax } = parameters;
        if ((!uniformMin && uniformMin !== 0) || (!uniformMax && uniformMax !== 0) || uniformMin >= uniformMax) return [];
        
        const uniformRange = uniformMax - uniformMin + 1;
        const probability = 1 / uniformRange;
        
        for (let k = uniformMin; k <= uniformMax; k++) {
          data.push({ 
            x: k, 
            y: parseFloat(probability.toFixed(8)),
            name: k.toString()
          });
        }
        break;

      default:
        return [];
    }

    // Apply deduplication for continuous distributions to prevent duplicate chart keys
    const isDiscrete = ['poisson', 'negative-binomial', 'binomial', 'geometric', 'discrete-uniform'].includes(distributionType);
    return isDiscrete ? data : deduplicateData(data);
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


  let data = generateDistributionData();

  // Use bar chart for discrete distributions, line chart for continuous
  const isDiscrete = ['poisson', 'negative-binomial', 'binomial', 'geometric', 'discrete-uniform'].includes(distributionType);
  const isSmallViewport = window.innerWidth <= 768;
  // Heuristic: If the chart title or label contains 'Loss', treat as loss-based
  const isLossChart = (title && title.toLowerCase().includes('loss')) || (parameters && parameters.lossMean !== undefined);

  // Transform data for log scale if enabled
  let chartData = data;
  let log10floor = -8; // log10(0.00000001) = -8
  if (!isDiscrete && isLossChart && useLogScale) {
    chartData = data.map(d => ({ ...d, y: d.y > 0 ? Math.log10(d.y) : log10floor }));
  }

  if (data.length === 0) {
    return (
      <div className="rar-distribution-chart-placeholder">
        <p>Enter parameters to view distribution chart</p>
      </div>
    );
  }

  return (
    <div className="rar-distribution-chart-container">
      <h5 className="rar-distribution-chart-title">{title}</h5>
      {/* Log scale toggle for loss charts */}
      {!isDiscrete && isLossChart && (
        <div style={{ marginBottom: '8px' }}>
          <button
            type="button"
            className="rar-logscale-toggle"
            style={{
              background: useLogScale ? '#b8860b' : '#eee',
              color: useLogScale ? '#fff' : '#333',
              border: '1px solid #b8860b',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '13px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
            onClick={() => setUseLogScale((prev) => !prev)}
          >
            {useLogScale ? 'Switch to Linear Scale' : 'Switch to Log Scale'}
          </button>
          {useLogScale && (
            <span style={{ color: '#b8860b', fontSize: '13px', marginLeft: '8px' }}>
              Logarithmic scale applied to probability density (y-axis). Values below 1e{log10floor} are shown at the chart floor.
            </span>
          )}
        </div>
      )}
      <div 
        ref={chartRef}
        style={{ 
          width: '100%', 
          height: '270px'
        }}
      >
        {/* For 768px and below, use direct charts with fixed dimensions */}
        {isSmallViewport ? (
          isDiscrete ? (
            <BarChart 
              width={chartDimensions.width}
              height={chartDimensions.height}
              data={chartData}
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
                label={{ value: useLogScale ? 'Log Probability Density' : 'Probability Density', angle: -90, position: 'outside', style: { textAnchor: 'middle' }, offset: 50 }}
              />
              <Tooltip 
                formatter={(value, name) => [useLogScale ? value.toFixed(3) : value.toFixed(6), useLogScale ? 'Log Probability Density' : 'Probability']}
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
              width={chartDimensions.width}
              height={chartDimensions.height}
              data={chartData}
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
                label={{ value: useLogScale ? 'Log Probability Density' : 'Probability Density', angle: -90, position: 'outside', style: { textAnchor: 'middle' }, offset: 50 }}
              />
              <Tooltip 
                formatter={(value, name) => [useLogScale ? value.toFixed(3) : value.toFixed(6), useLogScale ? 'Log Probability Density' : 'Probability Density']}
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
          )
        ) : (
          /* For 769px and above, use ResponsiveContainer */
          <ResponsiveContainer width="100%" height="100%">
            {isDiscrete ? (
              <BarChart 
                data={chartData}
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
                  label={{ value: useLogScale ? 'Log Probability Density' : 'Probability Density', angle: -90, position: 'outside', style: { textAnchor: 'middle' }, offset: 50 }}
                />
                <Tooltip 
                  formatter={(value, name) => [useLogScale ? value.toFixed(3) : value.toFixed(6), useLogScale ? 'Log Probability Density' : 'Probability']}
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
                data={chartData}
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
                  label={{ value: useLogScale ? 'Log Probability Density' : 'Probability Density', angle: -90, position: 'outside', style: { textAnchor: 'middle' }, offset: 50 }}
                />
                <Tooltip 
                  formatter={(value, name) => [useLogScale ? value.toFixed(3) : value.toFixed(6), useLogScale ? 'Log Probability Density' : 'Probability Density']}
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
        )}
      </div>
    </div>
  );
};

// Cumulative Distribution Function Chart Component
export const CumulativeDistributionChart = ({ distributionType, parameters, title, formatCurrency }) => {
  const [percentile, setPercentile] = React.useState(95);
  
  // Force chart dimensions for 768px viewport compatibility
  const [chartDimensions, setChartDimensions] = React.useState({ width: 0, height: 250 });
  const chartRef = React.useRef(null);

  React.useEffect(() => {
    const updateDimensions = () => {
      if (chartRef.current) {
        const containerWidth = chartRef.current.offsetWidth;
        setChartDimensions({
          width: Math.max(containerWidth - 40, 300), // Minimum 300px width
          height: 250
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  const generateCDFData = () => {
    const points = 100;
    const data = [];

    switch (distributionType) {
      case 'triangular':
        const { min, mode, max } = parameters;
        if ((!min && min !== 0) || (!mode && mode !== 0) || (!max && max !== 0)) return [];
        
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

      case 'pert':
        const { min: pertMin, mode: pertMode, max: pertMax, gamma: pertGamma = 4 } = parameters;
        if ((!pertMin && pertMin !== 0) || (!pertMode && pertMode !== 0) || (!pertMax && pertMax !== 0)) return [];
        
        for (let i = 0; i <= points; i++) {
          const x = pertMin + (pertMax - pertMin) * (i / points);
          const t = (x - pertMin) / (pertMax - pertMin); // Normalize to [0,1]
          
          let cdf;
          if (t <= 0) {
            cdf = 0;
          } else if (t >= 1) {
            cdf = 1;
          } else {
            // Calculate CDF using the same Beta parameters as the PDF
            const modePosition = (pertMode - pertMin) / (pertMax - pertMin);
            const pertAlpha = 1 + pertGamma * modePosition;
            const pertBeta = 1 + pertGamma * (1 - modePosition);
            
            // Approximate Beta CDF using incomplete beta function
            // For small values, use series expansion, for larger values use continued fraction
            cdf = incompleteBeta(t, pertAlpha, pertBeta);
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

      case 'gamma':
        const { shape, scale } = parameters;
        if (!shape || shape <= 0 || !scale || scale <= 0) return [];
        
        // Gamma distribution range - use percentiles for better visualization
        const gammaRange = scale * (shape + 4 * Math.sqrt(shape)); // Approximate 99th percentile
        const minGamma = 0.01; // Start slightly above 0
        
        for (let i = 0; i <= points; i++) {
          const x = minGamma + (gammaRange - minGamma) * (i / points);
          if (x <= 0) continue; // Gamma is only defined for x > 0
          
          // Calculate Gamma CDF using incomplete gamma function approximation
          // For simplicity, we'll use a series approximation for the lower incomplete gamma function
          const cdf = incompleteGamma(shape, x / scale) / gamma(shape);
          
          data.push({ 
            x: parseFloat(x.toFixed(2)), 
            cdf: parseFloat((Math.min(1, Math.max(0, cdf)) * 100).toFixed(2)),
            value: x,
            isSelected: (Math.min(1, Math.max(0, cdf)) * 100) <= percentile
          });
        }
        break;

      case 'pareto':
        const { xMin: paretoXMin, alpha: paretoAlphaCDF } = parameters;
        if (!paretoXMin || paretoXMin <= 0 || !paretoAlphaCDF || paretoAlphaCDF <= 0) return [];
        
        // Pareto distribution range - show from xMin to reasonable upper bound
        const paretoCDFRange = paretoXMin * Math.pow(100, 1/paretoAlphaCDF); // Value where CDF = 0.99
        
        for (let i = 0; i <= points; i++) {
          const x = paretoXMin + (paretoCDFRange - paretoXMin) * (i / points);
          if (x < paretoXMin) continue; // Pareto is only defined for x >= xMin
          
          // Pareto CDF: F(x) = 1 - (xₘ/x)^α for x >= xₘ
          const cdf = x >= paretoXMin ? 1 - Math.pow(paretoXMin / x, paretoAlphaCDF) : 0;
          
          data.push({ 
            x: parseFloat(x.toFixed(2)), 
            cdf: parseFloat((Math.min(1, Math.max(0, cdf)) * 100).toFixed(2)),
            value: x,
            isSelected: (Math.min(1, Math.max(0, cdf)) * 100) <= percentile
          });
        }
        break;

      case 'weibull':
        const { k: weibullK, lambda: weibullLambda } = parameters;
        if (!weibullK || weibullK <= 0 || !weibullLambda || weibullLambda <= 0) return [];
        
        // Weibull distribution range - show from 0 to reasonable upper bound
        const weibullCDFRange = weibullLambda * Math.pow(-Math.log(0.01), 1/weibullK); // Value where CDF = 0.99
        
        for (let i = 0; i <= points; i++) {
          const x = (weibullCDFRange * i) / points;
          if (x < 0) continue; // Weibull is only defined for x >= 0
          
          // Weibull CDF: F(x) = 1 - e^(-(x/λ)^k) for x >= 0
          const cdf = x >= 0 ? 1 - Math.exp(-Math.pow(x / weibullLambda, weibullK)) : 0;
          
          data.push({ 
            x: parseFloat(x.toFixed(2)), 
            cdf: parseFloat((Math.min(1, Math.max(0, cdf)) * 100).toFixed(2)),
            value: x,
            isSelected: (Math.min(1, Math.max(0, cdf)) * 100) <= percentile
          });
        }
        break;

      case 'negative-binomial':
        const { r: nbR, p: nbP } = parameters;
        if (!nbR || nbR <= 0 || !nbP || nbP <= 0 || nbP >= 1) return [];
        
        const maxNBTrials = Math.max(30, Math.ceil(nbR/nbP + 4*Math.sqrt(nbR*(1-nbP)/nbP/nbP)));
        
        for (let k = nbR; k <= maxNBTrials; k++) {
          // Calculate cumulative probability P(X <= k) for negative binomial
          let cdf = 0;
          for (let i = nbR; i <= k; i++) {
            const coefficient = combination(i - 1, nbR - 1);
            const pmf = coefficient * Math.pow(nbP, nbR) * Math.pow(1 - nbP, i - nbR);
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

      case 'binomial':
        const { n: binN, p: binP } = parameters;
        if (!binN || binN <= 0 || !binP || binP < 0 || binP > 1) return [];
        
        for (let k = 0; k <= binN; k++) {
          // Calculate cumulative probability P(X <= k) for binomial
          let cdf = 0;
          for (let i = 0; i <= k; i++) {
            const coefficient = combination(binN, i);
            const pmf = coefficient * Math.pow(binP, i) * Math.pow(1 - binP, binN - i);
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

      case 'geometric':
        const { p: geomCDFP } = parameters;
        if (!geomCDFP || geomCDFP <= 0 || geomCDFP >= 1) return [];
        
        const maxGeomCDFTrials = Math.min(50, Math.ceil(1 + Math.log(0.001 / geomCDFP) / Math.log(1 - geomCDFP)));
        
        for (let k = 1; k <= maxGeomCDFTrials; k++) {
          // Geometric CDF: P(X <= k) = 1 - (1-p)^k
          const cdf = 1 - Math.pow(1 - geomCDFP, k);
          
          data.push({ 
            x: k, 
            cdf: parseFloat((cdf * 100).toFixed(2)),
            value: k,
            isSelected: (cdf * 100) <= percentile
          });
        }
        break;

      case 'discrete-uniform':
        const { min: duMin, max: duMax } = parameters;
        if ((!duMin && duMin !== 0) || (!duMax && duMax !== 0) || duMin >= duMax) return [];
        
        for (let k = duMin; k <= duMax; k++) {
          // Discrete uniform CDF: P(X <= k) = (k - min + 1) / (max - min + 1)
          const cdf = (k - duMin + 1) / (duMax - duMin + 1);
          
          data.push({ 
            x: k, 
            cdf: parseFloat((cdf * 100).toFixed(2)),
            value: k,
            isSelected: (cdf * 100) <= percentile
          });
        }
        break;

      default:
        return [];
    }

    return deduplicateData(data);
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

  // Gamma function for CDF calculations
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

  // Incomplete gamma function for gamma distribution CDF
  const incompleteGamma = (a, x) => {
    if (x <= 0) return 0;
    if (a <= 0) return 0;
    
    // Use series expansion for lower incomplete gamma function
    // γ(a,x) = e^(-x) * x^a * Σ(x^n / (a+n)!) for n=0 to ∞
    let sum = 1 / a;
    let term = sum;
    
    for (let n = 1; n < 200; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < 1e-10) break;
    }
    
    return Math.exp(-x + a * Math.log(x) - logGamma(a)) * sum;
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
  const isSmallViewport = window.innerWidth <= 768;

  return (
    <div className="rar-cdf-chart-container">
      <h5 className="rar-cdf-chart-title">{title} - Cumulative Distribution</h5>
      <div 
        ref={chartRef}
        style={{ 
          width: '100%', 
          height: '270px'
        }}
      >
        {/* For 768px and below, use AreaChart directly with fixed dimensions */}
        {isSmallViewport ? (
          <AreaChart 
            width={chartDimensions.width}
            height={chartDimensions.height}
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
        ) : (
          /* For 769px and above, use ResponsiveContainer */
          <ResponsiveContainer width="100%" height="100%">
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
        )}
      </div>
      
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