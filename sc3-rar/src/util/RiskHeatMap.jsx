import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { pert } from './distributions';

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
  showPercentiles = true,
  isTabActive = true // New parameter to control modal visibility
}) => {
  
  // State for forcing re-generation of heat map
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Modal state for heat map viewing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalZoom, setModalZoom] = useState(1);
  
  // Refs for modal handling
  const heatmapRef = useRef(null);
  
  // Refresh handler
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  // Modal handlers
  const openModal = useCallback(() => {
    setIsModalOpen(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
  }, []);
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalZoom(1);
    // Restore body scroll when modal is closed
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
  }, []);
  const zoomIn = useCallback(() => {
    setModalZoom(prev => {
      const newZoom = Math.min(prev + 0.25, 5);
      return newZoom;
    });
  }, []);
  const zoomOut = useCallback(() => {
    setModalZoom(prev => {
      const newZoom = Math.max(prev - 0.25, 0.5);
      return newZoom;
    });
  }, []);
  const resetZoom = useCallback(() => {
    setModalZoom(1);
  }, []);
  
  // Simple double-click handler
  const handleDoubleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Double-click detected on heat map, opening modal');
    console.log('isTabActive:', isTabActive);
    openModal();
  }, [openModal, isTabActive]);
  
  // Generate heat map data
  const generateHeatMapData = useCallback(() => {
    const frequencyBins = 20;
    const lossBins = 20;
    // Use the passed iterations parameter instead of hardcoded value
    const numIterations = Math.max(1000, parseInt(iterations) || 10000); // Ensure minimum 1000 for performance, default to 10000
    
    // Get distribution ranges
    const frequencyRange = getDistributionRange(frequencyDistribution, frequencyParams);
    const lossRange = getDistributionRange(lossDistribution, lossParams);
    
    if (!frequencyRange || !lossRange) return { data: [], contours: [] };
    
    // Ensure minimum range to prevent division by zero
    const minFreqRange = Math.max(frequencyRange.max - frequencyRange.min, 0.001);
    const minLossRange = Math.max(lossRange.max - lossRange.min, 0.001);
    
    // Create bins
    const frequencyBinWidth = minFreqRange / frequencyBins;
    const lossBinWidth = minLossRange / lossBins;
    
    // Initialize density matrix
    const densityMatrix = Array(frequencyBins).fill().map(() => Array(lossBins).fill(0));
    
    // Monte Carlo sampling to populate density matrix
    for (let i = 0; i < numIterations; i++) {
      const frequency = sampleFromDistribution(frequencyDistribution, frequencyParams);
      const loss = sampleFromDistribution(lossDistribution, lossParams);
      
      // Skip invalid samples
      if (!isFinite(frequency) || !isFinite(loss) || frequency < 0 || loss < 0) {
        continue;
      }
      
      // Find bin indices
      const freqBin = Math.min(Math.floor((frequency - frequencyRange.min) / frequencyBinWidth), frequencyBins - 1);
      const lossBin = Math.min(Math.floor((loss - lossRange.min) / lossBinWidth), lossBins - 1);
      
      if (freqBin >= 0 && lossBin >= 0 && freqBin < frequencyBins && lossBin < lossBins) {
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
    
    // Normalise densities for visualisation (0-1 scale for colour mapping)
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
  }, [frequencyParams, lossParams, frequencyDistribution, lossDistribution, iterations]);
  
  // Get distribution range
  const getDistributionRange = (distribution, params) => {
    if (!params) return { min: 0, max: 1 };
    
    switch (distribution) {
      case 'triangular':
        return {
          min: Math.max(0, params.min || 0),
          max: params.max || 1
        };
      case 'pert':
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
      case 'gamma':
        const gammaShape = params.shape || 2;
        const gammaScale = params.scale || 1000;
        // Range from near 0 to 99th percentile
        return {
          min: 0.01,
          max: gammaScale * (gammaShape + 4 * Math.sqrt(gammaShape))
        };
      case 'pareto':
        const paretoXMin = params.xMin || 1000;
        const paretoAlpha = params.alpha || 2;
        // Range from xMin to 99th percentile
        return {
          min: paretoXMin,
          max: paretoXMin / Math.pow(0.01, 1 / paretoAlpha)
        };
      case 'weibull':
        const weibullK = params.k || 2;
        const weibullLambda = params.lambda || 10000;
        // Range from near 0 to 99th percentile
        return {
          min: 0.01,
          max: weibullLambda * Math.pow(-Math.log(0.01), 1 / weibullK)
        };
      case 'negativeBinomial':
      case 'negative-binomial':
        const negBinR = params.r || 5;
        const negBinP = params.p || 0.3;
        // Range from 0 to approximate 99th percentile
        const negBinMean = negBinR * (1 - negBinP) / negBinP;
        const negBinVar = negBinR * (1 - negBinP) / (negBinP * negBinP);
        return {
          min: 0,
          max: Math.max(20, negBinMean + 4 * Math.sqrt(negBinVar))
        };
      case 'binomial':
        const binN = params.n || 20;
        return {
          min: 0,
          max: binN
        };
      case 'geometric':
        const geomP = params.p || 0.2;
        // Range from 1 to 99th percentile
        // For geometric: P(X <= k) = 1 - (1-p)^k = 0.99 => (1-p)^k = 0.01 => k = log(0.01)/log(1-p)
        return {
          min: 1,
          max: Math.max(10, Math.ceil(Math.log(0.01) / Math.log(1 - geomP)))
        };
      case 'discreteUniform':
      case 'discrete-uniform':
        return {
          min: params.min || 1,
          max: params.max || 10
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
      case 'pert':
        return pert(params.min || 0, params.mode || 0.5, params.max || 1, params.gamma || 4);
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
      case 'gamma':
        return sampleGamma(params.shape || 2, params.scale || 1000);
      case 'pareto':
        return samplePareto(params.xMin || 1000, params.alpha || 2);
      case 'weibull':
        return sampleWeibull(params.k || 2, params.lambda || 10000);
      case 'negativeBinomial':
      case 'negative-binomial':
        return sampleNegativeBinomial(params.r || 5, params.p || 0.3);
      case 'binomial':
        return sampleBinomial(params.n || 20, params.p || 0.1);
      case 'geometric':
        return sampleGeometric(params.p || 0.2);
      case 'discreteUniform':
      case 'discrete-uniform':
        return sampleDiscreteUniform(params.min || 1, params.max || 10);
      default:
        return random;
    }
  };
  
  // Triangular distribution sampling
  const sampleTriangular = (min, mode, max, random) => {
    // Handle degenerate case where min = max
    if (max === min) {
      return min;
    }
    
    // Ensure mode is within bounds
    const boundedMode = Math.max(min, Math.min(mode, max));
    
    const F_mode = (boundedMode - min) / (max - min);
    if (random < F_mode) {
      return min + Math.sqrt(random * (max - min) * (boundedMode - min));
    } else {
      return max - Math.sqrt((1 - random) * (max - min) * (max - boundedMode));
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
    const gamma1 = sampleGammaForBeta(alpha);
    const gamma2 = sampleGammaForBeta(beta);
    return gamma1 / (gamma1 + gamma2);
  };
  
  // Gamma distribution sampling (for Beta distribution)
  const sampleGammaForBeta = (shape) => {
    if (shape < 1) {
      return sampleGammaForBeta(shape + 1) * Math.pow(Math.random(), 1 / shape);
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

  // Gamma distribution sampling (for new Gamma distribution with shape and scale)
  const sampleGamma = (shape, scale) => {
    return sampleGammaForBeta(shape) * scale;
  };

  // Pareto distribution sampling
  const samplePareto = (xMin, alpha) => {
    const u = Math.random();
    return xMin / Math.pow(u, 1 / alpha);
  };

  // Weibull distribution sampling
  const sampleWeibull = (k, lambda) => {
    const u = Math.random();
    return lambda * Math.pow(-Math.log(1 - u), 1 / k);
  };

  // Negative Binomial distribution sampling
  const sampleNegativeBinomial = (r, p) => {
    let count = 0;
    let failures = 0;
    while (failures < r) {
      if (Math.random() < p) {
        failures++;
      } else {
        count++;
      }
    }
    return count;
  };

  // Binomial distribution sampling
  const sampleBinomial = (n, p) => {
    let count = 0;
    for (let i = 0; i < n; i++) {
      if (Math.random() < p) {
        count++;
      }
    }
    return count;
  };

  // Geometric distribution sampling
  const sampleGeometric = (p) => {
    return Math.floor(Math.log(Math.random()) / Math.log(1 - p)) + 1;
  };

  // Discrete Uniform distribution sampling
  const sampleDiscreteUniform = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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
  
  // Get colour for density
  const getDensityColor = (density) => {
    const intensity = Math.max(0, Math.min(1, density));
    const alpha = 0.3 + 0.7 * intensity;
    return `rgba(255, ${Math.floor(255 * (1 - intensity))}, ${Math.floor(255 * (1 - intensity))}, ${alpha})`;
  };
  
  // Get contour colour
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
  
  // Helper function to format currency values compactly for mobile
  const formatCompactCurrency = (value) => {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    } else {
      return `$${Math.round(value)}`;
    }
  };
  
  const { data, contours, frequencyRange, lossRange, totalSamples } = useMemo(() => 
    generateHeatMapData(), 
    [generateHeatMapData, refreshKey]
  );
  
  // Cleanup body scroll on unmount or modal state change
  useEffect(() => {
    return () => {
      // Ensure body scroll is restored when component unmounts
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    };
  }, []);

  // Also cleanup when modal closes to ensure consistency
  useEffect(() => {
    if (!isModalOpen) {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    }
  }, [isModalOpen]);

  // Add keyboard support for modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isModalOpen) return;
      
      switch(e.key) {
        case 'Escape':
          e.preventDefault();
          closeModal();
          break;
        case '+':
        case '=':
          e.preventDefault();
          if (modalZoom < 5) zoomIn();
          break;
        case '-':
        case '_':
          e.preventDefault();
          if (modalZoom > 0.5) zoomOut();
          break;
        case '0':
          e.preventDefault();
          resetZoom();
          break;
        default:
          break;
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isModalOpen, modalZoom, closeModal, zoomIn, zoomOut, resetZoom]);
  
  // Early return if tab is not active to prevent cross-contamination
  if (!isTabActive) {
    return null;
  }
  
  if (!data.length) {
    return (
      <div className="rar-heatmap-placeholder">
        <p>Enter distribution parameters to view risk heat map</p>
      </div>
    );
  }
  
  const cellSize = 15;
  const margin = { top: 40, right: 200, bottom: 100, left: 120 };
  const width = 20 * cellSize + margin.left + margin.right;
  const height = 20 * cellSize + margin.top + margin.bottom;
  
  console.log('Heat map dimensions:', { width, height, cellSize, margin });
  
  return (
    <div className="rar-heatmap-container">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '10px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <h5 className="rar-heatmap-title" style={{ margin: 0, flex: '1', minWidth: '0' }}>{title}</h5>
        <button 
          type="button"
          onClick={handleRefresh}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}
          title="Refresh heat map to visualize Monte Carlo variance"
        >
          🔄 Refresh
        </button>
      </div>
      <div className="rar-heatmap-chart-container">
        <div 
          className="rar-heatmap-chart"
          ref={heatmapRef}
          style={{ 
            cursor: 'pointer',
            minWidth: `${width}px`,
            minHeight: `${height}px`,
            overflow: 'visible'
          }}
          title="Double-click to open in modal view"
        >
          <svg width={width} height={height} onDoubleClick={handleDoubleClick}>
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
            <text x={10 * cellSize} y="35" textAnchor="middle" fontSize="12">
              Frequency (events/year)
            </text>
            {[0, 5, 10, 15, 19].map(i => (
              <g key={i}>
                <line x1={i * cellSize} y1="0" x2={i * cellSize} y2="5" stroke="#000" />
                <text x={i * cellSize} y="20" textAnchor="middle" fontSize="10">
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
            {[0, 5, 10, 15, 19].map(i => {
              const value = lossRange.min + (i / 19) * (lossRange.max - lossRange.min);
              return (
                <g key={i}>
                  <line x1="-5" y1={(19-i) * cellSize} x2="0" y2={(19-i) * cellSize} stroke="#000" />
                  <text x="-10" y={(19-i) * cellSize + 3} textAnchor="end" fontSize="10">
                    {window.innerWidth <= 768 ? formatCompactCurrency(value) : formatCurrency(value)}
                  </text>
                </g>
              );
            })}
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
      </div>
      
      <div className="rar-heatmap-info">
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6', 
          borderRadius: '6px', 
          padding: '12px', 
          margin: '12px 0',
          fontSize: '13px',
          lineHeight: '1.4'
        }}>
          <h6 style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#495057' }}>
            {isResidual ? 'Residual Risk Parameters' : 'Inherent Risk Parameters'}
          </h6>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '12px', 
            marginBottom: '8px'
          }}>
            <div>
              <strong>Frequency Distribution:</strong> {frequencyDistribution}
              <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px', wordWrap: 'break-word' }}>
                {frequencyDistribution === 'triangular' && frequencyParams && (
                  `Min: ${(frequencyParams.min !== undefined && frequencyParams.min !== null ? frequencyParams.min : 0).toFixed(2)}, Mode: ${(frequencyParams.mode !== undefined && frequencyParams.mode !== null ? frequencyParams.mode : 0).toFixed(2)}, Max: ${(frequencyParams.max !== undefined && frequencyParams.max !== null ? frequencyParams.max : 0).toFixed(2)}`
                )}
                {frequencyDistribution === 'normal' && frequencyParams && (
                  `Mean: ${(frequencyParams.mean !== undefined && frequencyParams.mean !== null ? frequencyParams.mean : 0).toFixed(2)}, Std: ${(frequencyParams.std !== undefined && frequencyParams.std !== null ? frequencyParams.std : 0).toFixed(2)}`
                )}
                {frequencyDistribution === 'uniform' && frequencyParams && (
                  `Min: ${(frequencyParams.min !== undefined && frequencyParams.min !== null ? frequencyParams.min : 0).toFixed(2)}, Max: ${(frequencyParams.max !== undefined && frequencyParams.max !== null ? frequencyParams.max : 0).toFixed(2)}`
                )}
                {frequencyDistribution === 'poisson' && frequencyParams && (
                  `Lambda: ${(frequencyParams.lambda !== undefined && frequencyParams.lambda !== null ? frequencyParams.lambda : 0).toFixed(2)}`
                )}
                {frequencyDistribution === 'exponential' && frequencyParams && (
                  `Lambda: ${(frequencyParams.lambda !== undefined && frequencyParams.lambda !== null ? frequencyParams.lambda : 0).toFixed(2)}`
                )}
              </div>
            </div>
            
            <div>
              <strong>Loss Distribution:</strong> {lossDistribution}
              <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px', wordWrap: 'break-word' }}>
                {lossDistribution === 'triangular' && lossParams && (
                  `Min: ${formatCurrency(lossParams.min !== undefined && lossParams.min !== null ? lossParams.min : 0)}, Mode: ${formatCurrency(lossParams.mode !== undefined && lossParams.mode !== null ? lossParams.mode : 0)}, Max: ${formatCurrency(lossParams.max !== undefined && lossParams.max !== null ? lossParams.max : 0)}`
                )}
                {lossDistribution === 'normal' && lossParams && (
                  `Mean: ${formatCurrency(lossParams.mean !== undefined && lossParams.mean !== null ? lossParams.mean : 0)}, Std: ${formatCurrency(lossParams.std !== undefined && lossParams.std !== null ? lossParams.std : 0)}`
                )}
                {lossDistribution === 'uniform' && lossParams && (
                  `Min: ${formatCurrency(lossParams.min !== undefined && lossParams.min !== null ? lossParams.min : 0)}, Max: ${formatCurrency(lossParams.max !== undefined && lossParams.max !== null ? lossParams.max : 0)}`
                )}
                {lossDistribution === 'lognormal' && lossParams && (
                  `Mu: ${(lossParams.mu !== undefined && lossParams.mu !== null ? lossParams.mu : 0).toFixed(2)}, Sigma: ${(lossParams.sigma !== undefined && lossParams.sigma !== null ? lossParams.sigma : 0).toFixed(2)}`
                )}
              </div>
            </div>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '12px', 
            fontSize: '12px' 
          }}>
            <div>
              <strong>Monte Carlo Iterations:</strong> {iterations?.toLocaleString() || 'N/A'}
              <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '1px' }}>
                Use Refresh button to see variance
              </div>
            </div>
            <div>
              <strong>Risk Type:</strong> {isResidual ? 'Residual (Post-Controls)' : 'Inherent (Pre-Controls)'}
            </div>
          </div>
          
          {(valueAtRisk || expectedAnnualLoss) && (
            <div style={{ 
              marginTop: '8px', 
              paddingTop: '8px', 
              borderTop: '1px solid #dee2e6',
              fontSize: '12px'
            }}>
              <strong>Key Risk Metrics:</strong>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: '8px', 
                marginTop: '4px' 
              }}>
                {valueAtRisk && (
                  <div>
                    <span style={{ color: '#0066ff', fontWeight: 'bold' }}>VaR:</span> {
                      typeof valueAtRisk === 'number' ? formatCurrency(valueAtRisk) : 
                      typeof valueAtRisk === 'object' && valueAtRisk.valueAtRisk ? formatCurrency(valueAtRisk.valueAtRisk) :
                      'N/A'
                    }
                  </div>
                )}
                {expectedAnnualLoss && (
                  <div>
                    <span style={{ color: '#00cc66', fontWeight: 'bold' }}>EAL:</span> {
                      typeof expectedAnnualLoss === 'number' ? formatCurrency(expectedAnnualLoss) : 
                      typeof expectedAnnualLoss === 'object' && expectedAnnualLoss.expectedAnnualLoss ? formatCurrency(expectedAnnualLoss.expectedAnnualLoss) :
                      'N/A'
                    }
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for zoomed view */}
      {isModalOpen && (
        <div className="rar-svg-modal-overlay" onClick={closeModal}>
          <div className="rar-svg-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="rar-svg-modal-header">
              <h3>🌡️ Monte Carlo Heat Map - Detailed View (Zoom: {Math.round(modalZoom * 100)}%)</h3>
              <div className="rar-svg-modal-controls">
                <span style={{ fontSize: '12px', marginRight: '10px', color: '#666' }}>
                  Tip: Scroll to pan • Use +/- to zoom
                </span>
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    zoomOut();
                  }} 
                  className="rar-svg-zoom-btn" 
                  title="Zoom Out (or press -)"
                  disabled={modalZoom <= 0.5}
                >−</button>
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    resetZoom();
                  }} 
                  className="rar-svg-zoom-btn" 
                  title="Reset Zoom (100%)"
                >⌂</button>
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    zoomIn();
                  }} 
                  className="rar-svg-zoom-btn" 
                  title="Zoom In (or press +)"
                  disabled={modalZoom >= 5}
                >+</button>
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeModal();
                  }} 
                  className="rar-svg-close-btn" 
                  title="Close (or press Escape)"
                >×</button>
              </div>
            </div>
            <div className="rar-svg-modal-body">
              <div 
                className="rar-svg-modal-chart-container"
                style={{
                  width: '100%',
                  height: 'calc(100vh - 120px)',
                  overflow: 'auto',
                  position: 'relative',
                  border: '1px solid #ddd',
                  backgroundColor: '#f9f9f9',
                  scrollBehavior: 'smooth',
                  cursor: modalZoom > 1 ? 'grab' : 'default'
                }}
                onMouseDown={(e) => {
                  if (modalZoom > 1) {
                    e.currentTarget.style.cursor = 'grabbing';
                  }
                }}
                onMouseUp={(e) => {
                  if (modalZoom > 1) {
                    e.currentTarget.style.cursor = 'grab';
                  }
                }}
                onMouseLeave={(e) => {
                  if (modalZoom > 1) {
                    e.currentTarget.style.cursor = 'grab';
                  }
                }}
              >
                <div 
                  style={{
                    width: `${width * modalZoom}px`,
                    height: `${height * modalZoom}px`,
                    minWidth: `${width}px`,
                    minHeight: `${height}px`,
                    margin: '20px',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    borderRadius: '4px',
                    position: 'relative'
                  }}
                >
                <svg width={width * modalZoom} height={height * modalZoom}>
                  <defs>
                    {/* Gradient for legend */}
                    <linearGradient id="heatmap-gradient-modal" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(255, 255, 255, 0.3)" />
                      <stop offset="100%" stopColor="rgba(255, 0, 0, 1)" />
                    </linearGradient>
                  </defs>
                  
                  {/* Heat map cells */}
                  <g transform={`translate(${margin.left * modalZoom}, ${margin.top * modalZoom})`}>
                    {data.map((d, i) => (
                      <rect
                        key={i}
                        x={d.x * cellSize * modalZoom}
                        y={(19 - d.y) * cellSize * modalZoom} // Flip Y-axis
                        width={cellSize * modalZoom}
                        height={cellSize * modalZoom}
                        fill={getDensityColor(d.normalizedDensity)}
                        stroke="#fff"
                        strokeWidth={0.5 * modalZoom}
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
                                  const x = (j / 99) * 20 * cellSize * modalZoom;
                                  const lossRatio = (requiredLoss - lossRange.min) / (lossRange.max - lossRange.min);
                                  const y = (1 - lossRatio) * 20 * cellSize * modalZoom; // Flip y-axis
                                  curvePoints.push(`${x},${y}`);
                                }
                              }
                              
                              if (curvePoints.length > 1) {
                                return (
                                  <path
                                    d={`M ${curvePoints.join(' L ')}`}
                                    stroke={isVaR ? "#0066ff" : "#00cc66"}
                                    strokeWidth={3 * modalZoom}
                                    fill="none"
                                    opacity="0.9"
                                    strokeDasharray={isVaR ? "none" : `${8 * modalZoom},${4 * modalZoom}`} // Solid line for VaR, dashed for EAL
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
                                  const x = (j / 99) * 20 * cellSize * modalZoom;
                                  const lossRatio = (requiredLoss - lossRange.min) / (lossRange.max - lossRange.min);
                                  const y = (1 - lossRatio) * 20 * cellSize * modalZoom;
                                  curvePoints.push(`${x},${y}`);
                                }
                              }
                              
                              if (curvePoints.length > 1) {
                                const baseColor = isVaRBand ? "#0066ff" : "#00cc66";
                                return (
                                  <path
                                    d={`M ${curvePoints.join(' L ')}`}
                                    stroke={baseColor}
                                    strokeWidth={1 * modalZoom}
                                    fill="none"
                                    opacity="0.4"
                                    strokeDasharray={`${3 * modalZoom},${2 * modalZoom}`}
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
                              cx={(point.x * cellSize + cellSize/2) * modalZoom}
                              cy={((19 - point.y) * cellSize + cellSize/2) * modalZoom}
                              r={3 * modalZoom}
                              fill={getContourColor(contour.level)}
                              stroke="white"
                              strokeWidth={1 * modalZoom}
                              opacity="0.8"
                            />
                          ))}
                        </g>
                      );
                    }).filter(Boolean)}
                  </g>
                  
                  {/* X-axis */}
                  <g transform={`translate(${margin.left * modalZoom}, ${(height - margin.bottom) * modalZoom})`}>
                    <line x1="0" y1="0" x2={20 * cellSize * modalZoom} y2="0" stroke="#000" strokeWidth={modalZoom} />
                    <text x={10 * cellSize * modalZoom} y={35 * modalZoom} textAnchor="middle" fontSize={12 * modalZoom}>
                      Frequency (events/year)
                    </text>
                    {[0, 5, 10, 15, 19].map(i => (
                      <g key={i}>
                        <line x1={i * cellSize * modalZoom} y1="0" x2={i * cellSize * modalZoom} y2={5 * modalZoom} stroke="#000" strokeWidth={modalZoom} />
                        <text x={i * cellSize * modalZoom} y={20 * modalZoom} textAnchor="middle" fontSize={10 * modalZoom}>
                          {(frequencyRange.min + (i / 19) * (frequencyRange.max - frequencyRange.min)).toFixed(2)}
                        </text>
                      </g>
                    ))}
                  </g>
                  
                  {/* Y-axis */}
                  <g transform={`translate(${margin.left * modalZoom}, ${margin.top * modalZoom})`}>
                    <line x1="0" y1="0" x2="0" y2={20 * cellSize * modalZoom} stroke="#000" strokeWidth={modalZoom} />
                    <text x={-70 * modalZoom} y={10 * cellSize * modalZoom} textAnchor="middle" fontSize={12 * modalZoom} transform={`rotate(-90, ${-70 * modalZoom}, ${10 * cellSize * modalZoom})`}>
                      Unit Cost
                    </text>
                    {[0, 5, 10, 15, 19].map(i => {
                      const value = lossRange.min + (i / 19) * (lossRange.max - lossRange.min);
                      return (
                        <g key={i}>
                          <line x1={-5 * modalZoom} y1={(19-i) * cellSize * modalZoom} x2="0" y2={(19-i) * cellSize * modalZoom} stroke="#000" strokeWidth={modalZoom} />
                          <text x={-10 * modalZoom} y={(19-i) * cellSize * modalZoom + 3 * modalZoom} textAnchor="end" fontSize={10 * modalZoom}>
                            {window.innerWidth <= 768 ? formatCompactCurrency(value) : formatCurrency(value)}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                  
                  {/* Legend */}
                  <g transform={`translate(${(width - margin.right + 10) * modalZoom}, ${margin.top * modalZoom})`}>
                    <text x="0" y={-5 * modalZoom} fontSize={12 * modalZoom} fontWeight="bold">Probability Density</text>
                    <rect x="0" y="0" width={80 * modalZoom} height={15 * modalZoom} fill="url(#heatmap-gradient-modal)" />
                    <text x="0" y={30 * modalZoom} fontSize={10 * modalZoom}>Low</text>
                    <text x={65 * modalZoom} y={30 * modalZoom} fontSize={10 * modalZoom}>High</text>
                    
                    <text x="0" y={60 * modalZoom} fontSize={12 * modalZoom} fontWeight="bold">Total Loss Contours</text>
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
                        strokeDashArray = `${8 * modalZoom},${4 * modalZoom}`;
                      } else if (isVaRBand) {
                        legendText = `VaR ±1σ: ${formatCurrency(contour.value)}`;
                        strokeDashArray = `${3 * modalZoom},${2 * modalZoom}`;
                        opacity = 0.6;
                      } else if (isEALBand) {
                        legendText = `EAL ±1σ: ${formatCurrency(contour.value)}`;
                        strokeDashArray = `${3 * modalZoom},${2 * modalZoom}`;
                        opacity = 0.6;
                      } else {
                        legendText = `${contour.level}%: ${formatCurrency(contour.value)}`;
                      }
                      
                      return (
                        <g key={i} transform={`translate(0, ${(80 + i * 20) * modalZoom})`}>
                          {(isVaR || isEAL || isVaRBand || isEALBand) ? (
                            <line 
                              x1="0" 
                              y1="0" 
                              x2={10 * modalZoom} 
                              y2="0" 
                              stroke={isVaR || isVaRBand ? "#0066ff" : "#00cc66"} 
                              strokeWidth={(isVaR || isEAL ? 3 : 1) * modalZoom}
                              strokeDasharray={strokeDashArray}
                              opacity={opacity}
                            />
                          ) : (
                            <circle 
                              cx={5 * modalZoom} 
                              cy="0" 
                              r={3 * modalZoom} 
                              fill={getContourColor(contour.level)} 
                              stroke="white" 
                              strokeWidth={1 * modalZoom} 
                            />
                          )}
                          <text x={15 * modalZoom} y={3 * modalZoom} fontSize={10 * modalZoom} fontWeight={isVaR || isEAL ? "bold" : "normal"} opacity={opacity}>
                            {legendText}
                          </text>
                        </g>
                      );
                    }).filter(Boolean)}
                  </g>
                </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskHeatMap;
