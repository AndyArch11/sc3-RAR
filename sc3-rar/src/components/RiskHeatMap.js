import React from 'react';

// Joint Unit Cost * Frequency Heat Map Component with Total Loss Contours
const RiskHeatMap = ({ 
  frequencyParams, 
  lossParams, 
  frequencyDistribution = 'triangular', 
  lossDistribution = 'triangular',
  title = 'Risk Heat Map',
  formatCurrency = (value) => `$${value.toLocaleString()}`,
  iterations = 10000,
  isResidual = false,
  valueAtRisk = null,
  expectedAnnualLoss = null,
  valueAtRiskStdDev = null,
  expectedAnnualLossStdDev = null,
  showVaR = true,
  showEAL = true,
  showPercentiles = true
}) => {
  
  // Debug logging for VaR and EAL troubleshooting
  console.log('RiskHeatMap Debug:', {
    frequencyParams,
    lossParams,
    frequencyDistribution,
    lossDistribution,
    valueAtRisk,
    expectedAnnualLoss,
    showVaR,
    showEAL,
    isResidual
  });
  
  // Generate heat map data
  const generateHeatMapData = () => {
    const frequencyBins = 20;
    const lossBins = 20;
    // Use the passed iterations parameter instead of hardcoded value
    const numIterations = Math.max(1000, parseInt(iterations) || 10000); // Ensure minimum 1000 for performance, default to 10000
    
    // Get distribution ranges
    const frequencyRange = getDistributionRange(frequencyDistribution, frequencyParams);
    const lossRange = getDistributionRange(lossDistribution, lossParams);
    
    if (!frequencyRange || !lossRange) return { data: [], contours: [] };
    
    // Create bins
    const frequencyBinWidth = (frequencyRange.max - frequencyRange.min) / frequencyBins;
    const lossBinWidth = (lossRange.max - lossRange.min) / lossBins;
    
    // Initialize density matrix
    const densityMatrix = Array(frequencyBins).fill().map(() => Array(lossBins).fill(0));
    
    // Monte Carlo sampling to populate density matrix
    for (let i = 0; i < numIterations; i++) {
      const frequency = sampleFromDistribution(frequencyDistribution, frequencyParams);
      const loss = sampleFromDistribution(lossDistribution, lossParams);
      
      // Find bin indices
      const freqBin = Math.min(Math.floor((frequency - frequencyRange.min) / frequencyBinWidth), frequencyBins - 1);
      const lossBin = Math.min(Math.floor((loss - lossRange.min) / lossBinWidth), lossBins - 1);
      
      if (freqBin >= 0 && lossBin >= 0) {
        densityMatrix[freqBin][lossBin]++;
      }
    }
    
    // Convert to probability density
    const totalSamples = numIterations;
    const binArea = frequencyBinWidth * lossBinWidth;
    
    // Create heat map data
    const heatMapData = [];
    let maxDensity = 0;
    
    for (let i = 0; i < frequencyBins; i++) {
      for (let j = 0; j < lossBins; j++) {
        const frequency = frequencyRange.min + (i + 0.5) * frequencyBinWidth;
        const loss = lossRange.min + (j + 0.5) * lossBinWidth;
        
        // Calculate true probability density
        const binCount = densityMatrix[i][j];
        const probability = binCount / totalSamples; // Probability mass in this bin
        const density = probability / binArea; // True probability density (probability per unit area)
        
        const totalLoss = frequency * loss;
        
        maxDensity = Math.max(maxDensity, density);
        
        heatMapData.push({
          frequency,
          loss,
          density,
          probability, // Also store probability for tooltip
          binCount, // Also store raw count for debugging
          totalLoss,
          x: i,
          y: j
        });
      }
    }
    
    // Normalize densities for visualization (0-1 scale for color mapping)
    const normalizedData = heatMapData.map(item => ({
      ...item,
      normalizedDensity: maxDensity > 0 ? item.density / maxDensity : 0
    }));
    
    // Generate contour lines for total loss
    const contourLevels = generateContourLevels(normalizedData);
    
    return {
      data: normalizedData,
      contours: contourLevels,
      frequencyRange,
      lossRange,
      frequencyBinWidth,
      lossBinWidth,
      maxDensity, // Include actual max density for reference
      totalSamples
    };
  };
  
  // Get distribution range
  const getDistributionRange = (distribution, params) => {
    if (!params) return { min: 0, max: 1 };
    
    switch (distribution) {
      case 'triangular':
        return {
          min: Math.max(0, params.min || 0),
          max: params.max || 1
        };
      case 'normal':
        const range = 4 * (params.std || 1);
        return {
          min: Math.max(0, (params.mean || 0) - range),
          max: (params.mean || 0) + range
        };
      case 'lognormal':
        // Use mean and std parameters (which represent mu and sigma of underlying normal)
        const mu = params.mean || 0;
        const sigma = Math.max(0.1, params.std || 1); // Ensure positive sigma
        // Calculate range based on percentiles of log-normal distribution
        const p01 = Math.exp(mu - 2.33 * sigma); // 1st percentile
        const p99 = Math.exp(mu + 2.33 * sigma); // 99th percentile
        return {
          min: Math.max(0.01, p01),
          max: p99
        };
      case 'uniform':
        return {
          min: Math.max(0, params.min || 0),
          max: params.max || 1
        };
      case 'poisson':
        const lambda = params.lambda || 1;
        return {
          min: 0,
          max: lambda + 4 * Math.sqrt(lambda)
        };
      case 'exponential':
        const rate = params.lambda || 1;
        return {
          min: 0,
          max: -Math.log(0.001) / rate  // 99.9th percentile
        };
      case 'beta':
        return {
          min: Math.max(0, params.min || 0),
          max: params.max || 1
        };
      default:
        return { min: 0, max: 1 };
    }
  };
  
  // Sample from distribution
  const sampleFromDistribution = (distribution, params) => {
    if (!params) return Math.random();
    
    const random = Math.random();
    
    switch (distribution) {
      case 'triangular':
        return sampleTriangular(params.min || 0, params.mode || 0.5, params.max || 1, random);
      case 'normal':
        return Math.max(0, sampleNormal(params.mean || 0, params.std || 1));
      case 'lognormal':
        const normalSample = sampleNormal(0, 1);
        const mu = params.mean || 0;  // Use mean parameter as mu
        const sigma = Math.max(0.1, params.std || 1); // Use std parameter as sigma, ensure positive
        return Math.exp(mu + sigma * normalSample);
      case 'uniform':
        return (params.min || 0) + random * ((params.max || 1) - (params.min || 0));
      case 'poisson':
        return samplePoisson(params.lambda || 1);
      case 'exponential':
        return -Math.log(1 - random) / (params.lambda || 1);
      case 'beta':
        const betaSample = sampleBeta(params.alpha || 2, params.beta || 2);
        return (params.min || 0) + betaSample * ((params.max || 1) - (params.min || 0));
      default:
        return random;
    }
  };
  
  // Triangular distribution sampling
  const sampleTriangular = (min, mode, max, random) => {
    const F_mode = (mode - min) / (max - min);
    if (random < F_mode) {
      return min + Math.sqrt(random * (max - min) * (mode - min));
    } else {
      return max - Math.sqrt((1 - random) * (max - min) * (max - mode));
    }
  };
  
  // Normal distribution sampling (Box-Muller transform)
  const sampleNormal = (mean, stdDev) => {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + stdDev * z0;
  };
  
  // Poisson distribution sampling
  const samplePoisson = (lambda) => {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    
    return k - 1;
  };
  
  // Beta distribution sampling
  const sampleBeta = (alpha, beta) => {
    const gamma1 = sampleGamma(alpha);
    const gamma2 = sampleGamma(beta);
    return gamma1 / (gamma1 + gamma2);
  };
  
  // Gamma distribution sampling (for Beta distribution)
  const sampleGamma = (shape) => {
    if (shape < 1) {
      return sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
    }
    
    const d = shape - 1/3;
    const c = 1 / Math.sqrt(9 * d);
    
    let z, u, v;
    do {
      do {
        z = sampleNormal(0, 1);
        v = 1 + c * z;
      } while (v <= 0);
      
      v = v * v * v;
      u = Math.random();
    } while (u >= 1 - 0.0331 * z * z * z * z && 
             Math.log(u) >= 0.5 * z * z + d * (1 - v + Math.log(v)));
    
    return d * v;
  };
  
  // Generate contour levels
  const generateContourLevels = (data) => {
    const totalLosses = data.map(d => d.totalLoss).filter(loss => loss > 0);
    totalLosses.sort((a, b) => a - b);
    
    const percentiles = [25, 50, 75, 90, 95];
    const contours = percentiles.map(p => {
      const index = Math.floor((p / 100) * totalLosses.length);
      return {
        level: p,
        value: totalLosses[index] || 0,
        type: 'percentile'
      };
    });
    
    // Add VaR line if provided and enabled
    let actualVaR = null;
    let varStdDev = null;
    if (showVaR && valueAtRisk) {
      if (typeof valueAtRisk === 'number' && valueAtRisk > 0) {
        actualVaR = valueAtRisk;
        varStdDev = valueAtRiskStdDev || actualVaR * 0.1; // Default to 10% if not provided
      } else if (typeof valueAtRisk === 'object' && valueAtRisk.valueAtRisk && valueAtRisk.valueAtRisk > 0) {
        actualVaR = valueAtRisk.valueAtRisk;
        varStdDev = valueAtRisk.standardDeviation || valueAtRiskStdDev || actualVaR * 0.1;
      }
    }
    
    if (actualVaR && actualVaR > 0) {
      console.log('VaR Details:', {
        actualVaR,
        varStdDev,
        totalLossRange: [Math.min(...totalLosses), Math.max(...totalLosses)],
        withinRange: actualVaR >= Math.min(...totalLosses) && actualVaR <= Math.max(...totalLosses)
      });
      
      // Add main VaR contour
      contours.push({
        level: 'VaR',
        value: actualVaR,
        stdDev: varStdDev,
        type: 'var'
      });
      
      // Add VaR confidence bands (±1 standard deviation)
      if (varStdDev > 0) {
        contours.push({
          level: 'VaR-1σ',
          value: Math.max(0, actualVaR - varStdDev),
          stdDev: varStdDev,
          type: 'var-band',
          bandType: 'lower'
        });
        contours.push({
          level: 'VaR+1σ',
          value: actualVaR + varStdDev,
          stdDev: varStdDev,
          type: 'var-band',
          bandType: 'upper'
        });
      }
    }
    
    // Add EAL line if provided and enabled
    let actualEAL = null;
    let ealStdDev = null;
    if (showEAL && expectedAnnualLoss) {
      if (typeof expectedAnnualLoss === 'number' && expectedAnnualLoss > 0) {
        actualEAL = expectedAnnualLoss;
        ealStdDev = expectedAnnualLossStdDev || actualEAL * 0.1; // Default to 10% if not provided
      } else if (typeof expectedAnnualLoss === 'object' && expectedAnnualLoss.expectedAnnualLoss && expectedAnnualLoss.expectedAnnualLoss > 0) {
        actualEAL = expectedAnnualLoss.expectedAnnualLoss;
        ealStdDev = expectedAnnualLoss.standardDeviation || expectedAnnualLossStdDev || actualEAL * 0.1;
      }
    }
    
    if (actualEAL && actualEAL > 0) {
      console.log('EAL Details:', {
        actualEAL,
        ealStdDev,
        totalLossRange: [Math.min(...totalLosses), Math.max(...totalLosses)],
        withinRange: actualEAL >= Math.min(...totalLosses) && actualEAL <= Math.max(...totalLosses)
      });
      
      // Add main EAL contour
      contours.push({
        level: 'EAL',
        value: actualEAL,
        stdDev: ealStdDev,
        type: 'eal'
      });
      
      // Add EAL confidence bands (±1 standard deviation)
      if (ealStdDev > 0) {
        contours.push({
          level: 'EAL-1σ',
          value: Math.max(0, actualEAL - ealStdDev),
          stdDev: ealStdDev,
          type: 'eal-band',
          bandType: 'lower'
        });
        contours.push({
          level: 'EAL+1σ',
          value: actualEAL + ealStdDev,
          stdDev: ealStdDev,
          type: 'eal-band',
          bandType: 'upper'
        });
      }
    }
    
    return contours;
  };
  
  // Get color for density
  const getDensityColor = (density) => {
    const intensity = Math.max(0, Math.min(1, density));
    const alpha = 0.3 + 0.7 * intensity;
    return `rgba(255, ${Math.floor(255 * (1 - intensity))}, ${Math.floor(255 * (1 - intensity))}, ${alpha})`;
  };
  
  // Get contour color
  const getContourColor = (level) => {
    const colors = {
      25: '#4CAF50',  // Green
      50: '#FFC107',  // Yellow
      75: '#FF9800',  // Orange
      90: '#F44336',  // Red
      95: '#9C27B0'   // Purple
    };
    return colors[level] || '#000';
  };
  
  const { data, contours, frequencyRange, lossRange, totalSamples } = generateHeatMapData();
  
  if (!data.length) {
    return (
      <div className="rar-heatmap-placeholder">
        <p>Enter distribution parameters to view risk heat map</p>
      </div>
    );
  }
  
  const cellSize = 15;
  const margin = { top: 40, right: 180, bottom: 60, left: 120 };
  const width = 20 * cellSize + margin.left + margin.right;
  const height = 20 * cellSize + margin.top + margin.bottom;
  
  return (
    <div className="rar-heatmap-container">
      <h5 className="rar-heatmap-title">{title}</h5>
      <div className="rar-heatmap-chart">
        <svg width={width} height={height}>
          <defs>
            {/* Gradient for legend */}
            <linearGradient id="heatmap-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.3)" />
              <stop offset="100%" stopColor="rgba(255, 0, 0, 1)" />
            </linearGradient>
          </defs>
          
          {/* Heat map cells */}
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {data.map((d, i) => (
              <rect
                key={i}
                x={d.x * cellSize}
                y={(19 - d.y) * cellSize} // Flip Y-axis
                width={cellSize}
                height={cellSize}
                fill={getDensityColor(d.normalizedDensity)}
                stroke="#fff"
                strokeWidth="0.5"
              >
                <title>
                  {`Frequency: ${d.frequency.toFixed(3)}/year\nLoss: ${formatCurrency(d.loss)}\nTotal Loss: ${formatCurrency(d.totalLoss)}\nProbability: ${(d.probability * 100).toFixed(2)}%\nSamples: ${d.binCount}/${totalSamples}`}
                </title>
              </rect>
            ))}
            
            {/* Contour lines */}
            {contours.map((contour, i) => {
              const isVaR = contour.type === 'var';
              const isEAL = contour.type === 'eal';
              const isVaRBand = contour.type === 'var-band';
              const isEALBand = contour.type === 'eal-band';
              const isPercentile = contour.type === 'percentile';
              
              // Skip percentile contours if they're disabled
              if (isPercentile && !showPercentiles) {
                return null;
              }
              
              // Skip VaR bands if VaR is disabled
              if (isVaRBand && !showVaR) {
                return null;
              }
              
              // Skip EAL bands if EAL is disabled
              if (isEALBand && !showEAL) {
                return null;
              }
              
              // For main VaR and EAL lines, remove the scattered circles and just show the smooth curve
              if (isVaR || isEAL) {
                return (
                  <g key={i}>
                    {/* Draw iso-loss curve: frequency * loss = Value */}
                    {(() => {
                      const curvePoints = [];
                      for (let j = 0; j < 100; j++) { // Use more points for smoother curve
                        const frequency = frequencyRange.min + (j / 99) * (frequencyRange.max - frequencyRange.min);
                        const requiredLoss = contour.value / frequency;
                        
                        // Only include points if the required loss is within our loss range
                        if (requiredLoss >= lossRange.min && requiredLoss <= lossRange.max) {
                          const x = (j / 99) * 20 * cellSize;
                          const lossRatio = (requiredLoss - lossRange.min) / (lossRange.max - lossRange.min);
                          const y = (1 - lossRatio) * 20 * cellSize; // Flip y-axis
                          curvePoints.push(`${x},${y}`);
                        }
                      }
                      
                      if (curvePoints.length > 1) {
                        return (
                          <path
                            d={`M ${curvePoints.join(' L ')}`}
                            stroke={isVaR ? "#0066ff" : "#00cc66"}
                            strokeWidth="3"
                            fill="none"
                            opacity="0.9"
                            strokeDasharray={isVaR ? "none" : "8,4"} // Solid line for VaR, dashed for EAL
                          />
                        );
                      }
                      return null;
                    })()}
                  </g>
                );
              }
              
              // For confidence bands, draw thinner, semi-transparent curves
              if (isVaRBand || isEALBand) {
                return (
                  <g key={i}>
                    {(() => {
                      const curvePoints = [];
                      for (let j = 0; j < 100; j++) {
                        const frequency = frequencyRange.min + (j / 99) * (frequencyRange.max - frequencyRange.min);
                        const requiredLoss = contour.value / frequency;
                        
                        if (requiredLoss >= lossRange.min && requiredLoss <= lossRange.max) {
                          const x = (j / 99) * 20 * cellSize;
                          const lossRatio = (requiredLoss - lossRange.min) / (lossRange.max - lossRange.min);
                          const y = (1 - lossRatio) * 20 * cellSize;
                          curvePoints.push(`${x},${y}`);
                        }
                      }
                      
                      if (curvePoints.length > 1) {
                        const baseColor = isVaRBand ? "#0066ff" : "#00cc66";
                        return (
                          <path
                            d={`M ${curvePoints.join(' L ')}`}
                            stroke={baseColor}
                            strokeWidth="1"
                            fill="none"
                            opacity="0.4"
                            strokeDasharray="3,2"
                          />
                        );
                      }
                      return null;
                    })()}
                  </g>
                );
              }
              
              // For percentile contours, use original scattered circle approach
              const contourData = data.filter(d => 
                Math.abs(d.totalLoss - contour.value) / Math.max(contour.value, 1) < 0.1
              );
              
              return (
                <g key={i}>
                  {contourData.map((point, j) => (
                    <circle
                      key={j}
                      cx={point.x * cellSize + cellSize/2}
                      cy={(19 - point.y) * cellSize + cellSize/2}
                      r="3"
                      fill={getContourColor(contour.level)}
                      stroke="white"
                      strokeWidth="1"
                      opacity="0.8"
                    />
                  ))}
                </g>
              );
            }).filter(Boolean)}
          </g>
          
          {/* X-axis */}
          <g transform={`translate(${margin.left}, ${height - margin.bottom})`}>
            <line x1="0" y1="0" x2={20 * cellSize} y2="0" stroke="#000" />
            <text x={10 * cellSize} y="25" textAnchor="middle" fontSize="12">
              Frequency (events/year)
            </text>
            {[0, 5, 10, 15, 19].map(i => (
              <g key={i}>
                <line x1={i * cellSize} y1="0" x2={i * cellSize} y2="5" stroke="#000" />
                <text x={i * cellSize} y="15" textAnchor="middle" fontSize="10">
                  {(frequencyRange.min + (i / 19) * (frequencyRange.max - frequencyRange.min)).toFixed(2)}
                </text>
              </g>
            ))}
          </g>
          
          {/* Y-axis */}
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            <line x1="0" y1="0" x2="0" y2={20 * cellSize} stroke="#000" />
            <text x="-70" y={10 * cellSize} textAnchor="middle" fontSize="12" transform={`rotate(-90, -70, ${10 * cellSize})`}>
              Unit Cost
            </text>
            {[0, 5, 10, 15, 19].map(i => (
              <g key={i}>
                <line x1="-5" y1={(19-i) * cellSize} x2="0" y2={(19-i) * cellSize} stroke="#000" />
                <text x="-10" y={(19-i) * cellSize + 3} textAnchor="end" fontSize="10">
                  {formatCurrency(lossRange.min + (i / 19) * (lossRange.max - lossRange.min))}
                </text>
              </g>
            ))}
          </g>
          
          {/* Legend */}
          <g transform={`translate(${width - margin.right + 10}, ${margin.top})`}>
            <text x="0" y="-5" fontSize="12" fontWeight="bold">Probability Density</text>
            <rect x="0" y="0" width="80" height="15" fill="url(#heatmap-gradient)" />
            <text x="0" y="30" fontSize="10">Low</text>
            <text x="65" y="30" fontSize="10">High</text>
            
            <text x="0" y="60" fontSize="12" fontWeight="bold">Total Loss Contours</text>
            {contours.map((contour, i) => {
              const isVaR = contour.type === 'var';
              const isEAL = contour.type === 'eal';
              const isVaRBand = contour.type === 'var-band';
              const isEALBand = contour.type === 'eal-band';
              const isPercentile = contour.type === 'percentile';
              
              // Skip percentile contours if they're disabled
              if (isPercentile && !showPercentiles) {
                return null;
              }
              
              // Skip VaR bands if VaR is disabled
              if (isVaRBand && !showVaR) {
                return null;
              }
              
              // Skip EAL bands if EAL is disabled
              if (isEALBand && !showEAL) {
                return null;
              }
              
              let legendText = '';
              let strokeDashArray = 'none';
              let opacity = 1;
              
              if (isVaR) {
                legendText = `VaR: ${formatCurrency(contour.value)}`;
              } else if (isEAL) {
                legendText = `EAL: ${formatCurrency(contour.value)}`;
                strokeDashArray = '8,4';
              } else if (isVaRBand) {
                legendText = `VaR ±1σ: ${formatCurrency(contour.value)}`;
                strokeDashArray = '3,2';
                opacity = 0.6;
              } else if (isEALBand) {
                legendText = `EAL ±1σ: ${formatCurrency(contour.value)}`;
                strokeDashArray = '3,2';
                opacity = 0.6;
              } else {
                legendText = `${contour.level}%: ${formatCurrency(contour.value)}`;
              }
              
              return (
                <g key={i} transform={`translate(0, ${80 + i * 20})`}>
                  {(isVaR || isEAL || isVaRBand || isEALBand) ? (
                    <line 
                      x1="0" 
                      y1="0" 
                      x2="10" 
                      y2="0" 
                      stroke={isVaR || isVaRBand ? "#0066ff" : "#00cc66"} 
                      strokeWidth={isVaR || isEAL ? "3" : "1"}
                      strokeDasharray={strokeDashArray}
                      opacity={opacity}
                    />
                  ) : (
                    <circle 
                      cx="5" 
                      cy="0" 
                      r="3" 
                      fill={getContourColor(contour.level)} 
                      stroke="white" 
                      strokeWidth="1" 
                    />
                  )}
                  <text x="15" y="3" fontSize="10" fontWeight={isVaR || isEAL ? "bold" : "normal"} opacity={opacity}>
                    {legendText}
                  </text>
                </g>
              );
            }).filter(Boolean)}
          </g>
        </svg>
      </div>
      
      <div className="rar-heatmap-info">
        <p className="rar-heatmap-description">
          This heat map shows the joint probability distribution of frequency and unit cost combinations.
          Color intensity represents the probability of occurrence for each frequency-cost combination.
          Darker red areas indicate higher probability regions. Contour lines represent percentiles of total loss (frequency × unit cost).
          Hover over cells to see exact probability values and sample counts.
        </p>
        <p className="rar-heatmap-note">
          <strong>Note:</strong> Heat map contour percentiles are visual approximations based on grid discretization and may differ from 
          the Monte Carlo Simulation Results percentiles above, which use the full simulation data and provide more accurate statistical values.
        </p>
      </div>
    </div>
  );
};

export default RiskHeatMap;
