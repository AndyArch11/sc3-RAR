import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';

const TornadoGraphCustom = ({ 
  form, 
  getMonteCarloResults,
  formatCurrency,
  getMonteCarloExpectedLossNumeric,
  isTabActive = true // New parameter to control modal visibility
}) => {
  
  // Ref for the scrollable container
  const scrollContainerRef = useRef(null);
  
  // Modal state for chart viewing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalZoom, setModalZoom] = useState(1);
  
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
  
  // Double-click handler
  const handleDoubleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Double-click detected on tornado graph, opening modal');
    openModal();
  }, [openModal]);
  
  // Center the scroll position on mount/update
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      // Add a small delay to ensure DOM is fully rendered
      setTimeout(() => {
        // Force a reflow to ensure all dimensions are calculated
        container.style.display = 'none';
        void container.offsetHeight; // Trigger reflow
        container.style.display = '';
        
        const scrollableWidth = container.scrollWidth - container.clientWidth;
        if (scrollableWidth > 0) {
          const scrollLeft = Math.max(0, scrollableWidth / 2);
          container.scrollLeft = scrollLeft;
          
          // Ensure scroll boundaries are properly set
          container.scrollLeft = Math.min(container.scrollLeft, scrollableWidth);
          container.scrollLeft = Math.max(container.scrollLeft, 0);
        }
      }, 150);
    }
  }, [form?.assessmentType, form?.lossDistribution, form?.frequencyDistribution]);
  
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
  
  // Calculate sensitivity data
  const sensitivityData = useMemo(() => {
    
    // Check if we're in the right assessment type
    if (!form || form.assessmentType !== 'advancedQuantitative') {
      
      return {
        data: [
          {
            parameter: 'Min Loss (Example)',
            negative: -15.2,
            positive: 12.8,
            range: 28.0
          },
          {
            parameter: 'Max Loss (Example)',
            negative: -10.5,
            positive: 8.3,
            range: 18.8
          },
          {
            parameter: 'Most Likely Loss (Example)',
            negative: -8.2,
            positive: 15.7,
            range: 23.9
          },
          {
            parameter: 'Event Frequency (Example)',
            negative: -14.4,
            positive: 11.2,
            range: 25.6
          }
        ],
        isExampleData: true,
        reason: 'not_advanced_quantitative',
        supportedDistributions: ['triangular', 'pert'],
        currentRiskType: 'none'
      };
    }

    // Check supported distributions
    const supportedLossDistributions = ['triangular', 'pert', 'normal', 'lognormal', 'uniform', 'beta', 'pareto', 'weibull', 'gamma'];
    const supportedFreqDistributions = ['triangular', 'pert', 'normal', 'uniform', 'discrete-uniform', 'poisson'];
    
    const lossDistSupported = !form.lossDistribution || supportedLossDistributions.includes(form.lossDistribution);
    const freqDistSupported = !form.frequencyDistribution || supportedFreqDistributions.includes(form.frequencyDistribution);
    
    if (!lossDistSupported || !freqDistSupported) {
      
      return {
        data: [
          {
            parameter: 'Distribution Not Supported',
            negative: -10.0,
            positive: 10.0,
            range: 20.0
          }
        ],
        isExampleData: true,
        reason: 'unsupported_distribution',
        supportedDistributions: supportedLossDistributions,
        currentLossDistribution: form.lossDistribution,
        currentFreqDistribution: form.frequencyDistribution,
        currentRiskType: 'none'
      };
    }

    // Get baseline expected loss
    const baselineEAL = getMonteCarloExpectedLossNumeric(form);
    
    // Determine which risk data we're analyzing
    const riskType = form.currentRiskView === 'residual' ? 'residual' : 'inherent';
    
    if (!baselineEAL || baselineEAL === 0) {
      return {
        data: [
          {
            parameter: 'Min Loss (Sample)',
            negative: -12.5,
            positive: 8.7,
            range: 21.2
          },
          {
            parameter: 'Max Loss (Sample)',
            negative: -18.2,
            positive: 22.1,
            range: 40.3
          },
          {
            parameter: 'Most Likely Loss (Sample)',
            negative: -9.1,
            positive: 14.3,
            range: 23.4
          },
          {
            parameter: 'Event Frequency (Sample)',
            negative: -16.7,
            positive: 11.8,
            range: 28.5
          }
        ],
        isExampleData: true,
        reason: 'no_baseline_data',
        supportedDistributions: supportedLossDistributions,
        currentRiskType: riskType
      };
    }

    const variations = [];
    
    // Helper function to calculate impact of parameter changes
    const calculateImpact = (paramName, baseValue, lowValue, highValue, paramKey) => {
      if (!baseValue || baseValue === '') return null;
      
      const baseNum = parseFloat(baseValue);
      if (isNaN(baseNum) || baseNum === 0) return null;
      
      // Check if this is a discrete parameter (should be integer)
      const isDiscreteParameter = paramKey.includes('DiscreteUniform') || paramKey.includes('discrete');
      
      // Calculate low and high scenarios with appropriate value formatting
      const lowFormValue = isDiscreteParameter ? Math.round(lowValue).toString() : lowValue.toString();
      const highFormValue = isDiscreteParameter ? Math.round(highValue).toString() : highValue.toString();
      
      const lowForm = { ...form, [paramKey]: lowFormValue };
      const highForm = { ...form, [paramKey]: highFormValue };
      
      try {
        const lowEAL = getMonteCarloExpectedLossNumeric(lowForm);
        const highEAL = getMonteCarloExpectedLossNumeric(highForm);
        
        if (!lowEAL || !highEAL) return null;
        
        const lowImpact = ((lowEAL - baselineEAL) / baselineEAL) * 100;
        const highImpact = ((highEAL - baselineEAL) / baselineEAL) * 100;
        
        // For tornado graph, we need negative and positive impacts from baseline
        const negativeImpact = Math.min(lowImpact, highImpact);
        const positiveImpact = Math.max(lowImpact, highImpact);
        
        return {
          parameter: paramName,
          negative: negativeImpact < 0 ? negativeImpact : 0,
          positive: positiveImpact > 0 ? positiveImpact : 0,
          range: Math.abs(positiveImpact - negativeImpact)
        };
      } catch (error) {
        console.warn(`Error calculating impact for ${paramName}:`, error);
        return null;
      }
    };

    // Analyze key parameters based on distribution type
    if (form.lossDistribution === 'triangular' || form.lossDistribution === 'pert') {
      // Min Loss impact
      const minLoss = parseFloat(form.minLoss);
      if (!isNaN(minLoss) && minLoss > 0) {
        const lowMin = minLoss * 0.5;
        const highMin = minLoss * 1.5;
        const impact = calculateImpact('Min Loss', form.minLoss, lowMin, highMin, 'minLoss');
        if (impact) variations.push(impact);
      }
      
      // Most Likely Loss impact  
      const mostLikelyLoss = parseFloat(form.mostLikelyLoss);
      if (!isNaN(mostLikelyLoss) && mostLikelyLoss > 0) {
        const lowLikely = mostLikelyLoss * 0.7;
        const highLikely = mostLikelyLoss * 1.3;
        const impact = calculateImpact('Most Likely Loss', form.mostLikelyLoss, lowLikely, highLikely, 'mostLikelyLoss');
        if (impact) variations.push(impact);
      }
      
      // Max Loss impact
      const maxLoss = parseFloat(form.maxLoss);
      if (!isNaN(maxLoss) && maxLoss > 0) {
        const lowMax = maxLoss * 0.8;
        const highMax = maxLoss * 1.2;
        const impact = calculateImpact('Max Loss', form.maxLoss, lowMax, highMax, 'maxLoss');
        if (impact) variations.push(impact);
      }
    }
    
    // Normal loss distribution parameters
    if (form.lossDistribution === 'normal') {
      // Mean Loss impact
      const meanLoss = parseFloat(form.lossMean);
      if (!isNaN(meanLoss) && meanLoss > 0) {
        const lowMean = meanLoss * 0.8;
        const highMean = meanLoss * 1.2;
        const impact = calculateImpact('Loss Mean', form.lossMean, lowMean, highMean, 'lossMean');
        if (impact) variations.push(impact);
      }
      
      // Standard Deviation Loss impact
      const stdDevLoss = parseFloat(form.lossStdDev);
      if (!isNaN(stdDevLoss) && stdDevLoss > 0) {
        const lowStdDev = stdDevLoss * 0.7;
        const highStdDev = stdDevLoss * 1.3;
        const impact = calculateImpact('Loss Std Dev', form.lossStdDev, lowStdDev, highStdDev, 'lossStdDev');
        if (impact) variations.push(impact);
      }
    }
    
    // Log-normal loss distribution parameters (uses same structure as normal)
    if (form.lossDistribution === 'lognormal') {
      // Mu (underlying normal mean) impact
      const muLoss = parseFloat(form.lossMean);
      if (!isNaN(muLoss)) {
        const lowMu = muLoss * 0.8;
        const highMu = muLoss * 1.2;
        const impact = calculateImpact('Loss Mu (μ)', form.lossMean, lowMu, highMu, 'lossMean');
        if (impact) variations.push(impact);
      }
      
      // Sigma (underlying normal std dev) impact
      const sigmaLoss = parseFloat(form.lossStdDev);
      if (!isNaN(sigmaLoss) && sigmaLoss > 0) {
        const lowSigma = sigmaLoss * 0.7;
        const highSigma = sigmaLoss * 1.3;
        const impact = calculateImpact('Loss Sigma (σ)', form.lossStdDev, lowSigma, highSigma, 'lossStdDev');
        if (impact) variations.push(impact);
      }
    }
    
    // Uniform loss distribution parameters
    if (form.lossDistribution === 'uniform') {
      // Minimum Loss impact
      const minLoss = parseFloat(form.minLoss);
      if (!isNaN(minLoss) && minLoss >= 0) {
        const lowMin = minLoss * 0.7;
        const highMin = minLoss * 1.3;
        const impact = calculateImpact('Loss Min', form.minLoss, lowMin, highMin, 'minLoss');
        if (impact) variations.push(impact);
      }
      
      // Maximum Loss impact
      const maxLoss = parseFloat(form.maxLoss);
      if (!isNaN(maxLoss) && maxLoss > 0) {
        const lowMax = maxLoss * 0.8;
        const highMax = maxLoss * 1.2;
        const impact = calculateImpact('Loss Max', form.maxLoss, lowMax, highMax, 'maxLoss');
        if (impact) variations.push(impact);
      }
    }
    
    // Beta loss distribution parameters
    if (form.lossDistribution === 'beta') {
      // Alpha parameter impact (shape parameter affecting skewness)
      const alphaLoss = parseFloat(form.lossAlpha);
      if (!isNaN(alphaLoss) && alphaLoss > 0) {
        const lowAlpha = alphaLoss * 0.7;
        const highAlpha = alphaLoss * 1.3;
        const impact = calculateImpact('Loss Alpha (α)', form.lossAlpha, lowAlpha, highAlpha, 'lossAlpha');
        if (impact) variations.push(impact);
      }
      
      // Beta parameter impact (shape parameter affecting skewness)
      const betaLoss = parseFloat(form.lossBeta);
      if (!isNaN(betaLoss) && betaLoss > 0) {
        const lowBeta = betaLoss * 0.7;
        const highBeta = betaLoss * 1.3;
        const impact = calculateImpact('Loss Beta (β)', form.lossBeta, lowBeta, highBeta, 'lossBeta');
        if (impact) variations.push(impact);
      }
      
      // Minimum Loss impact (scale parameter)
      const minLoss = parseFloat(form.minLoss);
      if (!isNaN(minLoss) && minLoss >= 0) {
        const lowMin = minLoss * 0.7;
        const highMin = minLoss * 1.3;
        const impact = calculateImpact('Loss Min', form.minLoss, lowMin, highMin, 'minLoss');
        if (impact) variations.push(impact);
      }
      
      // Maximum Loss impact (scale parameter)
      const maxLoss = parseFloat(form.maxLoss);
      if (!isNaN(maxLoss) && maxLoss > 0) {
        const lowMax = maxLoss * 0.8;
        const highMax = maxLoss * 1.2;
        const impact = calculateImpact('Loss Max', form.maxLoss, lowMax, highMax, 'maxLoss');
        if (impact) variations.push(impact);
      }
    }
    
    // Pareto loss distribution parameters
    if (form.lossDistribution === 'pareto') {
      // Minimum value (xMin) parameter impact (scale parameter)
      const paretoMin = parseFloat(form.lossParetoMin);
      if (!isNaN(paretoMin) && paretoMin > 0) {
        const lowMin = paretoMin * 0.7;
        const highMin = paretoMin * 1.3;
        const impact = calculateImpact('Loss xMin', form.lossParetoMin, lowMin, highMin, 'lossParetoMin');
        if (impact) variations.push(impact);
      }
      
      // Shape parameter (alpha) impact (affects tail heaviness)
      const paretoShape = parseFloat(form.lossParetoShape);
      if (!isNaN(paretoShape) && paretoShape > 0) {
        const lowShape = paretoShape * 0.7;
        const highShape = paretoShape * 1.3;
        const impact = calculateImpact('Loss Alpha (α)', form.lossParetoShape, lowShape, highShape, 'lossParetoShape');
        if (impact) variations.push(impact);
      }
    }
    
    // Weibull loss distribution parameters
    if (form.lossDistribution === 'weibull') {
      // Shape parameter (k) impact (affects distribution behavior)
      const weibullShape = parseFloat(form.lossWeibullShape);
      if (!isNaN(weibullShape) && weibullShape > 0) {
        const lowShape = weibullShape * 0.7;
        const highShape = weibullShape * 1.3;
        const impact = calculateImpact('Loss Shape (k)', form.lossWeibullShape, lowShape, highShape, 'lossWeibullShape');
        if (impact) variations.push(impact);
      }
      
      // Scale parameter (lambda) impact (affects distribution scale)
      const weibullScale = parseFloat(form.lossWeibullScale);
      if (!isNaN(weibullScale) && weibullScale > 0) {
        const lowScale = weibullScale * 0.7;
        const highScale = weibullScale * 1.3;
        const impact = calculateImpact('Loss Scale (λ)', form.lossWeibullScale, lowScale, highScale, 'lossWeibullScale');
        if (impact) variations.push(impact);
      }
    }
    
    // Gamma loss distribution parameters
    if (form.lossDistribution === 'gamma') {
      // Shape parameter (alpha) impact (affects distribution skewness)
      const gammaShape = parseFloat(form.lossGammaShape);
      if (!isNaN(gammaShape) && gammaShape > 0) {
        const lowShape = gammaShape * 0.7;
        const highShape = gammaShape * 1.3;
        const impact = calculateImpact('Loss Shape (α)', form.lossGammaShape, lowShape, highShape, 'lossGammaShape');
        if (impact) variations.push(impact);
      }
      
      // Scale parameter (beta) impact (affects distribution spread)
      const gammaScale = parseFloat(form.lossGammaScale);
      if (!isNaN(gammaScale) && gammaScale > 0) {
        const lowScale = gammaScale * 0.7;
        const highScale = gammaScale * 1.3;
        const impact = calculateImpact('Loss Scale (β)', form.lossGammaScale, lowScale, highScale, 'lossGammaScale');
        if (impact) variations.push(impact);
      }
    }
    
    // Frequency parameters (if triangular/pert)
    if (form.frequencyDistribution === 'triangular' || form.frequencyDistribution === 'pert') {
      const mostLikelyFreq = parseFloat(form.mostLikelyFrequency);
      if (!isNaN(mostLikelyFreq) && mostLikelyFreq > 0) {
        const lowFreq = mostLikelyFreq * 0.5;
        const highFreq = mostLikelyFreq * 1.5;
        const impact = calculateImpact('Event Frequency', form.mostLikelyFrequency, lowFreq, highFreq, 'mostLikelyFrequency');
        if (impact) variations.push(impact);
      }
    }
    
    // Normal frequency distribution parameters
    if (form.frequencyDistribution === 'normal') {
      // Mean Frequency impact
      const meanFreq = parseFloat(form.frequencyMean);
      if (!isNaN(meanFreq) && meanFreq > 0) {
        const lowMean = meanFreq * 0.8;
        const highMean = meanFreq * 1.2;
        const impact = calculateImpact('Freq Mean', form.frequencyMean, lowMean, highMean, 'frequencyMean');
        if (impact) variations.push(impact);
      }
      
      // Standard Deviation Frequency impact
      const stdDevFreq = parseFloat(form.frequencyStdDev);
      if (!isNaN(stdDevFreq) && stdDevFreq > 0) {
        const lowStdDev = stdDevFreq * 0.7;
        const highStdDev = stdDevFreq * 1.3;
        const impact = calculateImpact('Freq Std Dev', form.frequencyStdDev, lowStdDev, highStdDev, 'frequencyStdDev');
        if (impact) variations.push(impact);
      }
    }
    
    // Uniform frequency distribution parameters
    if (form.frequencyDistribution === 'uniform') {
      // Minimum Frequency impact
      const minFreq = parseFloat(form.minFrequency);
      if (!isNaN(minFreq) && minFreq >= 0) {
        const lowMin = minFreq * 0.7;
        const highMin = minFreq * 1.3;
        const impact = calculateImpact('Freq Min', form.minFrequency, lowMin, highMin, 'minFrequency');
        if (impact) variations.push(impact);
      }
      
      // Maximum Frequency impact
      const maxFreq = parseFloat(form.maxFrequency);
      if (!isNaN(maxFreq) && maxFreq > 0) {
        const lowMax = maxFreq * 0.8;
        const highMax = maxFreq * 1.2;
        const impact = calculateImpact('Freq Max', form.maxFrequency, lowMax, highMax, 'maxFrequency');
        if (impact) variations.push(impact);
      }
    }
    
    // Discrete uniform frequency distribution parameters
    if (form.frequencyDistribution === 'discrete-uniform') {
      // Minimum Discrete Frequency impact
      const minDiscreteFreq = parseInt(form.frequencyDiscreteUniformMin);
      if (!isNaN(minDiscreteFreq) && minDiscreteFreq >= 0) {
        const lowMin = Math.max(0, minDiscreteFreq - 2);
        const highMin = minDiscreteFreq + 2;
        const impact = calculateImpact('Discrete Freq Min', form.frequencyDiscreteUniformMin, lowMin, highMin, 'frequencyDiscreteUniformMin');
        if (impact) variations.push(impact);
      }
      
      // Maximum Discrete Frequency impact
      const maxDiscreteFreq = parseInt(form.frequencyDiscreteUniformMax);
      if (!isNaN(maxDiscreteFreq) && maxDiscreteFreq > 0) {
        const lowMax = Math.max(1, maxDiscreteFreq - 2);
        const highMax = maxDiscreteFreq + 2;
        const impact = calculateImpact('Discrete Freq Max', form.frequencyDiscreteUniformMax, lowMax, highMax, 'frequencyDiscreteUniformMax');
        if (impact) variations.push(impact);
      }
    }
    
    // Poisson frequency distribution parameters
    if (form.frequencyDistribution === 'poisson') {
      // Lambda parameter (average event rate) impact
      const poissonLambda = parseFloat(form.frequencyLambda);
      if (!isNaN(poissonLambda) && poissonLambda > 0) {
        const lowLambda = poissonLambda * 0.7;
        const highLambda = poissonLambda * 1.3;
        const impact = calculateImpact('Frequency Lambda (λ)', form.frequencyLambda, lowLambda, highLambda, 'frequencyLambda');
        if (impact) variations.push(impact);
      }
    }
    
    // Sort by range (impact magnitude) descending
    const results = variations.filter(v => v !== null).sort((a, b) => b.range - a.range).slice(0, 6);
    
    if (results.length === 0) {
      return {
        data: [
          {
            parameter: 'Insufficient Data',
            negative: -5.0,
            positive: 5.0,
            range: 10.0
          }
        ],
        isExampleData: true,
        reason: 'insufficient_parameters',
        supportedDistributions: supportedLossDistributions,
        currentRiskType: riskType
      };
    }
    
    return {
      data: results,
      isExampleData: false,
      reason: 'real_data',
      supportedDistributions: supportedLossDistributions,
      currentRiskType: riskType
    };
    
  }, [form, getMonteCarloExpectedLossNumeric]);

  // Early return if tab is not active to prevent cross-contamination
  if (!isTabActive) {
    return null;
  }

  // Calculate max absolute value for dynamic scaling
  const maxValue = Math.max(
    ...sensitivityData.data.map(item => Math.max(Math.abs(item.negative), Math.abs(item.positive)))
  );
  
  // Dynamic chart dimensions based on content
  const barHeight = 40;
  const chartHeight = sensitivityData.data.length * (barHeight + 15) + 140; // Increased for subtitle
  const labelWidth = window.innerWidth <= 768 ? 180 : 240; // Reduced label width for mobile
  const topMargin = 65; // Increased for subtitle
  const bottomMargin = 80;
  
  // Dynamic chart width and scaling based on max value  
  const baseChartWidth = window.innerWidth <= 768 ? 600 : 1000; // Much smaller base width for mobile
  const maxBarWidth = window.innerWidth <= 768 ? 150 : 200; // Smaller bars on mobile
  const scaleFactor = maxValue > 0 ? maxBarWidth / maxValue : 1;
  
  // Ensure chart is wide enough for bars, labels, and margins with extra padding
  const mobileMarginReduction = window.innerWidth <= 768 ? 150 : 0; // Significant margin reduction on mobile
  const requiredWidth = (maxBarWidth * 2) + (labelWidth * 2) + (300 - mobileMarginReduction);
  // Ensure minimum width for proper scrolling
  const minChartWidth = window.innerWidth <= 768 ? 600 : 800;
  const chartWidth = Math.max(baseChartWidth, requiredWidth, minChartWidth);
  const centerX = chartWidth / 2;

  return (
    <>
      <div className="rar-tornado-container">
      {/* Enhanced status messaging */}
      <div className="rar-tornado-description">
        <div style={{ 
          backgroundColor: sensitivityData.isExampleData ? '#fff3cd' : '#d4edda', 
          border: `1px solid ${sensitivityData.isExampleData ? '#ffeaa7' : '#c3e6cb'}`,
          borderRadius: '4px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          {sensitivityData.isExampleData ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '18px', marginRight: '8px' }}>⚠️</span>
                <strong style={{ color: '#856404' }}>Displaying Example Data</strong>
              </div>
              
              {sensitivityData.reason === 'not_advanced_quantitative' && (
                <div style={{ color: '#856404', fontSize: '14px' }}>
                  <p><strong>Reason:</strong> Tornado graph requires "Advanced Quantitative (Monte Carlo)" assessment type.</p>
                  <p><strong>Action:</strong> Change assessment type to see actual sensitivity analysis of your risk parameters.</p>
                </div>
              )}
              
              {sensitivityData.reason === 'unsupported_distribution' && (
                <div style={{ color: '#856404', fontSize: '14px' }}>
                  <p><strong>Reason:</strong> Current distribution types in the Inherent Risk tab are not supported for sensitivity analysis.</p>
                  <p><strong>Current Loss Distribution (Inherent Risk tab):</strong> {sensitivityData.currentLossDistribution || 'None'}</p>
                  <p><strong>Current Frequency Distribution (Inherent Risk tab):</strong> {sensitivityData.currentFreqDistribution || 'None'}</p>
                  <p><strong>Supported Distributions:</strong> {sensitivityData.supportedDistributions.join(', ')}</p>
                  <p><strong>Action:</strong> Go to the "Inherent Risk" tab and change to either Triangular, Modified PERT, Normal, Uniform, Discrete Uniform, or Poisson frequency distributions to enable sensitivity analysis.</p>     
                </div>
              )}
              
              {sensitivityData.reason === 'no_baseline_data' && (
                <div style={{ color: '#856404', fontSize: '14px' }}>
                  <p><strong>Reason:</strong> Insufficient three-point estimation risk parameter data in the Inherent Risk tab for analysis.</p>
                  <p><strong>Action:</strong> Go to the "Inherent Risk" tab and complete the Monte Carlo risk assessment parameters using Triangular, Modified PERT, Normal, or Uniform distributions.</p>
                </div>
              )}
              
              {sensitivityData.reason === 'insufficient_parameters' && (
                <div style={{ color: '#856404', fontSize: '14px' }}>
                  <p><strong>Reason:</strong> Risk parameters entered in Inherent Risk tab but insufficient for meaningful sensitivity analysis.</p>
                  <p><strong>Action:</strong> Go to the "Inherent Risk" tab and ensure all required three-point distribution parameters are completed with valid values.</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '18px', marginRight: '8px' }}>✅</span>
                <strong style={{ color: '#155724' }}>Live Sensitivity Analysis</strong>
              </div>
              <div style={{ color: '#155724', fontSize: '14px' }}>
                <p><strong>Data Source:</strong> Three-point distribution parameters from {sensitivityData.currentRiskType === 'residual' ? 'Residual Risk tab' : 'Inherent Risk tab'}</p>
                <p><strong>Distribution Models: </strong> 
                  Loss: {form?.lossDistribution ? form.lossDistribution.charAt(0).toUpperCase() + form.lossDistribution.slice(1) : 'Not specified'} | 
                  Frequency: {form?.frequencyDistribution ? form.frequencyDistribution.charAt(0).toUpperCase() + form.frequencyDistribution.slice(1) : 'Not specified'}
                </p>
                <p><strong>Analysis:</strong> Impact of ±20-50% parameter changes on Expected Annual Loss (EAL)</p>
                <p><strong>Parameters Analyzed:</strong> {sensitivityData.data.length} distribution parameters with measurable impact</p>
                <p><strong>Methodology:</strong> Each parameter is varied independently while holding others constant to measure EAL sensitivity</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Distribution support notice */}
        <div style={{ 
          fontSize: '12px', 
          color: '#666', 
          fontStyle: 'italic',
          marginBottom: '12px',
          padding: '8px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px'
        }}>
          <strong>Distribution Models: </strong> 
          {!sensitivityData.isExampleData && form ? (
            <>
              This sensitivity analysis models <strong>{form.lossDistribution ? form.lossDistribution.charAt(0).toUpperCase() + form.lossDistribution.slice(1) : 'Unknown'}</strong> distribution for loss magnitude 
              and <strong>{form.frequencyDistribution ? form.frequencyDistribution.charAt(0).toUpperCase() + form.frequencyDistribution.slice(1) : 'Unknown'}</strong> distribution for event frequency. 
              Parameter variations show how changes in distribution parameters affect the Expected Annual Loss calculation.
            </>
          ) : (
            <>
              Tornado graph sensitivity analysis uses three-point distribution parameters 
              from your Inherent Risk tab (Min, Most Likely, Max values for both Loss and Frequency). 
              Supports Triangular, Modified PERT, Normal, Log-normal, Uniform, Beta, Pareto, Weibull, and Gamma loss distributions.
              Supports Triangular, Modified PERT, Normal, Uniform, Discrete Uniform, and Poisson frequency distributions.            
            </>
          )}
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        padding: '20px 0',
        width: '100%',
        overflow: 'hidden'
      }}>
        <div 
          ref={scrollContainerRef}
          className="tornado-scroll-container"
          style={{ 
            overflowX: 'auto', 
            overflowY: 'visible',
            width: '100%',
            maxWidth: '100%',
            border: '1px solid #e0e0e0', 
            borderRadius: '8px', 
            backgroundColor: '#fafafa',
            position: 'relative'
          }}
          onDoubleClick={handleDoubleClick}
          title="Double-click to view in modal"
        >
          <svg 
            width={chartWidth} 
            height={chartHeight} 
            className="tornado-svg"
            style={{ 
              display: 'block'
            }}>
          {/* Title */}
          <text x={centerX} y={20} textAnchor="middle" style={{ fontSize: '16px', fontWeight: 'bold', fill: '#333' }}>
            Sensitivity Analysis - Tornado Graph
          </text>
          <text x={centerX} y={40} textAnchor="middle" style={{ fontSize: '12px', fill: '#666' }}>
            {!sensitivityData.isExampleData && form ? 
              `Loss: ${form.lossDistribution ? form.lossDistribution.charAt(0).toUpperCase() + form.lossDistribution.slice(1) : 'Unknown'} | Frequency: ${form.frequencyDistribution ? form.frequencyDistribution.charAt(0).toUpperCase() + form.frequencyDistribution.slice(1) : 'Unknown'}` 
              : 'Distribution Models'
            }
          </text>
          
          {/* Center line */}
          <line x1={centerX} y1={topMargin} x2={centerX} y2={chartHeight - bottomMargin} stroke="#666" strokeWidth="2" />
          
          {/* Grid lines - dynamic based on max value */}
          {(() => {
            // Create appropriate grid intervals based on max value
            let intervals = [];
            if (maxValue <= 20) {
              intervals = [-20, -10, 10, 20];
            } else if (maxValue <= 50) {
              intervals = [-50, -25, 25, 50];
            } else if (maxValue <= 100) {
              intervals = [-100, -50, 50, 100];
            } else if (maxValue <= 200) {
              intervals = [-200, -100, 100, 200];
            } else {
              // For very high values, use multiples of 100
              const step = Math.ceil(maxValue / 4 / 100) * 100;
              intervals = [-step * 2, -step, step, step * 2];
            }
            
            return intervals.map(value => {
              const x = centerX + (value * scaleFactor);
              return (
                <line 
                  key={value}
                  x1={x} 
                  y1={topMargin} 
                  x2={x} 
                  y2={chartHeight - bottomMargin} 
                  stroke="#e0e0e0" 
                  strokeWidth="1" 
                  strokeDasharray="3,3"
                />
              );
            });
          })()}
          
          {/* Tornado bars */}
          {sensitivityData.data.map((item, index) => {
            const y = topMargin + 10 + index * (barHeight + 15);
            const negativeWidth = Math.abs(item.negative) * scaleFactor;
            const positiveWidth = Math.abs(item.positive) * scaleFactor;
            
            return (
              <g key={index}>
                {/* Parameter label - positioned far left to avoid grid lines and percentage text */}
                <text 
                  x={centerX - maxBarWidth - 80} 
                  y={y + barHeight/2 + 5} 
                  textAnchor="end" 
                  style={{ fontSize: '13px', fill: '#333', fontWeight: '500' }}
                >
                  {item.parameter}
                </text>
                
                {/* Negative impact bar (left side) - EAL decrease is good, use green */}
                {item.negative < 0 && (
                  <>
                    <rect
                      x={centerX - negativeWidth}
                      y={y}
                      width={negativeWidth}
                      height={barHeight}
                      fill="#4ecdc4"
                      stroke="#26c6da"
                      strokeWidth="1"
                      opacity="0.8"
                    />
                    {/* Smart text positioning based on bar width */}
                    <text
                      x={negativeWidth > 80 ? centerX - negativeWidth/2 : centerX - negativeWidth - 15}
                      y={negativeWidth > 80 ? y + barHeight/2 + 5 : y + barHeight/2 + 5}
                      textAnchor={negativeWidth > 80 ? "middle" : "end"}
                      style={{ 
                        fontSize: '11px', 
                        fill: negativeWidth > 80 ? '#ffffff' : '#26c6da', 
                        fontWeight: 'bold' 
                      }}
                    >
                      {item.negative.toFixed(1)}%
                    </text>
                  </>
                )}
                
                {/* Positive impact bar (right side) - EAL increase is bad, use red */}
                {item.positive > 0 && (
                  <>
                    <rect
                      x={centerX}
                      y={y}
                      width={positiveWidth}
                      height={barHeight}
                      fill="#ff6b6b"
                      stroke="#ff5252"
                      strokeWidth="1"
                      opacity="0.8"
                    />
                    {/* Smart text positioning based on bar width */}
                    <text
                      x={positiveWidth > 80 ? centerX + positiveWidth/2 : centerX + positiveWidth + 15}
                      y={positiveWidth > 80 ? y + barHeight/2 + 5 : y + barHeight/2 + 5}
                      textAnchor={positiveWidth > 80 ? "middle" : "start"}
                      style={{ 
                        fontSize: '11px', 
                        fill: positiveWidth > 80 ? '#ffffff' : '#ff5252', 
                        fontWeight: 'bold' 
                      }}
                    >
                      +{item.positive.toFixed(1)}%
                    </text>
                  </>
                )}
              </g>
            );
          })}
          
          {/* X-axis labels - dynamic based on max value */}
          {(() => {
            let labelValues = [];
            if (maxValue <= 20) {
              labelValues = [-20, -10, 0, 10, 20];
            } else if (maxValue <= 50) {
              labelValues = [-50, -25, 0, 25, 50];
            } else if (maxValue <= 100) {
              labelValues = [-100, -50, 0, 50, 100];
            } else if (maxValue <= 200) {
              labelValues = [-200, -100, 0, 100, 200];
            } else {
              // For very high values, use multiples of 100
              const step = Math.ceil(maxValue / 4 / 100) * 100;
              labelValues = [-step * 2, -step, 0, step, step * 2];
            }
            
            return labelValues.map(value => {
              const x = centerX + (value * scaleFactor);
              return (
                <text 
                  key={value}
                  x={x} 
                  y={chartHeight - bottomMargin + 20} 
                  textAnchor="middle" 
                  style={{ fontSize: '12px', fill: '#666' }}
                >
                  {value === 0 ? '0%' : `${value > 0 ? '+' : ''}${value}%`}
                </text>
              );
            });
          })()}
          
          {/* Axis title */}
          <text x={centerX} y={chartHeight - bottomMargin + 40} textAnchor="middle" style={{ fontSize: '12px', fill: '#666', fontWeight: '500' }}>
            Impact on Expected Annual Loss (%)
          </text>
          
          {/* Legend - positioned at the bottom with proper spacing */}
          <g transform={`translate(${centerX - 120}, ${chartHeight - 30})`}>
            <rect x="0" y="0" width="15" height="15" fill="#4ecdc4" opacity="0.8" />
            <text x="20" y="12" style={{ fontSize: '12px', fill: '#333' }}>Decrease in EAL</text>
            
            <rect x="140" y="0" width="15" height="15" fill="#ff6b6b" opacity="0.8" />
            <text x="160" y="12" style={{ fontSize: '12px', fill: '#333' }}>Increase in EAL</text>
          </g>
        </svg>
        </div>
      </div>
      
      <div className="rar-tornado-insights">
        <h6>Key Insights:</h6>
        {!sensitivityData.isExampleData ? (
          <>
            <ul>
              {sensitivityData.data.slice(0, 3).map((item, index) => {
                // Graded impact evaluation based on range magnitude
                let impactLevel, impactColor, impactDescription;
                
                if (item.range >= 50) {
                  impactLevel = "very high";
                  impactColor = "#d32f2f";
                  impactDescription = "critically sensitive parameter requiring close monitoring";
                } else if (item.range >= 25) {
                  impactLevel = "high";
                  impactColor = "#f57c00";
                  impactDescription = "significant impact on risk assessment";
                } else if (item.range >= 15) {
                  impactLevel = "moderate";
                  impactColor = "#fbc02d";
                  impactDescription = "meaningful influence on expected loss";
                } else if (item.range >= 8) {
                  impactLevel = "low-moderate";
                  impactColor = "#689f38";
                  impactDescription = "modest but measurable impact";
                } else {
                  impactLevel = "low";
                  impactColor = "#388e3c";
                  impactDescription = "minimal impact on overall risk";
                }
                
                return (
                  <li key={index}>
                    <strong>{item.parameter}</strong> has <span style={{ color: impactColor, fontWeight: 'bold' }}>{impactLevel} impact</span> ({item.range.toFixed(1)}% range on {sensitivityData.currentRiskType} risk) - {impactDescription}
                  </li>
                );
              })}
            </ul>
            
            <div style={{ 
              marginTop: '12px', 
              padding: '8px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '4px',
              fontSize: '13px'
            }}>
              <strong>Sensitivity Profile: </strong>
              {(() => {
                const maxRange = Math.max(...sensitivityData.data.map(item => item.range));
                const avgRange = sensitivityData.data.reduce((sum, item) => sum + item.range, 0) / sensitivityData.data.length;
                
                if (maxRange >= 50) {
                  return <span style={{ color: '#d32f2f' }}>High sensitivity model - close parameter monitoring essential</span>;
                } else if (maxRange >= 25) {
                  return <span style={{ color: '#f57c00' }}>Moderate-high sensitivity - key parameters require attention</span>;
                } else if (avgRange >= 15) {
                  return <span style={{ color: '#fbc02d' }}>Moderate sensitivity - balanced parameter influence</span>;
                } else {
                  return <span style={{ color: '#388e3c' }}>Low sensitivity - robust model with stable parameters</span>;
                }
              })()}
            </div>
            
            <div style={{ 
              marginTop: '12px', 
              padding: '8px', 
              backgroundColor: '#e8f5e8', 
              borderRadius: '4px',
              fontSize: '13px',
              border: '1px solid #c8e6c9'
            }}>
              <strong>Strategic Guidance: </strong>
              {(() => {
                // Calculate total upward and downward potential from all parameters
                const totalUpward = sensitivityData.data.reduce((sum, item) => sum + Math.abs(item.positive), 0);
                const totalDownward = sensitivityData.data.reduce((sum, item) => sum + Math.abs(item.negative), 0);
                
                // Calculate the ratio to determine strategy with more nuanced thresholds
                const upwardDownwardRatio = totalDownward > 0 ? totalUpward / totalDownward : totalUpward > 0 ? Infinity : 1;
                const strongThreshold = 2.5; // 2.5x difference considered "strong"
                const moderateThreshold = 1.6; // 1.6x difference considered "moderate"
                
                if (upwardDownwardRatio >= strongThreshold) {
                  return (
                    <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                      🛡️ Strong prevention focus - upward risk exposure ({totalUpward.toFixed(1)}%) strongly exceeds downward potential ({totalDownward.toFixed(1)}%). 
                      Prioritize controls that prevent adverse parameter variations.
                    </span>
                  );
                } else if (upwardDownwardRatio >= moderateThreshold) {
                  return (
                    <span style={{ color: '#f57c00', fontWeight: 'bold' }}>
                      🛡️💡 Prevention-focused with optimization potential - upward exposure ({totalUpward.toFixed(1)}%) exceeds downward potential ({totalDownward.toFixed(1)}%). 
                      Emphasize preventive controls while exploring selective optimization opportunities.
                    </span>
                  );
                } else if (upwardDownwardRatio <= (1 / strongThreshold)) {
                  return (
                    <span style={{ color: '#1976d2', fontWeight: 'bold' }}>
                      💰 Strong optimization focus - downward potential ({totalDownward.toFixed(1)}%) strongly exceeds upward exposure ({totalUpward.toFixed(1)}%). 
                      Focus on optimization strategies to realize favorable parameter scenarios.
                    </span>
                  );
                } else if (upwardDownwardRatio <= (1 / moderateThreshold)) {
                  return (
                    <span style={{ color: '#2196f3', fontWeight: 'bold' }}>
                      💡💰 Optimization-focused with risk controls - downward potential ({totalDownward.toFixed(1)}%) exceeds upward exposure ({totalUpward.toFixed(1)}%). 
                      Emphasize optimization strategies while maintaining essential preventive controls.
                    </span>
                  );
                } else {
                  return (
                    <span style={{ color: '#ef6c00', fontWeight: 'bold' }}>
                      ⚖️ Balanced approach recommended - upward exposure ({totalUpward.toFixed(1)}%) and downward potential ({totalDownward.toFixed(1)}%) are similar magnitude. 
                      Implement mixed strategy combining preventive controls with proactive optimization measures.
                    </span>
                  );
                }
              })()}
            </div>
          </>
        ) : (
          <div style={{ color: '#856404', fontStyle: 'italic' }}>
            <p>Insights will be available when analyzing real risk data.</p>
            <p>Complete the setup requirements above to see parameter impact analysis.</p>
          </div>
        )}
        
        {sensitivityData.isExampleData && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#e3f2fd',
            border: '1px solid #bbdefb',
            borderRadius: '4px',
            fontSize: '13px'
          }}>
            <strong>How to Enable Real Sensitivity Analysis:</strong>
            <ol style={{ marginTop: '8px', marginBottom: '0', paddingLeft: '20px' }}>
              <li>Select "Advanced Quantitative (Monte Carlo)" assessment type</li>
              <li>Go to the "Inherent Risk" tab and choose "Triangular" or "Modified PERT" for both Loss and Frequency distributions</li>
              <li>In the "Inherent Risk" tab, enter Min, Most Likely, and Max values for loss amounts</li>
              <li>In the "Inherent Risk" tab, enter three-point frequency parameters (events per year)</li>
              <li>Return to this "Sensitivity Analysis" tab to view the tornado graph with your inherent risk data</li>
            </ol>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#1565c0', fontStyle: 'italic' }}>
              💡 <strong>Note:</strong> The sensitivity analysis maps the three-point distribution parameters from your Inherent Risk assessment to show how changes in those parameters affect the Expected Annual Loss calculation.
            </div>
          </div>
        )}
      </div>
    </div>
    
    {/* Modal */}
    {isModalOpen && (
      <div className="rar-svg-modal-overlay" onClick={closeModal}>
        <div className="rar-svg-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="rar-svg-modal-header">
            <h3>Sensitivity Analysis - Tornado Diagram</h3>
            <div className="rar-svg-modal-controls">
              <button type="button" onClick={zoomOut} disabled={modalZoom <= 0.5} title="Zoom Out (-)">−</button>
              <span>{Math.round(modalZoom * 100)}%</span>
              <button type="button" onClick={zoomIn} disabled={modalZoom >= 3} title="Zoom In (+)">+</button>
              <button type="button" onClick={resetZoom} title="Reset Zoom (R)">Reset</button>
              <button type="button" onClick={closeModal} className="rar-svg-modal-close" title="Close (Escape)">×</button>
            </div>
          </div>
          <div className="rar-svg-modal-body" style={{ transform: `scale(${modalZoom})`, transformOrigin: 'top left' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              padding: '20px 0',
              width: '100%',
              overflow: 'hidden'
            }}>
              <div 
                className="tornado-scroll-container"
                style={{ 
                  overflowX: 'auto', 
                  overflowY: 'visible',
                  width: '100%',
                  maxWidth: '100%',
                  border: '1px solid #e0e0e0', 
                  borderRadius: '8px', 
                  backgroundColor: '#fafafa',
                  position: 'relative'
                }}>
                <svg 
                  width={chartWidth} 
                  height={chartHeight} 
                  className="tornado-svg"
                  style={{ 
                    display: 'block'
                  }}
                >
                  {/* Chart background */}
                  <rect width={chartWidth} height={chartHeight} fill="white" />
                  
                  {/* Title */}
                  <text x={centerX} y={20} textAnchor="middle" style={{ fontSize: '16px', fontWeight: 'bold', fill: '#333' }}>
                    Sensitivity Analysis - Tornado Graph
                  </text>
                  <text x={centerX} y={40} textAnchor="middle" style={{ fontSize: '12px', fill: '#666' }}>
                    {!sensitivityData.isExampleData && form ? 
                      `Loss: ${form.lossDistribution ? form.lossDistribution.charAt(0).toUpperCase() + form.lossDistribution.slice(1) : 'Unknown'} | Frequency: ${form.frequencyDistribution ? form.frequencyDistribution.charAt(0).toUpperCase() + form.frequencyDistribution.slice(1) : 'Unknown'}` 
                      : 'Distribution Models'
                    }
                  </text>
                  
                  {/* Center line */}
                  <line x1={centerX} y1={topMargin} x2={centerX} y2={chartHeight - bottomMargin} stroke="#666" strokeWidth="2" />
                  
                  {/* Grid lines - dynamic based on max value */}
                  {(() => {
                    // Create appropriate grid intervals based on max value
                    let intervals = [];
                    if (maxValue <= 20) {
                      intervals = [-20, -10, 10, 20];
                    } else if (maxValue <= 50) {
                      intervals = [-50, -25, 25, 50];
                    } else if (maxValue <= 100) {
                      intervals = [-100, -50, 50, 100];
                    } else if (maxValue <= 200) {
                      intervals = [-200, -100, 100, 200];
                    } else {
                      // For very high values, use multiples of 100
                      const step = Math.ceil(maxValue / 4 / 100) * 100;
                      intervals = [-step * 2, -step, step, step * 2];
                    }
                    
                    return intervals.map(value => {
                      const x = centerX + (value * scaleFactor);
                      return (
                        <line 
                          key={value}
                          x1={x} 
                          y1={topMargin} 
                          x2={x} 
                          y2={chartHeight - bottomMargin} 
                          stroke="#e0e0e0" 
                          strokeWidth="1" 
                          strokeDasharray="3,3"
                        />
                      );
                    });
                  })()}
                  
                  {/* Tornado bars */}
                  {sensitivityData.data.map((item, index) => {
                    const y = topMargin + 40 + index * (barHeight + 15);
                    const leftBarWidth = Math.abs(item.negative) * scaleFactor;
                    const rightBarWidth = Math.abs(item.positive) * scaleFactor;
                    
                    return (
                      <g key={index}>
                        {/* Left bar (negative change) */}
                        <rect
                          x={centerX - leftBarWidth}
                          y={y}
                          width={leftBarWidth}
                          height={barHeight}
                          fill="#4ecdc4"
                          stroke="#26c6da"
                          strokeWidth="1"
                        />
                        
                        {/* Right bar (positive change) */}
                        <rect
                          x={centerX}
                          y={y}
                          width={rightBarWidth}
                          height={barHeight}
                          fill="#ff6b6b"
                          stroke="#ff5252"
                          strokeWidth="1"
                        />
                        
                        {/* Parameter label */}
                        <text 
                          x={50} 
                          y={y + barHeight/2 + 4} 
                          textAnchor="start" 
                          style={{ fontSize: '11px', fill: '#333', fontWeight: '500' }}
                        >
                          {item.parameter}
                        </text>
                        
                        {/* Value labels on bars */}
                        <text 
                          x={centerX - leftBarWidth/2} 
                          y={y + barHeight/2 + 4} 
                          textAnchor="middle" 
                          style={{ fontSize: '10px', fill: 'white', fontWeight: 'bold' }}
                        >
                          {item.negative > 0 ? '+' : ''}{item.negative.toFixed(1)}%
                        </text>
                        
                        <text 
                          x={centerX + rightBarWidth/2} 
                          y={y + barHeight/2 + 4} 
                          textAnchor="middle" 
                          style={{ fontSize: '10px', fill: 'white', fontWeight: 'bold' }}
                        >
                          {item.positive > 0 ? '+' : ''}{item.positive.toFixed(1)}%
                        </text>
                      </g>
                    );
                  })}

                  {/* X-axis labels */}
                  {(() => {
                    let labels = [];
                    if (maxValue <= 20) {
                      labels = [
                        { value: -20, x: centerX - (20 * scaleFactor) },
                        { value: -10, x: centerX - (10 * scaleFactor) },
                        { value: 0, x: centerX },
                        { value: 10, x: centerX + (10 * scaleFactor) },
                        { value: 20, x: centerX + (20 * scaleFactor) }
                      ];
                    } else if (maxValue <= 50) {
                      labels = [
                        { value: -50, x: centerX - (50 * scaleFactor) },
                        { value: -25, x: centerX - (25 * scaleFactor) },
                        { value: 0, x: centerX },
                        { value: 25, x: centerX + (25 * scaleFactor) },
                        { value: 50, x: centerX + (50 * scaleFactor) }
                      ];
                    } else if (maxValue <= 100) {
                      labels = [
                        { value: -100, x: centerX - (100 * scaleFactor) },
                        { value: -50, x: centerX - (50 * scaleFactor) },
                        { value: 0, x: centerX },
                        { value: 50, x: centerX + (50 * scaleFactor) },
                        { value: 100, x: centerX + (100 * scaleFactor) }
                      ];
                    } else if (maxValue <= 200) {
                      labels = [
                        { value: -200, x: centerX - (200 * scaleFactor) },
                        { value: -100, x: centerX - (100 * scaleFactor) },
                        { value: 0, x: centerX },
                        { value: 100, x: centerX + (100 * scaleFactor) },
                        { value: 200, x: centerX + (200 * scaleFactor) }
                      ];
                    } else {
                      const step = Math.ceil(maxValue / 4 / 100) * 100;
                      labels = [
                        { value: -step * 2, x: centerX - (step * 2 * scaleFactor) },
                        { value: -step, x: centerX - (step * scaleFactor) },
                        { value: 0, x: centerX },
                        { value: step, x: centerX + (step * scaleFactor) },
                        { value: step * 2, x: centerX + (step * 2 * scaleFactor) }
                      ];
                    }
                    
                    return labels.map((label, index) => (
                      <text 
                        key={index}
                        x={label.x} 
                        y={chartHeight - bottomMargin + 20} 
                        textAnchor="middle" 
                        style={{ fontSize: '11px', fill: '#333' }}
                      >
                        {label.value > 0 ? '+' : ''}{label.value}%
                      </text>
                    ));
                  })()}

                  {/* Legend */}
                  <g transform={`translate(${chartWidth - 250}, 65)`}>
                    <rect x="0" y="0" width="15" height="12" fill="#4ecdc4" />
                    <text x="20" y="10" style={{ fontSize: '11px', fill: '#333' }}>Decreased Parameter (-20%)</text>
                    <rect x="0" y="18" width="15" height="12" fill="#ff6b6b" />
                    <text x="20" y="28" style={{ fontSize: '11px', fill: '#333' }}>Increased Parameter (+20%)</text>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

// Utility function to check if sensitivity analysis is available for the current form
export const isSensitivityAnalysisAvailable = (form) => {
  // Check if we're in the right assessment type
  if (!form || form.assessmentType !== 'advancedQuantitative') {
    return false;
  }

  // Check supported distributions
  const supportedLossDistributions = ['triangular', 'pert', 'normal', 'lognormal', 'uniform', 'beta', 'pareto', 'weibull', 'gamma'];
  const supportedFreqDistributions = ['triangular', 'pert', 'normal', 'uniform', 'discrete-uniform', 'poisson'];
  
  const lossDistSupported = !form.lossDistribution || supportedLossDistributions.includes(form.lossDistribution);
  const freqDistSupported = !form.frequencyDistribution || supportedFreqDistributions.includes(form.frequencyDistribution);
  
  return lossDistSupported && freqDistSupported;
};

export default TornadoGraphCustom;
