import React, { useState, useEffect } from "react";
import { runMonteCarlo, sampleDistribution } from "./montecarlo";
import RARIntro from "./RARIntro";
import InputForm from "./RARinputForm";
import RARReport from "./RARReport";
import RARTable from "./RARTable";
import "./RAR.css";

const VERSION = "v0.2.3"; // Update as needed


// TODO: Add more unit tests for all components and functions
// TODO: Implement error handling and validation for form inputs
// TODO: Add tooltips and help texts for form fields
// TODO: Implement accessibility features (ARIA labels, keyboard navigation, etc.)
// TODO: Add localization support for different languages
// TODO: Implement responsive design for mobile and tablet views


// SC3.com.au theme colours
const SC3_PRIMARY = "#003366"; // Deep blue
const SC3_SECONDARY = "#0099cc"; // Bright blue

// Additional style constants for parametric styling
const SC3_BTN_FONT_WEIGHT = "bold";

// Helper to get today's date in YYYY-MM-DD format
const getToday = () => {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

const initialForm = {
  riskId: "",
  riskTitle: "",
  framework: "",
  riskCategory: "",
  riskDescription: "",
  assessor: "",
  assessedDate: getToday(),
  riskOwner: "",
  approver: "",
  threatSource: "",
  vulnerability: "",
  currentControls: "",
  controlEffectiveness: "",
  treatmentStrategy: "",
  recommendedActions: "",
  actionOwner: "",
  targetDate: "",
  reviewDate: "",
  assessmentType: "qualitative",
  likelihood: "",
  impact: "",
  sle: "",
  sleCurrency: "dollar",
  aro: "",
  // Monte Carlo Simulation fields
  monteCarloIterations: "10000",
  minLoss: "",
  maxLoss: "",
  mostLikelyLoss: "",
  minFrequency: "",
  maxFrequency: "",
  mostLikelyFrequency: "",
  confidenceLevel: "95",
  lossDistribution: "triangular",
  frequencyDistribution: "triangular",
  // Distribution-specific parameters
  // For Normal/LogNormal distributions
  lossMean: "",
  lossStdDev: "",
  frequencyMean: "",
  frequencyStdDev: "",
  // For Beta distribution
  lossAlpha: "",
  lossBeta: "",
  frequencyAlpha: "",
  frequencyBeta: "",
  // For Poisson distribution
  frequencyLambda: "",
  // For Exponential distribution
  frequencyLambdaExp: "",
  // Note: expectedLoss, valueAtRisk, and monteCarloResults are now calculated automatically
  status: "",
  manualRiskLevel: "",
  residualRisk: "",
  residualLikelihood: "",
  residualImpact: "",
  closedDate: "",
  closedBy: "",
};

const RARForm = () => {
  const [form, setForm] = useState(initialForm);
  // Risks management state
  const [risks, setRisks] = useState([]);
  const [thresholdCurrency, setThresholdCurrency] = useState("dollar");
  
  // Threshold values state
  const [thresholds, setThresholds] = useState({
    quantitative: {
      extreme: 1000000,
      high: { min: 500000, max: 999999 },
      medium: { min: 100000, max: 499999 },
      low: 100000
    },
    advancedQuantitative: {
      extreme: 2000000,
      high: { min: 1000000, max: 1999999 },
      medium: { min: 200000, max: 999999 },
      low: 200000
    }
  });
  
  const [selectedRiskIndex, setSelectedRiskIndex] = useState(null);
  const [isEditingRisk, setIsEditingRisk] = useState(false);
  const [rarFieldsOpen, setRarFieldsOpen] = useState(true);
  const [risksOpen, setRisksOpen] = useState(false);
  
  const [editIndex, setEditIndex] = useState(null);
  const [hoveredRowIndex, setHoveredRowIndex] = useState(null);

  // Drag and drop state for reordering risks
  const [draggedRiskIndex, setDraggedRiskIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dropTargetIndex, setDropTargetIndex] = useState(null);

  // Sync threshold currency with form currency for quantitative assessments
  useEffect(() => {
    if (form.assessmentType === "quantitative" || form.assessmentType === "advancedQuantitative") {
      setThresholdCurrency(form.sleCurrency);
    }
  }, [form.assessmentType, form.sleCurrency]);

  // Auto-calculate manual risk level for quantitative assessments based on thresholds
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (form.assessmentType === "quantitative") {
      const ale = calculateALE(form);
      const calculatedLevel = getQuantitativeRiskLevel(ale);
      if (calculatedLevel && calculatedLevel !== form.manualRiskLevel) {
        setForm(prevForm => ({
          ...prevForm,
          manualRiskLevel: calculatedLevel
        }));
      }
    } else if (form.assessmentType === "advancedQuantitative") {
      const expectedLoss = getMonteCarloExpectedLossNumeric(form);
      const calculatedLevel = getAdvancedQuantitativeRiskLevel(expectedLoss);
      if (calculatedLevel && calculatedLevel !== form.manualRiskLevel) {
        setForm(prevForm => ({
          ...prevForm,
          manualRiskLevel: calculatedLevel
        }));
      }
    } else if (form.assessmentType === "qualitative") {
      // Clear manual risk level for qualitative assessments to use matrix calculation
      if (form.manualRiskLevel) {
        setForm(prevForm => ({
          ...prevForm,
          manualRiskLevel: ""
        }));
      }
    }
  }, [
    form.assessmentType,
    form.sle,
    form.aro,
    form.minLoss,
    form.mostLikelyLoss,
    form.maxLoss,
    form.minFrequency,
    form.mostLikelyFrequency,
    form.maxFrequency,
    form.manualRiskLevel,
    thresholds
  ]);

  // Validation state for mandatory fields
  const [validationErrors, setValidationErrors] = useState({});
  const [showValidation, setShowValidation] = useState(false);

  // Analytics filter state
  const [includeClosedRisks, setIncludeClosedRisks] = useState(false);
  const [showAdditionalConsiderations, setShowAdditionalConsiderations] = useState(false);

  // Guidance section state
  const [showQualitativeGuidance, setShowQualitativeGuidance] = useState(false);

  // Helper function to get filtered risks count for analytics
  const getFilteredRisksCount = () => {
    return includeClosedRisks ? risks.length : risks.filter(risk => risk.status !== 'closed').length;
  };

  // Helper function to get top 5 risks by risk level
  const getTop5RisksByLevel = () => {
    // Risk level priority mapping (higher number = higher priority)
    const riskLevelPriority = {
      'extreme': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };

    const filteredRisks = includeClosedRisks ? risks : risks.filter(risk => risk.status !== 'closed');
    
    return filteredRisks
      .filter(risk => {
        // More lenient filtering - include risks with at least a title OR risk level
        const hasTitle = risk.riskTitle && risk.riskTitle.trim() !== '';
        const hasLevel = risk.riskLevel && risk.riskLevel.trim() !== '';
        return hasTitle || hasLevel;
      })
      .sort((a, b) => {
        const priorityA = riskLevelPriority[a.riskLevel?.toLowerCase()] || 0;
        const priorityB = riskLevelPriority[b.riskLevel?.toLowerCase()] || 0;
        
        // First sort by risk level priority (highest first)
        if (priorityA !== priorityB) {
          return priorityB - priorityA;
        }
        
        // If same risk level, sort by likelihood and impact
        const likelihoodA = parseInt(a.likelihood) || 0;
        const likelihoodB = parseInt(b.likelihood) || 0;
        const impactA = parseInt(a.impact) || 0;
        const impactB = parseInt(b.impact) || 0;
        
        // Combined score for secondary sorting
        const scoreA = likelihoodA * impactA;
        const scoreB = likelihoodB * impactB;
        
        return scoreB - scoreA;
      })
      .slice(0, 5); // Take top 5
  };

  // Helper function to get risk matrix heat map data
  const getRiskMatrixHeatMapData = () => {
    const impactLevels = ["Negligible", "Minor", "Moderate", "Major", "Severe"];
    const likelihoodLevels = ["Very Unlikely", "Unlikely", "Possible", "Likely", "Very Likely"];
    
    // Filter risks by closed status AND only include qualitative risks
    const filteredRisks = risks.filter(risk => {
      const isNotClosed = includeClosedRisks || risk.status !== 'closed';
      const isQualitative = risk.assessmentType === 'qualitative';
      return isNotClosed && isQualitative;
    });
    
    // Initialize matrix with zeros
    const matrix = {};
    impactLevels.forEach(impact => {
      matrix[impact] = {};
      likelihoodLevels.forEach(likelihood => {
        matrix[impact][likelihood] = {
          count: 0,
          riskLevel: riskMatrix[`${impact}-${likelihood}`] || "Low"
        };
      });
    });
    
    // Count risks for each cell
    filteredRisks.forEach(risk => {
      const impact = impactMap[risk.impact];
      const likelihood = likelihoodMap[risk.likelihood];
      
      if (impact && likelihood && matrix[impact] && matrix[impact][likelihood]) {
        matrix[impact][likelihood].count++;
      }
    });
    
    return { matrix, impactLevels, likelihoodLevels };
  };

  // Shared likelihood and impact mappings
  const likelihoodMap = {
    1: "Very Unlikely",
    2: "Unlikely",
    3: "Possible",
    4: "Likely",
    5: "Very Likely",
  };

  const impactMap = {
    1: "Negligible",
    2: "Minor",
    3: "Moderate",
    4: "Major",
    5: "Severe",
  };

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "#dc3545"; // Red
      case "in-progress":
        return "#fd7e14"; // Orange
      case "monitoring":
        return "#6f42c1"; // Purple
      case "closed":
        return "#28a745"; // Green
      default:
        return "#6c757d"; // Gray for empty/unknown status
    }
  };

  // Donut chart component with custom tooltip
  const DonutChart = ({ data, size = 200 }) => {
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });
    
    const total = data.reduce((sum, item) => sum + item.count, 0);
    if (total === 0) return null;

    let cumulativePercentage = 0;
    const radius = size / 2 - 20;
    const centerX = size / 2;
    const centerY = size / 2;

    const handleMouseEnter = (event, item) => {
      const percentage = ((item.count / total) * 100).toFixed(1);
      setTooltip({
        visible: true,
        x: event.clientX,
        y: event.clientY - 10,
        content: `${item.label}: ${item.count} (${percentage}%)`
      });
      event.target.style.filter = "drop-shadow(0 2px 4px rgba(0,0,0,0.2)) brightness(1.1)";
    };

    const handleMouseLeave = (event) => {
      setTooltip({ visible: false, x: 0, y: 0, content: '' });
      event.target.style.filter = "drop-shadow(0 1px 2px rgba(0,0,0,0.1))";
    };

    const handleMouseMove = (event) => {
      if (tooltip.visible) {
        setTooltip(prev => ({
          ...prev,
          x: event.clientX,
          y: event.clientY - 10
        }));
      }
    };

    return (
      <div className="donut-chart-container">
        <svg width={size} height={size} className="donut-chart-svg">
          {data.map((item, index) => {
            const percentage = (item.count / total) * 100;
            
            // Special case: if this is the only item (100%), draw a full circle
            if (data.length === 1) {
              return (
                <g key={item.label}>
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r={radius}
                    fill={item.color}
                    stroke="white"
                    strokeWidth="2"
                    style={{ 
                      cursor: "pointer",
                      filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))"
                    }}
                    onMouseEnter={(e) => handleMouseEnter(e, item)}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={handleMouseMove}
                  />
                </g>
              );
            }
            
            // Normal case: draw arc segments
            const startAngle = (cumulativePercentage / 100) * 360;
            const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
            
            const startAngleRad = (startAngle - 90) * (Math.PI / 180);
            const endAngleRad = (endAngle - 90) * (Math.PI / 180);
            
            const largeArcFlag = percentage > 50 ? 1 : 0;
            
            const x1 = centerX + radius * Math.cos(startAngleRad);
            const y1 = centerY + radius * Math.sin(startAngleRad);
            const x2 = centerX + radius * Math.cos(endAngleRad);
            const y2 = centerY + radius * Math.sin(endAngleRad);
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              `Z`
            ].join(' ');

            cumulativePercentage += percentage;

            return (
              <path
                key={item.label}
                d={pathData}
                fill={item.color}
                stroke="white"
                strokeWidth="2"
                className="donut-chart-segment"
                onMouseEnter={(e) => handleMouseEnter(e, item)}
                onMouseLeave={handleMouseLeave}
                onMouseMove={handleMouseMove}
              />
            );
          })}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius * 0.4}
            className="donut-chart-center-circle"
          />
          <text
            x={centerX}
            y={centerY - 5}
            className="donut-chart-total-label"
          >
            Total
          </text>
          <text
            x={centerX}
            y={centerY + 10}
            className="donut-chart-total-value"
          >
            {total}
          </text>
        </svg>
        
        {/* Custom Tooltip */}
        {tooltip.visible && (
          <div
            className="donut-chart-tooltip"
            style={{
              left: `${tooltip.x + 10}px`,
              top: `${tooltip.y}px`,
            }}
          >
            {tooltip.content}
          </div>
        )}
      </div>
    );
  };

  // Donut chart helper function (updated to use component)
  const createDonutChart = (data, size = 200) => {
    return <DonutChart data={data} size={size} />;
  };

  // Risk level distribution data
  const getRiskLevelData = () => {
    const riskLevels = { low: 0, medium: 0, high: 0, extreme: 0 };
    // Use the same colors as getRiskColor function for consistency
    const colors = { 
      low: '#4CAF50',    // Green - matches getRiskColor("Low")
      medium: '#FFC107', // Yellow - matches getRiskColor("Medium") 
      high: '#FF9800',   // Orange - matches getRiskColor("High")
      extreme: '#F44336' // Red - matches getRiskColor("Extreme")
    };
    
    const filteredRisks = includeClosedRisks ? risks : risks.filter(risk => risk.status !== 'closed');
    
    filteredRisks.forEach(risk => {
      const level = risk.riskLevel?.toLowerCase() || 'unknown';
      if (riskLevels.hasOwnProperty(level)) {
        riskLevels[level]++;
      }
    });
    
    return Object.entries(riskLevels)
      .filter(([_, count]) => count > 0)
      .map(([level, count]) => ({
        label: level.charAt(0).toUpperCase() + level.slice(1),
        count,
        color: colors[level]
      }));
  };

  // Risk category distribution data
  const getCategoryData = () => {
    const categories = {};
    const colors = ['#007bff', '#6f42c1', '#e83e8c', '#fd7e14', '#20c997', '#6c757d'];
    
    const filteredRisks = includeClosedRisks ? risks : risks.filter(risk => risk.status !== 'closed');
    
    filteredRisks.forEach(risk => {
      const category = risk.riskCategory || 'Uncategorized';
      categories[category] = (categories[category] || 0) + 1;
    });
    
    return Object.entries(categories)
      .filter(([_, count]) => count > 0)
      .map(([category, count], index) => ({
        label: category,
        count,
        color: colors[index % colors.length]
      }));
  };

  // Treatment strategy distribution data
  const getTreatmentData = () => {
    const strategies = {};
    const colors = ['#17a2b8', '#28a745', '#ffc107', '#dc3545', '#6f42c1'];
    
    const filteredRisks = includeClosedRisks ? risks : risks.filter(risk => risk.status !== 'closed');
    
    filteredRisks.forEach(risk => {
      const strategy = risk.treatmentStrategy || 'Not Defined';
      strategies[strategy] = (strategies[strategy] || 0) + 1;
    });
    
    return Object.entries(strategies)
      .filter(([_, count]) => count > 0)
      .map(([strategy, count], index) => ({
        label: strategy.charAt(0).toUpperCase() + strategy.slice(1),
        count,
        color: colors[index % colors.length]
      }));
  };

  // Status distribution data
  const getStatusData = () => {
    const statuses = { open: 0, 'in-progress': 0, monitoring: 0, closed: 0 };
    const colors = { 
      open: '#dc3545',        // Red
      'in-progress': '#fd7e14', // Orange  
      monitoring: '#6f42c1',   // Purple
      closed: '#28a745'        // Green
    };
    
    risks.forEach(risk => {
      const status = risk.status || 'open';
      if (statuses.hasOwnProperty(status)) {
        statuses[status]++;
      }
    });
    
    return Object.entries(statuses)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        label: status === 'in-progress' ? 'In Progress' : 
               status.charAt(0).toUpperCase() + status.slice(1),
        count,
        color: colors[status]
      }));
  };

  // Threat source distribution data
  const getThreatSourceData = () => {
    const sources = {};
    const colors = ['#e74c3c', '#f39c12', '#9b59b6', '#3498db', '#1abc9c', '#34495e'];
    
    const filteredRisks = includeClosedRisks ? risks : risks.filter(risk => risk.status !== 'closed');
    
    filteredRisks.forEach(risk => {
      const source = risk.threatSource || 'Not Specified';
      sources[source] = (sources[source] || 0) + 1;
    });
    
    return Object.entries(sources)
      .filter(([_, count]) => count > 0)
      .map(([source, count], index) => ({
        label: source,
        count,
        color: colors[index % colors.length]
      }));
  };

  // Residual risk levels distribution data
  const getResidualRiskData = () => {
    const residualLevels = { low: 0, medium: 0, high: 0, extreme: 0 };
    // Use the same colors as getRiskColor function for consistency
    const colors = { 
      low: '#4CAF50',    // Green - matches getRiskColor("Low")
      medium: '#FFC107', // Yellow - matches getRiskColor("Medium")
      high: '#FF9800',   // Orange - matches getRiskColor("High")
      extreme: '#F44336' // Red - matches getRiskColor("Extreme")
    };
    
    const filteredRisks = includeClosedRisks ? risks : risks.filter(risk => risk.status !== 'closed');
    
    filteredRisks.forEach(risk => {
      // Get residual risk level from either calculated or manual field
      let residualLevel = '';
      
      if (risk.assessmentType === 'qualitative') {
        // For qualitative, use the calculated residual risk level
        residualLevel = risk.calculatedResidualRiskLevel || '';
      } else {
        // For quantitative, use the manual residual risk field
        residualLevel = risk.residualRisk || '';
      }
      
      // Convert to lowercase and check if it's a valid level
      const normalizedLevel = residualLevel.toLowerCase();
      if (residualLevels.hasOwnProperty(normalizedLevel) && normalizedLevel !== '') {
        residualLevels[normalizedLevel]++;
      }
    });
    
    return Object.entries(residualLevels)
      .filter(([_, count]) => count > 0)
      .map(([level, count]) => ({
        label: level.charAt(0).toUpperCase() + level.slice(1),
        count,
        color: colors[level]
      }));
  };

  // Color schemes for different charts
  const riskLevelColors = ['#28a745', '#ffc107', '#fd7e14', '#dc3545']; // Green, Yellow, Orange, Red
  const categoryColors = ['#007bff', '#6f42c1', '#e83e8c', '#fd7e14', '#20c997', '#6c757d'];
  const treatmentColors = ['#17a2b8', '#28a745', '#ffc107', '#dc3545', '#6f42c1'];

  // Default risk matrix values
  const defaultRiskMatrix = {
    "Negligible-Very Unlikely": "Low",
    "Negligible-Unlikely": "Low",
    "Negligible-Possible": "Low",
    "Negligible-Likely": "Low",
    "Negligible-Very Likely": "Medium",
    "Minor-Very Unlikely": "Low",
    "Minor-Unlikely": "Low",
    "Minor-Possible": "Low",
    "Minor-Likely": "Medium",
    "Minor-Very Likely": "Medium",
    "Moderate-Very Unlikely": "Low",
    "Moderate-Unlikely": "Low",
    "Moderate-Possible": "Medium",
    "Moderate-Likely": "Medium",
    "Moderate-Very Likely": "High",
    "Major-Very Unlikely": "Low",
    "Major-Unlikely": "Medium",
    "Major-Possible": "Medium",
    "Major-Likely": "High",
    "Major-Very Likely": "Extreme",
    "Severe-Very Unlikely": "Medium",
    "Severe-Unlikely": "Medium",
    "Severe-Possible": "High",
    "Severe-Likely": "Extreme",
    "Severe-Very Likely": "Extreme",
  };

  const [riskMatrix, setRiskMatrix] = useState(defaultRiskMatrix);

  const resetRiskMatrix = () => {
    setRiskMatrix({ ...defaultRiskMatrix });
  };

  const getRiskColor = (level) => {
    switch (level) {
      case "Low":
        return "#4CAF50"; // Green
      case "Medium":
        return "#FFC107"; // Yellow
      case "High":
        return "#FF9800"; // Orange
      case "Extreme":
        return "#F44336"; // Red
      default:
        return "#E0E0E0"; // Grey
    }
  };

  const handleMatrixChange = (severity, likelihood, value) => {
    setRiskMatrix((prev) => ({
      ...prev,
      [`${severity}-${likelihood}`]: value,
    }));
  };

  const calculateALE = (form) => {
    const sleValue = parseFloat(form.sle) || 0;
    const aroValue = parseFloat(form.aro) || 0;
    return sleValue * aroValue;
  };

  const formatCurrency = (amount, currency = "dollar") => {
    const currencySymbols = {
      dollar: "$",
      euro: "€",
      pound: "£",
      yen: "¥",
      rupee: "₹",
      peso: "₱",
      won: "₩",
      lira: "₺",
      franc: "₣",
      shekel: "₪",
      other: "¤"
    };
    
    const symbol = currencySymbols[currency] || "¤";
    // Round to 2 decimal places for proper currency formatting
    const roundedAmount = Math.round(amount * 100) / 100;
    return `${symbol}${roundedAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper function to build distribution parameter objects
  const buildDistributionParams = (distributionType, form, isLoss = true) => {
    const prefix = isLoss ? 'loss' : 'frequency';
    
    switch (distributionType) {
      case 'triangular':
        const minVal = parseFloat(form[`min${isLoss ? 'Loss' : 'Frequency'}`]) || 0;
        const modeVal = parseFloat(form[`mostLikely${isLoss ? 'Loss' : 'Frequency'}`]) || 0;
        const maxVal = parseFloat(form[`max${isLoss ? 'Loss' : 'Frequency'}`]) || 0;
        
        // Ensure valid triangular distribution parameters
        const validMin = Math.max(0, minVal);
        const validMax = Math.max(validMin + 0.01, maxVal);
        const validMode = Math.max(validMin, Math.min(validMax, modeVal || (validMin + validMax) / 2));
        
        return {
          type: 'triangular',
          min: validMin,
          mode: validMode,
          max: validMax
        };
      case 'normal':
        const meanVal = parseFloat(form[`${prefix}Mean`]) || 1;
        const stdDevVal = parseFloat(form[`${prefix}StdDev`]) || 0.1;
        return {
          type: 'normal',
          mean: meanVal,
          stdDev: Math.max(0.001, stdDevVal) // Ensure positive standard deviation
        };
      case 'lognormal':
        const lnMeanVal = parseFloat(form[`${prefix}Mean`]) || 1;
        const lnStdDevVal = parseFloat(form[`${prefix}StdDev`]) || 0.1;
        return {
          type: 'logNormal',
          mean: lnMeanVal,
          stdDev: Math.max(0.001, lnStdDevVal) // Ensure positive standard deviation
        };
      case 'uniform':
        const uMinVal = parseFloat(form[`min${isLoss ? 'Loss' : 'Frequency'}`]) || 0;
        const uMaxVal = parseFloat(form[`max${isLoss ? 'Loss' : 'Frequency'}`]) || 1;
        
        // Ensure valid uniform distribution parameters
        const validUMin = Math.max(0, uMinVal);
        const validUMax = Math.max(validUMin + 0.01, uMaxVal);
        
        return {
          type: 'uniform',
          min: validUMin,
          max: validUMax
        };
      case 'beta':
        const bMinVal = parseFloat(form[`min${isLoss ? 'Loss' : 'Frequency'}`]) || 0;
        const bMaxVal = parseFloat(form[`max${isLoss ? 'Loss' : 'Frequency'}`]) || 1;
        const alphaVal = parseFloat(form[`${prefix}Alpha`]) || 2;
        const betaVal = parseFloat(form[`${prefix}Beta`]) || 2;
        
        // Ensure valid beta distribution parameters
        const validBMin = Math.max(0, bMinVal);
        const validBMax = Math.max(validBMin + 0.01, bMaxVal);
        
        return {
          type: 'beta',
          min: validBMin,
          max: validBMax,
          alpha: Math.max(0.1, alphaVal),
          beta: Math.max(0.1, betaVal)
        };
      case 'poisson':
        const lambdaVal = parseFloat(form[`${prefix}Lambda`]) || 1;
        return {
          type: 'poisson',
          lambda: Math.max(0.001, lambdaVal) // Ensure positive lambda
        };
      case 'exponential':
        const expLambdaVal = parseFloat(form[`${prefix}LambdaExp`]) || 1;
        return {
          type: 'exponential',
          lambda: Math.max(0.001, expLambdaVal) // Ensure positive lambda
        };
      default:
        // Default to triangular with sensible defaults
        return {
          type: 'triangular',
          min: isLoss ? 1000 : 0.1,
          mode: isLoss ? 10000 : 0.5,
          max: isLoss ? 100000 : 2.0
        };
    }
  };

  // Helper function to run Monte Carlo simulation
  const runMonteCarloSimulation = (form) => {
    const iterations = parseInt(form.monteCarloIterations) || 10000;
    const confidenceLevel = parseFloat(form.confidenceLevel) / 100 || 0.95;
    
    // Build severity (loss) distribution parameters
    const severityParams = buildDistributionParams(form.lossDistribution, form, true);
    
    // Build frequency distribution parameters
    const frequencyParams = buildDistributionParams(form.frequencyDistribution, form, false);
    
    // Debug logging
    console.log('Monte Carlo Simulation Parameters:');
    console.log('Form data:', form);
    console.log('Iterations:', iterations);
    console.log('Confidence Level:', confidenceLevel);
    console.log('Severity Params:', severityParams);
    console.log('Frequency Params:', frequencyParams);
    
    // Validate parameters
    if (!severityParams || !frequencyParams) {
      console.error('Invalid distribution parameters');
      return { expectedAnnualLoss: 0, valueAtRisk: 0, annualLosses: [] };
    }
    
    // Check if runMonteCarlo is available
    if (typeof runMonteCarlo !== 'function') {
      console.error('runMonteCarlo function not available');
      return { expectedAnnualLoss: 0, valueAtRisk: 0, annualLosses: [] };
    }
    
    // Create event structure for Monte Carlo simulation
    const events = [{
      severity: severityParams,
      frequency: frequencyParams
    }];
    
    console.log('Events for simulation:', events);
    
    try {
      // Run Monte Carlo simulation
      const results = runMonteCarlo(events, iterations, confidenceLevel);
      console.log('Monte Carlo Results:', results);
      
      // Validate results
      if (!results || typeof results.expectedAnnualLoss !== 'number' || typeof results.valueAtRisk !== 'number') {
        console.error('Invalid Monte Carlo results:', results);
        return { expectedAnnualLoss: 0, valueAtRisk: 0, annualLosses: [] };
      }
      
      return results;
    } catch (error) {
      console.error('Monte Carlo simulation error:', error);
      return {
        expectedAnnualLoss: 0,
        valueAtRisk: 0,
        annualLosses: []
      };
    }
  };

  // Monte Carlo results cache to avoid multiple simulations
  const [monteCarloCache, setMonteCarloCache] = useState({});

  // Helper function to get or compute Monte Carlo results with caching
  const getMonteCarloResults = (form) => {
    // Create a cache key based on form parameters that affect Monte Carlo simulation
    const cacheKey = JSON.stringify({
      assessmentType: form.assessmentType,
      lossDistribution: form.lossDistribution,
      frequencyDistribution: form.frequencyDistribution,
      minLoss: form.minLoss,
      mostLikelyLoss: form.mostLikelyLoss,
      maxLoss: form.maxLoss,
      minFrequency: form.minFrequency,
      mostLikelyFrequency: form.mostLikelyFrequency,
      maxFrequency: form.maxFrequency,
      monteCarloIterations: form.monteCarloIterations,
      confidenceLevel: form.confidenceLevel,
      sleCurrency: form.sleCurrency,
      // Distribution-specific parameters
      lossMean: form.lossMean,
      lossStdDev: form.lossStdDev,
      frequencyMean: form.frequencyMean,
      frequencyStdDev: form.frequencyStdDev,
      lossAlpha: form.lossAlpha,
      lossBeta: form.lossBeta,
      frequencyAlpha: form.frequencyAlpha,
      frequencyBeta: form.frequencyBeta,
      frequencyLambda: form.frequencyLambda,
      frequencyLambdaExp: form.frequencyLambdaExp
    });

    // Check if we have cached results for these parameters
    if (monteCarloCache[cacheKey]) {
      console.log('Using cached Monte Carlo results');
      return monteCarloCache[cacheKey];
    }

    // Run new simulation and cache results
    console.log('Running new Monte Carlo simulation');
    const results = runMonteCarloSimulation(form);
    
    // Cache the results
    setMonteCarloCache(prev => ({
      ...prev,
      [cacheKey]: results
    }));

    return results;
  };

  // Monte Carlo calculation functions
  const calculateMonteCarloExpectedLoss = (form) => {
    const results = getMonteCarloResults(form);
    console.log('Expected Loss Results:', results);
    
    if (results.expectedAnnualLoss && results.expectedAnnualLoss > 0) {
      return formatCurrency(results.expectedAnnualLoss, form.sleCurrency);
    }
    
    return "";
  };

  // Helper function to get numeric value for risk level calculation
  const getMonteCarloExpectedLossNumeric = (form) => {
    const results = getMonteCarloResults(form);
    return results.expectedAnnualLoss || 0;
  };

  // Helper function to get numeric VaR value for total calculation
  const getMonteCarloVaRNumeric = (form) => {
    const results = getMonteCarloResults(form);
    return results.valueAtRisk || 0;
  };

  const calculateMonteCarloVaR = (form) => {
    const results = getMonteCarloResults(form);
    console.log('VaR Results:', results);
    
    if (results.valueAtRisk && results.valueAtRisk > 0) {
      return formatCurrency(results.valueAtRisk, form.sleCurrency);
    }
    
    return "";
  };

  const calculateMonteCarloResults = (form) => {
    const results = getMonteCarloResults(form);
    const iterations = parseInt(form.monteCarloIterations) || 10000;
    const confidenceLevel = parseFloat(form.confidenceLevel) || 95;
    
    if (!results.expectedAnnualLoss && !results.valueAtRisk) {
      return "";
    }

    // Calculate distribution statistics
    const annualLosses = results.annualLosses || [];
    const sortedLosses = [...annualLosses].sort((a, b) => a - b);
    
    // Calculate percentiles
    const median = sortedLosses[Math.floor(sortedLosses.length * 0.5)] || 0;
    const p25 = sortedLosses[Math.floor(sortedLosses.length * 0.25)] || 0;
    const p75 = sortedLosses[Math.floor(sortedLosses.length * 0.75)] || 0;
    const p90 = sortedLosses[Math.floor(sortedLosses.length * 0.9)] || 0;
    const p99 = sortedLosses[Math.floor(sortedLosses.length * 0.99)] || 0;
    
    // Calculate standard deviation
    const mean = results.expectedAnnualLoss;
    const variance = annualLosses.reduce((sum, loss) => sum + Math.pow(loss - mean, 2), 0) / annualLosses.length;
    const stdDev = Math.sqrt(variance);
    
    // Get distribution parameters for display
    const severityParams = buildDistributionParams(form.lossDistribution, form, true);
    const frequencyParams = buildDistributionParams(form.frequencyDistribution, form, false);
    
    // Generate summary text
    return `Monte Carlo Simulation Results (${iterations.toLocaleString()} iterations):

LOSS DISTRIBUTION (${form.lossDistribution}):
${form.lossDistribution === 'triangular' ? 
  `• Minimum: ${formatCurrency(severityParams.min, form.sleCurrency)}
• Mode: ${formatCurrency(severityParams.mode, form.sleCurrency)}
• Maximum: ${formatCurrency(severityParams.max, form.sleCurrency)}` :
  form.lossDistribution === 'normal' || form.lossDistribution === 'lognormal' ?
  `• Mean: ${formatCurrency(severityParams.mean, form.sleCurrency)}
• Standard Deviation: ${formatCurrency(severityParams.stdDev, form.sleCurrency)}` :
  form.lossDistribution === 'uniform' ?
  `• Minimum: ${formatCurrency(severityParams.min, form.sleCurrency)}
• Maximum: ${formatCurrency(severityParams.max, form.sleCurrency)}` :
  form.lossDistribution === 'beta' ?
  `• Minimum: ${formatCurrency(severityParams.min, form.sleCurrency)}
• Maximum: ${formatCurrency(severityParams.max, form.sleCurrency)}
• Alpha: ${severityParams.alpha}
• Beta: ${severityParams.beta}` : ''
}

FREQUENCY DISTRIBUTION (${form.frequencyDistribution}):
${form.frequencyDistribution === 'triangular' ? 
  `• Minimum: ${frequencyParams.min.toFixed(2)} events/year
• Mode: ${frequencyParams.mode.toFixed(2)} events/year
• Maximum: ${frequencyParams.max.toFixed(2)} events/year` :
  form.frequencyDistribution === 'normal' ?
  `• Mean: ${frequencyParams.mean.toFixed(2)} events/year
• Standard Deviation: ${frequencyParams.stdDev.toFixed(2)} events/year` :
  form.frequencyDistribution === 'uniform' ?
  `• Minimum: ${frequencyParams.min.toFixed(2)} events/year
• Maximum: ${frequencyParams.max.toFixed(2)} events/year` :
  form.frequencyDistribution === 'poisson' ?
  `• Lambda (Rate): ${frequencyParams.lambda.toFixed(2)} events/year` :
  form.frequencyDistribution === 'exponential' ?
  `• Lambda (Rate): ${frequencyParams.lambda.toFixed(2)}` : ''
}

SIMULATION RESULTS:
• Expected Annual Loss: ${formatCurrency(results.expectedAnnualLoss, form.sleCurrency)}
• ${confidenceLevel}% Value at Risk: ${formatCurrency(results.valueAtRisk, form.sleCurrency)}
• Standard Deviation: ${formatCurrency(stdDev, form.sleCurrency)}
• Median (50th percentile): ${formatCurrency(median, form.sleCurrency)}

PERCENTILE ANALYSIS:
• 25th Percentile: ${formatCurrency(p25, form.sleCurrency)}
• 75th Percentile: ${formatCurrency(p75, form.sleCurrency)}
• 90th Percentile: ${formatCurrency(p90, form.sleCurrency)}
• 99th Percentile: ${formatCurrency(p99, form.sleCurrency)}

INTERPRETATION:
• Results based on ${iterations.toLocaleString()} Monte Carlo iterations
• ${confidenceLevel}% confidence that annual loss will not exceed VaR
• Expected loss represents long-term average annual impact
• Consider risk tolerance and mitigation strategies
• Regular model validation and parameter updates recommended`;
  };

  const calculateOverallRiskScore = (form) => {
    const likelihoodValue = parseInt(form.likelihood) || 0;
    const impactValue = parseInt(form.impact) || 0;
    return likelihoodValue + impactValue;
  };

  const getRiskLevel = (likelihoodValue, impactValue) => {
    if (!likelihoodValue || !impactValue) return "";

    const likelihoodText = likelihoodMap[likelihoodValue];
    const impactText = impactMap[impactValue];

    if (!likelihoodText || !impactText) return "";

    // Look up the risk level from the matrix
    const matrixKey = `${impactText}-${likelihoodText}`;
    return riskMatrix[matrixKey]?.toLowerCase() || "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedForm = { ...form, [name]: value };
    setForm(updatedForm);
    
    // Clear Monte Carlo cache when parameters that affect simulation change
    const monteCarloParams = [
      'assessmentType', 'lossDistribution', 'frequencyDistribution',
      'minLoss', 'mostLikelyLoss', 'maxLoss', 'minFrequency', 'mostLikelyFrequency', 'maxFrequency',
      'monteCarloIterations', 'confidenceLevel', 'sleCurrency',
      'lossMean', 'lossStdDev', 'frequencyMean', 'frequencyStdDev',
      'lossAlpha', 'lossBeta', 'frequencyAlpha', 'frequencyBeta',
      'frequencyLambda', 'frequencyLambdaExp'
    ];
    
    if (monteCarloParams.includes(name)) {
      console.log(`Clearing Monte Carlo cache due to change in ${name}`);
      setMonteCarloCache({});
    }
    
    // Clear validation errors for mandatory fields when user starts typing
    if (showValidation && (name === 'riskId' || name === 'riskTitle')) {
      if (value.trim() && validationErrors[name]) {
        const updatedErrors = { ...validationErrors };
        delete updatedErrors[name];
        setValidationErrors(updatedErrors);
      }
    }
  };

  const getResidualRiskLevel = (likelihoodValue, impactValue) => {
    if (!likelihoodValue || !impactValue) return "";

    const likelihoodText = likelihoodMap[likelihoodValue];
    const impactText = impactMap[impactValue];

    if (!likelihoodText || !impactText) return "";

    // Look up the risk level from the matrix
    const matrixKey = `${impactText}-${likelihoodText}`;
    return riskMatrix[matrixKey]?.toLowerCase() || "";
  };

  const overallRiskScore = calculateOverallRiskScore(form);
  const riskLevel = getRiskLevel(form.likelihood, form.impact);
  const calculatedResidualRiskLevel = getResidualRiskLevel(
    form.residualLikelihood,
    form.residualImpact,
  );

  // Function to determine risk level based on ALE value and threshold currency
  const getQuantitativeRiskLevel = (aleValue) => {
    if (aleValue >= thresholds.quantitative.extreme) {
      return "extreme";
    } else if (aleValue >= thresholds.quantitative.high.min) {
      return "high";
    } else if (aleValue >= thresholds.quantitative.medium.min) {
      return "medium";
    } else {
      return "low";
    }
  };

  // Function to determine risk level based on Advanced Quantitative Expected Loss
  const getAdvancedQuantitativeRiskLevel = (expectedLoss) => {
    const numericValue = typeof expectedLoss === 'number' ? expectedLoss : parseFloat(expectedLoss) || 0;
    if (numericValue >= thresholds.advancedQuantitative.extreme) {
      return "extreme";
    } else if (numericValue >= thresholds.advancedQuantitative.high.min) {
      return "high";
    } else if (numericValue >= thresholds.advancedQuantitative.medium.min) {
      return "medium";
    } else {
      return "low";
    }
  };

  // Function to restore default threshold values
  const restoreDefaultThresholds = () => {
    setThresholds({
      quantitative: {
        extreme: 1000000,
        high: { min: 500000, max: 999999 },
        medium: { min: 100000, max: 499999 },
        low: 100000
      },
      advancedQuantitative: {
        extreme: 2000000,
        high: { min: 1000000, max: 1999999 },
        medium: { min: 200000, max: 999999 },
        low: 200000
      }
    });
  };

  // Function to update threshold values
  const updateThreshold = (type, level, field, value) => {
    const numericValue = parseFloat(value) || 0;
    setThresholds(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [level]: typeof prev[type][level] === 'object' 
          ? { ...prev[type][level], [field]: numericValue }
          : numericValue
      }
    }));
  };

  const getApproverPlaceholder = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case "extreme":
        return "CEO, Board of Directors, Chief Risk Officer (CRO), Chief Executive Officer";
      case "high":
        return "Chief Risk Officer (CRO), Chief Financial Officer (CFO), Chief Operating Officer (COO), Executive Management Team";
      case "medium":
        return "Senior Management, Division/Department Heads, Risk Management Committee, General Manager";
      case "low":
        return "Line Managers, Team Leaders, Risk Coordinators, Operational Management";
      default:
        return "Enter approver name based on risk level";
    }
  };

  // Helper functions for risk management
  const clearRarFields = () => {
    setForm(initialForm);
    setMonteCarloCache({}); // Clear Monte Carlo cache when resetting form
  };

  const getCurrentRiskData = () => ({
    ...form,
    riskLevel:
      form.assessmentType === "qualitative" ? riskLevel : form.manualRiskLevel,
    calculatedResidualRiskLevel:
      form.assessmentType === "qualitative"
        ? calculatedResidualRiskLevel
        : form.residualRisk,
    ale: form.assessmentType === "quantitative" ? calculateALE(form) : 0,
    expectedLoss: form.assessmentType === "advancedQuantitative" ? calculateMonteCarloExpectedLoss(form) : "",
    valueAtRisk: form.assessmentType === "advancedQuantitative" ? calculateMonteCarloVaR(form) : "",
    monteCarloResults: form.assessmentType === "advancedQuantitative" ? calculateMonteCarloResults(form) : "",
  });

  const loadRiskData = (risk) => {
    setForm({
      ...initialForm,
      ...risk,
    });
    setMonteCarloCache({}); // Clear Monte Carlo cache when loading new risk data
  };

  // Validation function for mandatory fields
  const validateMandatoryFields = () => {
    const errors = {};
    
    if (!form.riskId.trim()) {
      errors.riskId = "Risk ID is required";
    }
    
    if (!form.riskTitle.trim()) {
      errors.riskTitle = "Risk Title is required";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitRisk = () => {
    setShowValidation(true);
    
    if (!validateMandatoryFields()) {
      alert("Please fill in all mandatory fields (Risk ID and Risk Title)");
      return;
    }

    const riskData = getCurrentRiskData();

    const newRisks = [...risks, { ...riskData, id: Date.now() }];
    
    setRisks(newRisks);
    
    clearRarFields();
    
    setRarFieldsOpen(false);
    setRisksOpen(true);
    setSelectedRiskIndex(null);
    setIsEditingRisk(false);
    setShowValidation(false);
    setEditIndex(null);
    setValidationErrors({});
  };

  const handleUpdateRisk = () => {
    if (selectedRiskIndex === null) return;

    setShowValidation(true);
    
    if (!validateMandatoryFields()) {
      alert("Please fill in all mandatory fields (Risk ID and Risk Title)");
      return;
    }

    const riskData = getCurrentRiskData();

    const updatedRisks = [...risks];
    updatedRisks[selectedRiskIndex] = {
      ...riskData,
      id: risks[selectedRiskIndex].id,
    };
    setRisks(updatedRisks);
    clearRarFields();
    setRarFieldsOpen(false);
    setRisksOpen(true);
    setSelectedRiskIndex(null);
    setIsEditingRisk(false);
    setShowValidation(false);
    setValidationErrors({});
  };

  const handleSelectRisk = (index) => {
    setSelectedRiskIndex(index);
    setIsEditingRisk(true);
    loadRiskData(risks[index]);
    setRarFieldsOpen(true);
    setRisksOpen(true);
  };

  const handleDeleteRisk = (index) => {
    if (window.confirm("Are you sure you want to delete this risk?")) {
      const updatedRisks = risks.filter((_, i) => i !== index);
      setRisks(updatedRisks);
      if (selectedRiskIndex === index) {
        clearRarFields();
        setSelectedRiskIndex(null);
        setIsEditingRisk(false);
      } else if (selectedRiskIndex > index) {
        setSelectedRiskIndex(selectedRiskIndex - 1);
      }
    }
  };

  // Drag and drop handlers for reordering risks
  const handleDragStart = (e, index) => {
    setDraggedRiskIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target.outerHTML);
    e.target.style.opacity = "0.5";
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = "1";
    setDraggedRiskIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();

    if (draggedRiskIndex === null || draggedRiskIndex === dropIndex) {
      return;
    }

    const updatedRisks = [...risks];
    const draggedRisk = updatedRisks[draggedRiskIndex];

    // Remove the dragged item
    updatedRisks.splice(draggedRiskIndex, 1);

    // Insert it at the new position
    const insertIndex =
      draggedRiskIndex < dropIndex ? dropIndex - 1 : dropIndex;
    updatedRisks.splice(insertIndex, 0, draggedRisk);

    setRisks(updatedRisks);

    // Update selected risk index if needed
    if (selectedRiskIndex === draggedRiskIndex) {
      setSelectedRiskIndex(insertIndex);
    } else if (selectedRiskIndex !== null) {
      if (
        draggedRiskIndex < selectedRiskIndex &&
        insertIndex >= selectedRiskIndex
      ) {
        setSelectedRiskIndex(selectedRiskIndex - 1);
      } else if (
        draggedRiskIndex > selectedRiskIndex &&
        insertIndex <= selectedRiskIndex
      ) {
        setSelectedRiskIndex(selectedRiskIndex + 1);
      }
    }

    setDraggedRiskIndex(null);
    setDragOverIndex(null);
  };

  // Functions expected by RARTable component
  const handleEditRisk = (index) => {
    setSelectedRiskIndex(index);
    const selectedRisk = risks[index];
    
    // Set form data with the selected risk
    setForm({
      ...selectedRisk,
      // Map any field differences if needed
    });
    
    setIsEditingRisk(true);
    setRarFieldsOpen(true);
  };

  const handleMoveRisk = (fromIndex, toIndex) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= risks.length) {
      return;
    }

    const updatedRisks = [...risks];
    const riskToMove = updatedRisks[fromIndex];
    updatedRisks.splice(fromIndex, 1);
    updatedRisks.splice(toIndex, 0, riskToMove);

    setRisks(updatedRisks);

    // Update selected risk index if needed
    if (selectedRiskIndex === fromIndex) {
      setSelectedRiskIndex(toIndex);
    } else if (selectedRiskIndex !== null) {
      if (fromIndex < selectedRiskIndex && toIndex >= selectedRiskIndex) {
        setSelectedRiskIndex(selectedRiskIndex - 1);
      } else if (fromIndex > selectedRiskIndex && toIndex <= selectedRiskIndex) {
        setSelectedRiskIndex(selectedRiskIndex + 1);
      }
    }
  };

  const moveRiskUp = (index) => {
    if (index === 0) return;

    const updatedRisks = [...risks];
    const riskToMove = updatedRisks[index];
    updatedRisks.splice(index, 1);
    updatedRisks.splice(index - 1, 0, riskToMove);

    setRisks(updatedRisks);

    // Update selected risk index if needed
    if (selectedRiskIndex === index) {
      setSelectedRiskIndex(index - 1);
    } else if (selectedRiskIndex === index - 1) {
      setSelectedRiskIndex(index);
    }
  };

  const moveRiskDown = (index) => {
    if (index === risks.length - 1) return;

    const updatedRisks = [...risks];
    const riskToMove = updatedRisks[index];
    updatedRisks.splice(index, 1);
    updatedRisks.splice(index + 1, 0, riskToMove);

    setRisks(updatedRisks);

    // Update selected risk index if needed
    if (selectedRiskIndex === index) {
      setSelectedRiskIndex(index + 1);
    } else if (selectedRiskIndex === index + 1) {
      setSelectedRiskIndex(index);
    }
  };

  const handleNewRisk = () => {
    clearRarFields();
    setSelectedRiskIndex(null);
    setIsEditingRisk(false);
    setRarFieldsOpen(true);
  };

  const handleRefreshMonteCarloSimulation = () => {
    // Clear the Monte Carlo cache to force re-calculation
    setMonteCarloCache({});
    
    // Force a form update to trigger re-calculation
    setForm(prevForm => ({
      ...prevForm,
      // Touch a field to trigger useEffect and force recalculation
      monteCarloIterations: prevForm.monteCarloIterations
    }));
  };

  const handleStartNew = () => {
    if (window.confirm("Are you sure you want to remove all risks? This action cannot be undone.")) {
      setRisks([]);
      clearRarFields();
      setSelectedRiskIndex(null);
      setIsEditingRisk(false);
      setRarFieldsOpen(true);
      setRisksOpen(false);
    }
  };

  return (
    <div>
      <div className="rar-main-container">
        <h2 className="rar-main-heading">
          Risk Assessment Report
        </h2>

        {/* Collapsible RAR Guidance and Preparation Section */}
        <RARIntro
          riskMatrix={riskMatrix}
          setRiskMatrix={setRiskMatrix}
          resetRiskMatrix={resetRiskMatrix}
          handleMatrixChange={handleMatrixChange}
          getRiskColor={getRiskColor}
          thresholds={thresholds}
          setThresholds={setThresholds}
          thresholdCurrency={thresholdCurrency}
          setThresholdCurrency={setThresholdCurrency}
          updateThreshold={updateThreshold}
          restoreDefaultThresholds={restoreDefaultThresholds}
          formatCurrency={formatCurrency}
        />

        {/* RAR Fields Section */}
        <InputForm
          // Form state
          form={form}
          setForm={setForm}
          showValidation={showValidation}
          setShowValidation={setShowValidation}
          validationErrors={validationErrors}
          setValidationErrors={setValidationErrors}
          
          // UI state
          rarFieldsOpen={rarFieldsOpen}
          setRarFieldsOpen={setRarFieldsOpen}
          isEditingRisk={isEditingRisk}
          setIsEditingRisk={setIsEditingRisk}
          setSelectedRiskIndex={setSelectedRiskIndex}
          setRisksOpen={setRisksOpen}
          
          // Functions
          handleChange={handleChange}
          handleSubmitRisk={handleSubmitRisk}
          handleUpdateRisk={handleUpdateRisk}
          clearRarFields={clearRarFields}
          
          // Calculation functions
          calculateALE={calculateALE}
          formatCurrency={formatCurrency}
          getRiskColor={getRiskColor}
          getStatusColor={getStatusColor}
          getToday={getToday}
          getApproverPlaceholder={getApproverPlaceholder}
          riskLevel={riskLevel}
          calculatedResidualRiskLevel={calculatedResidualRiskLevel}
          overallRiskScore={overallRiskScore}
          
          // Monte Carlo functions
          calculateMonteCarloExpectedLoss={calculateMonteCarloExpectedLoss}
          calculateMonteCarloVaR={calculateMonteCarloVaR}
          calculateMonteCarloResults={calculateMonteCarloResults}
          handleRefreshMonteCarloSimulation={handleRefreshMonteCarloSimulation}
          getMonteCarloExpectedLossNumeric={getMonteCarloExpectedLossNumeric}
          
          // Risk level functions
          getQuantitativeRiskLevel={getQuantitativeRiskLevel}
          getAdvancedQuantitativeRiskLevel={getAdvancedQuantitativeRiskLevel}
          
          // Risk matrix
          riskMatrix={riskMatrix}
        /> 

         {/* RAR Table Section */}
        <RARTable 
          risks={risks}
          risksOpen={risksOpen}
          setRisksOpen={setRisksOpen}
          handleNewRisk={handleNewRisk}
          handleStartNew={handleStartNew}
          handleEditRisk={handleEditRisk}
          handleDeleteRisk={handleDeleteRisk}
          handleMoveRisk={handleMoveRisk}
          rarFieldsOpen={rarFieldsOpen}
          selectedRiskIndex={selectedRiskIndex}
          setSelectedRiskIndex={setSelectedRiskIndex}
          draggedRiskIndex={draggedRiskIndex}
          setDraggedRiskIndex={setDraggedRiskIndex}
          dropTargetIndex={dropTargetIndex}
          setDropTargetIndex={setDropTargetIndex}
          editIndex={editIndex}
          setEditIndex={setEditIndex}
          hoveredRowIndex={hoveredRowIndex}
          setHoveredRowIndex={setHoveredRowIndex}
          setRarFieldsOpen={setRarFieldsOpen}
          setIsEditingRisk={setIsEditingRisk}
          setForm={setForm}
          calculateALE={calculateALE}
          formatCurrency={formatCurrency}
          getRiskColor={getRiskColor}
          getStatusColor={getStatusColor}
          likelihoodMap={likelihoodMap}
          impactMap={impactMap}
        />

          {/* Final Report Section */}
          <RARReport 
            risks={risks}
            includeClosedRisks={includeClosedRisks}
            setIncludeClosedRisks={setIncludeClosedRisks}
            showAdditionalConsiderations={showAdditionalConsiderations}
            setShowAdditionalConsiderations={setShowAdditionalConsiderations}
            createDonutChart={createDonutChart}
            getRiskLevelData={getRiskLevelData}
            getFilteredRisksCount={getFilteredRisksCount}
            getResidualRiskData={getResidualRiskData}
            getStatusData={getStatusData}
            getThreatSourceData={getThreatSourceData}
            getCategoryData={getCategoryData}
            getTreatmentData={getTreatmentData}
            getTop5RisksByLevel={getTop5RisksByLevel}
            likelihoodMap={likelihoodMap}
            impactMap={impactMap}
            getRiskColor={getRiskColor}
            getRiskMatrixHeatMapData={getRiskMatrixHeatMapData}
            calculateALE={calculateALE}
            getMonteCarloExpectedLossNumeric={getMonteCarloExpectedLossNumeric}
            getMonteCarloVaRNumeric={getMonteCarloVaRNumeric}
            getMonteCarloResults={getMonteCarloResults}
            thresholdCurrency={thresholdCurrency}
            formatCurrency={formatCurrency}
            SC3_PRIMARY={SC3_PRIMARY}
            SC3_SECONDARY={SC3_SECONDARY}
            SC3_BTN_FONT_WEIGHT={SC3_BTN_FONT_WEIGHT}
          />
      </div>
    </div>
  );
};

function WrappedRARForm() {
  return (
    <>
      <RARForm />
      <div className="rar-version-footer">
        SC3 RAR Form {VERSION}
      </div>
    </>
  );
}

export default WrappedRARForm;
