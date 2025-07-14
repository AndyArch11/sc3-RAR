import React, { useState } from "react";
import * as XLSX from 'xlsx';

const VERSION = "v0.1.1"; // Update as needed

// SC3.com.au theme colours
const SC3_PRIMARY = "#003366"; // Deep blue
const SC3_SECONDARY = "#0099cc"; // Bright blue
const SC3_ACCENT = "#fbc02d"; // Gold/yellow
const SC3_BG = "#f4f8fb"; // Light background
const SC3_GREEN = "#388e3c"; // For impact
const SC3_TABLE_HEADER = "#e5eef5"; // Light blue for table header

// Additional style constants for parametric styling
const SC3_BORDER_RADIUS = 6;
const SC3_FORM_PADDING = 12;
const SC3_SECTION_MARGIN = 16;
const SC3_BTN_RADIUS = 4;
const SC3_BTN_FONT_WEIGHT = "bold";
const SC3_BTN_FONT_SIZE = "1em";
const SC3_BTN_PADDING = "0.6em 1.5em";
const SC3_BTN_BOX_SHADOW = (color) => `0 2px 6px ${color}22`;
const SC3_TABLE_BORDER_RADIUS = 8;
const SC3_TABLE_BG = "#fff";
const SC3_TABLE_HEADER_FONT_SIZE = "1.05em";
const SC3_TABLE_HEADER_FONT_WEIGHT = "bold";
const SC3_TABLE_HEADER_BG = "#e5eef5";
const SC3_TABLE_ROW_HIGHLIGHT = "#e3f2fd";
const SC3_TABLE_TRANSITION = "background 0.2s";
const SC3_INPUT_BORDER_RADIUS = 4;
const SC3_INPUT_PADDING = "0.4em 0.6em";

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
  const [selectedRiskIndex, setSelectedRiskIndex] = useState(null);
  const [isEditingRisk, setIsEditingRisk] = useState(false);
  const [rarFieldsOpen, setRarFieldsOpen] = useState(true);
  const [risksOpen, setRisksOpen] = useState(false);

  // Drag and drop state for reordering risks
  const [draggedRiskIndex, setDraggedRiskIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Validation state for mandatory fields
  const [validationErrors, setValidationErrors] = useState({});
  const [showValidation, setShowValidation] = useState(false);

  // Analytics filter state
  const [includeClosedRisks, setIncludeClosedRisks] = useState(false);
  const [showAdditionalConsiderations, setShowAdditionalConsiderations] = useState(false);

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
      <div style={{ position: "relative", display: "inline-block" }}>
        <svg width={size} height={size} style={{ margin: "0 auto" }}>
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
                style={{ 
                  cursor: "pointer",
                  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))"
                }}
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
            fill="white"
            stroke="#ddd"
            strokeWidth="1"
          />
          <text
            x={centerX}
            y={centerY - 5}
            textAnchor="middle"
            fontSize="14"
            fontWeight="bold"
            fill="#333"
          >
            Total
          </text>
          <text
            x={centerX}
            y={centerY + 10}
            textAnchor="middle"
            fontSize="12"
            fill="#666"
          >
            {total}
          </text>
        </svg>
        
        {/* Custom Tooltip */}
        {tooltip.visible && (
          <div
            style={{
              position: "fixed",
              left: `${tooltip.x + 10}px`,
              top: `${tooltip.y}px`,
              backgroundColor: "rgba(0, 0, 0, 0.9)",
              color: "white",
              padding: "0.5rem 0.75rem",
              borderRadius: "4px",
              fontSize: "0.8rem",
              fontWeight: "500",
              pointerEvents: "none",
              zIndex: 1000,
              whiteSpace: "nowrap",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.1)"
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
    return `${symbol}${amount.toLocaleString("en-US")}`;
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

  // Helper functions for risk management
  const clearRarFields = () => {
    setForm(initialForm);
  };

  const getCurrentRiskData = () => ({
    ...form,
    riskLevel:
      form.assessmentType === "qualitative" ? riskLevel : form.manualRiskLevel,
    calculatedResidualRiskLevel:
      form.assessmentType === "qualitative"
        ? calculatedResidualRiskLevel
        : form.residualRisk,
    ale: calculateALE(form),
  });

  const loadRiskData = (risk) => {
    setForm({
      ...initialForm,
      ...risk,
    });
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

    setRisks([...risks, { ...riskData, id: Date.now() }]);
    clearRarFields();
    setRarFieldsOpen(false);
    setRisksOpen(true);
    setSelectedRiskIndex(null);
    setIsEditingRisk(false);
    setShowValidation(false);
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

  const handleExportToExcel = () => {
    try {
      // Create a new workbook
      const workbook = XLSX.utils.book_new();

      // Get RAR Guidance and Preparation content
      const guidanceContent = [
        ['RAR Guidance and Preparation'],
        [''],
        ['Purpose'],
        ['This Risk Assessment Report (RAR) template is designed to facilitate comprehensive risk identification, analysis, and treatment planning for organizations of all sizes. The template supports both qualitative and quantitative risk assessment methodologies and provides structured guidance for documenting risk management activities.'],
        [''],
        ['Key Components'],
        ['• Risk Identification and Documentation'],
        ['• Likelihood and Impact Assessment'],
        ['• Risk Level Calculation (Qualitative and Quantitative)'],
        ['• Treatment Strategy Planning'],
        ['• Residual Risk Analysis'],
        ['• Risk Monitoring and Review'],
        [''],
        ['Assessment Types'],
        ['Qualitative Assessment: Uses descriptive scales (1-5) for likelihood and impact ratings'],
        ['Quantitative Assessment: Uses financial metrics including Single Loss Expectancy (SLE) and Annual Rate of Occurrence (ARO) to calculate Annual Loss Expectancy (ALE)'],
        [''],
        ['Risk Matrix'],
        ['The system uses a configurable risk matrix to determine risk levels based on likelihood and impact combinations. Risk levels include:'],
        ['• Low: Minimal impact, acceptable risk'],
        ['• Medium: Moderate impact, manageable with standard controls'],
        ['• High: Significant impact, requires enhanced controls'],
        ['• Extreme: Critical impact, requires immediate attention'],
        [''],
        ['Best Practices'],
        ['• Involve relevant stakeholders in risk identification'],
        ['• Use consistent criteria for likelihood and impact assessment'],
        ['• Document assumptions and rationale for risk ratings'],
        ['• Regular review and update of risk assessments'],
        ['• Align risk treatment with organizational risk appetite']
      ];

      // Get Additional Considerations content
      const additionalContent = [
        ['Additional Considerations for Including in a Risk Assessment Report'],
        [''],
        ['Executive Summary'],
        ['• Assessment Overview: Brief description of the risk assessment scope, objectives, and methodology'],
        ['• Key Findings: Summary of critical risks identified and their potential impacts'],
        ['• Risk Profile: Overall risk posture and heat map summary'],
        ['• Priority Recommendations: Top 3-5 risk treatment recommendations requiring immediate attention'],
        [''],
        ['Methodology'],
        ['• Assessment Approach: Risk assessment framework and standards used'],
        ['• Scope Definition: Systems, processes, and assets included in the assessment'],
        ['• Data Collection: Information gathering methods and sources'],
        ['• Risk Criteria: Likelihood and impact rating scales and definitions'],
        [''],
        ['Risk Assessment Results'],
        ['• Risk Inventory: Comprehensive list of identified risks with descriptions'],
        ['• Risk Analysis: Detailed likelihood and impact assessments for each risk'],
        ['• Risk Evaluation: Risk level determinations and prioritization'],
        ['• Risk Heat Map: Visual representation of risk landscape'],
        [''],
        ['Risk Treatment Recommendations'],
        ['• Treatment Strategies: Recommended approaches for addressing each risk'],
        ['• Control Measures: Specific controls and safeguards to implement'],
        ['• Implementation Timeline: Phased approach and priority sequencing'],
        ['• Resource Requirements: Budget, personnel, and technology needs'],
        [''],
        ['Monitoring and Review'],
        ['• Risk Monitoring Framework: Key risk indicators and monitoring mechanisms'],
        ['• Review Schedule: Frequency and triggers for risk assessment updates'],
        ['• Reporting Structure: Risk reporting procedures and stakeholder communication'],
        ['• Continuous Improvement: Lessons learned and process enhancement recommendations'],
        [''],
        ['Appendices'],
        ['• Risk Register: Detailed risk inventory with full descriptions and assessments'],
        ['• Risk Heat Maps: Visual representation of risk landscape and priorities'],
        ['• Supporting Documentation: Evidence, data sources, and reference materials'],
        ['• Stakeholder Feedback: Input and validation from key stakeholders'],
        ['• Glossary: Definitions of risk management terms and concepts'],
        [''],
        ['Note: The RAR structure should be tailored to organizational needs and regulatory requirements. Consider industry-specific risk factors and compliance obligations when developing the assessment framework.']
      ];

      // Get Current Risk Assessment table data
      const riskTableHeaders = [
        'Risk ID', 'Risk Title', 'Framework', 'Category', 'Description', 'Assessor', 
        'Assessed Date', 'Risk Owner', 'Threat Source', 'Vulnerability', 'Current Controls',
        'Control Effectiveness', 'Assessment Type', 'Likelihood', 'Impact', 'Risk Level',
        'SLE', 'ARO', 'ALE', 'Treatment Strategy', 'Recommended Actions', 'Action Owner',
        'Target Date', 'Review Date', 'Status', 'Residual Likelihood', 'Residual Impact',
        'Residual Risk Level', 'Closed Date', 'Closed By'
      ];

      const riskTableData = [riskTableHeaders];
      
      risks.forEach(risk => {
        const row = [
          risk.riskId || '',
          risk.riskTitle || '',
          risk.framework || '',
          risk.riskCategory || '',
          risk.riskDescription || '',
          risk.assessor || '',
          risk.assessedDate || '',
          risk.riskOwner || '',
          risk.threatSource || '',
          risk.vulnerability || '',
          risk.currentControls || '',
          risk.controlEffectiveness || '',
          risk.assessmentType || '',
          risk.likelihood || '',
          risk.impact || '',
          risk.riskLevel || '',
          risk.sle || '',
          risk.aro || '',
          risk.ale || '',
          risk.treatmentStrategy || '',
          risk.recommendedActions || '',
          risk.actionOwner || '',
          risk.targetDate || '',
          risk.reviewDate || '',
          risk.status || '',
          risk.residualLikelihood || '',
          risk.residualImpact || '',
          risk.calculatedResidualRiskLevel || '',
          risk.closedDate || '',
          risk.closedBy || ''
        ];
        riskTableData.push(row);
      });

      // Create worksheets
      const guidanceWS = XLSX.utils.aoa_to_sheet(guidanceContent);
      const additionalWS = XLSX.utils.aoa_to_sheet(additionalContent);
      const riskTableWS = XLSX.utils.aoa_to_sheet(riskTableData);

      // Set column widths for better readability
      guidanceWS['!cols'] = [{ wch: 100 }];
      additionalWS['!cols'] = [{ wch: 100 }];
      riskTableWS['!cols'] = riskTableHeaders.map(() => ({ wch: 15 }));

      // Add worksheets to workbook
      XLSX.utils.book_append_sheet(workbook, guidanceWS, "RAR Guidance");
      XLSX.utils.book_append_sheet(workbook, additionalWS, "Additional Considerations");
      XLSX.utils.book_append_sheet(workbook, riskTableWS, "Current Risk Assessment");

      // Generate filename with current date
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const filename = `Risk_Assessment_Report_${dateStr}.xlsx`;

      // Save the file
      XLSX.writeFile(workbook, filename);

      alert(`Excel file "${filename}" has been downloaded successfully!`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('An error occurred while exporting to Excel. Please try again.');
    }
  };

  return (
    <div>
      <div
        style={{
          maxWidth: 900,
          margin: "2rem auto",
          background: SC3_BG,
          borderRadius: SC3_TABLE_BORDER_RADIUS,
          boxShadow: "0 2px 12px #00336622",
          padding: 24,
          fontFamily: "Segoe UI, Arial, sans-serif",
          color: SC3_PRIMARY,
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            marginBottom: "1.5rem",
            textAlign: "center",
            fontWeight: "bold",
            color: SC3_PRIMARY,
            borderBottom: `3px solid ${SC3_ACCENT}`,
            paddingBottom: 8,
          }}
        >
          Risk Assessment Report
        </h1>

        {/* Collapsible RAR Guidance and Preparation Section - modeled on sc3-BIA */}
        <details style={{ marginBottom: "1rem" }}>
          <summary
            style={{
              cursor: "pointer",
              fontWeight: SC3_BTN_FONT_WEIGHT,
              color: SC3_SECONDARY,
            }}
          >
            RAR Guidance and Preparation
          </summary>
          <div>
            <p>Also see:</p>
            <ul>
              <li>
                <em>
                  <a
                    href="https://www.iso.org/standard/27001"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: SC3_SECONDARY }}
                  >
                    ISO 27001
                  </a>
                </em>{" "}
                Information Security Management Systems — Requirements
              </li>
              <li>
                <em>
                  <a
                    href="https://www.iso.org/standard/80585.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: SC3_SECONDARY }}
                  >
                    ISO 27005
                  </a>
                </em>{" "}
                Information Security Risk Management
              </li>
              <li>
                <em>
                  <a
                    href="https://www.nist.gov/cyberframework"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: SC3_SECONDARY }}
                  >
                    NIST Cybersecurity Framework
                  </a>
                </em>{" "}
                Framework for Improving Critical Infrastructure Cybersecurity
              </li>
            </ul>
            <p>Also see complementary standards:</p>
            <ul>
              <li>
                <em>
                  <a
                    href="https://www.iso.org/standard/65694.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: SC3_SECONDARY }}
                  >
                    ISO 31000
                  </a>
                </em>
                &nbsp;Risk Management — Guidelines
              </li>
              <li>
                <em>
                  <a
                    href="https://www.iso.org/standard/72140.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: SC3_SECONDARY }}
                  >
                    ISO 31010
                  </a>
                </em>
                &nbsp;Risk Management — Risk Assessment Techniques
              </li>
              <li>
                <em>
                  <a
                    href="https://www.nist.gov/publications/guide-conducting-risk-assessments"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: SC3_SECONDARY }}
                  >
                    NIST SP 800-30
                  </a>
                </em>
                &nbsp;Guide for Conducting Risk Assessments
              </li>
              <li>
                <em>
                  <a
                    href="https://www.iso.org/standard/75106.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: SC3_SECONDARY }}
                  >
                    ISO 22301
                  </a>
                </em>
                &nbsp;Security and Resilience — Business Continuity Management
                Systems — Requirements
              </li>
            </ul>
            <p>Before commencing the RAR process:</p>
            <ul>
              <li>Identify the context, scope and objectives of the RAR.</li>
              <li>
                Define and communicate the roles and responsibilities of the RAR
                team.
                <dl>
                  <dt style={{ color: SC3_PRIMARY }}>RAR Leader</dt>
                  <dd>
                    Responsible for overseeing the RAR process and ensuring its
                    alignment with business objectives and obtaining approval of
                    the RAR outcomes from management.
                  </dd>
                  <dt style={{ color: SC3_PRIMARY }}>Asset Owner</dt>
                  <dd>
                    Responsible for providing detailed information about the
                    assets and their vulnerabilities. These can include tangible
                    and intangible assets, people, processes, technologies, and
                    their criticality as determined by the Business Impact Assessment
                    (BIA).
                  </dd>
                  <dt style={{ color: SC3_PRIMARY }}>
                    Subject Matter Experts (SMEs)
                  </dt>
                  <dd>
                    Provide expertise and insights into specific risk areas and
                    threat landscapes including environmental, human, social, internal and external factors, etc.
                  </dd>
                </dl>
              </li>
              <li>
                Obtain leadership commitment and have adequate resources
                allocated.
              </li>
              <li>Engage stakeholders and subject matter experts.</li>
              <li>
                Identify and document the potential risks and their impacts on
                business operations.
              </li>
              <li>Establish risk appetite and tolerance levels.</li>
              <li>
                Establish what level of authorisation is required to sign off on
                the RAR outcomes. This may need to vary depending on the
                organisation's governance structure, risk appetite, and
                tolerance levels.
              </li>
              <li>Define risk treatment strategies and controls.</li>
              <li>Establish monitoring and review processes.</li>
            </ul>
            <p>
              The RAR should be conducted systematically and objectively, with
              appropriate consideration of the business context and stakeholder
              requirements. It is recommended to use a risk assessment
              framework, such as ISO 31000 or NIST SP 800-30, to guide the RAR
              process.
            </p>
            <p>Key steps in the RAR process include:</p>
            <ul>
              <li>
                Assess current state - are the right things being done the
                right way, doing them well, and getting any benefit from them?
              </li>
              <li>
                Identify and document the assets and their criticality, threats, vulnerabilities, and impacts.
              </li>
              <li>
                Identify existing countermeasures - what controls are in place to mitigate the identified threats?
              </li>
              <li>
                Assess risks - quantitative and qualitative analysis,
                probability and impact assessments, risk level and risk prioritisation.
              </li>
              <li>
                Recommend risk treatment strategies - what actions can be taken to mitigate the identified risks? What is the cost-benefit analysis of these actions?
              </li>
              <li>
                Identify ownership - assign risk owners (individuals rather than teams or departments) for each identified risk.
              </li>
            </ul>
            <p>
              It is recommended to do a qualitative risk assessment initially,
              followed by a quantitative assessment for the most significant
              risks. Qualitative risk assessments are relatively quick to
              perform but tend to be biased in terms of probability and impact
              definitions by the perspectives of the stakeholders involved and
              so are more useful in a local context. Whereas quantitative risk
              assessments provide a more objective analysis covering a broader
              context but can be more time-consuming and resource-intensive to
              perform.
            </p>{" "}
            <p>
              It is important to regularly review and update the RAR to ensure
              that it remains relevant and effective in addressing the evolving
              risk landscape. Risk assessments are complementary to Business
              Impact Analyses (BIAs) and should be integrated into the overall
              risk management framework.
            </p>
            {/* Risk Assessment Heat Map */}
            <div style={{ marginTop: "2rem", marginBottom: "2rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h3 style={{ color: SC3_PRIMARY, margin: 0 }}>
                  Risk Assessment Matrix
                </h3>
                <button
                  onClick={resetRiskMatrix}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: SC3_SECONDARY,
                    color: "#fff",
                    border: "none",
                    borderRadius: SC3_INPUT_BORDER_RADIUS,
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow: SC3_BTN_BOX_SHADOW(SC3_SECONDARY),
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.backgroundColor = "#007bb5")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.backgroundColor = SC3_SECONDARY)
                  }
                >
                  Reset to Default
                </button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    borderCollapse: "collapse",
                    border: `2px solid ${SC3_PRIMARY}`,
                    borderRadius: SC3_BORDER_RADIUS,
                    overflow: "hidden",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          background: SC3_TABLE_HEADER_BG,
                          color: SC3_PRIMARY,
                          padding: "8px",
                          border: `1px solid ${SC3_PRIMARY}`,
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        Severity ↓ / Likelihood →
                      </th>
                      {[
                        "Very Unlikely",
                        "Unlikely",
                        "Possible",
                        "Likely",
                        "Very Likely",
                      ].map((likelihood) => (
                        <th
                          key={likelihood}
                          style={{
                            background: SC3_TABLE_HEADER_BG,
                            color: SC3_PRIMARY,
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            fontWeight: "bold",
                            textAlign: "center",
                            minWidth: "120px",
                          }}
                        >
                          {likelihood}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {["Severe", "Major", "Moderate", "Minor", "Negligible"].map(
                      (severity) => (
                        <tr key={severity}>
                          <td
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_PRIMARY,
                              padding: "8px",
                              border: `1px solid ${SC3_PRIMARY}`,
                              fontWeight: "bold",
                              textAlign: "center",
                            }}
                          >
                            {severity}
                          </td>
                          {[
                            "Very Unlikely",
                            "Unlikely",
                            "Possible",
                            "Likely",
                            "Very Likely",
                          ].map((likelihood) => {
                            const key = `${severity}-${likelihood}`;
                            const value = riskMatrix[key];
                            return (
                              <td
                                key={likelihood}
                                style={{
                                  padding: "4px",
                                  border: `1px solid ${SC3_PRIMARY}`,
                                  textAlign: "center",
                                  background: getRiskColor(value),
                                }}
                              >
                                <select
                                  value={value}
                                  onChange={(e) =>
                                    handleMatrixChange(
                                      severity,
                                      likelihood,
                                      e.target.value,
                                    )
                                  }
                                  style={{
                                    width: "100%",
                                    boxSizing: "border-box",
                                    padding: "4px",
                                    border: "none",
                                    background: "transparent",
                                    color: value === "Medium" ? "#000" : "#fff",
                                    fontWeight: "bold",
                                    textAlign: "center",
                                    cursor: "pointer",
                                  }}
                                >
                                  <option value="Low">Low</option>
                                  <option value="Medium">Medium</option>
                                  <option value="High">High</option>
                                  <option value="Extreme">Extreme</option>
                                </select>
                              </td>
                            );
                          })}
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
              <div
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "1rem",
                  justifyContent: "center",
                  fontSize: "0.9em",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      background: getRiskColor("Low"),
                      border: "1px solid #ccc",
                    }}
                  ></div>
                  <span>Low Risk</span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      background: getRiskColor("Medium"),
                      border: "1px solid #ccc",
                    }}
                  ></div>
                  <span>Medium Risk</span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      background: getRiskColor("High"),
                      border: "1px solid #ccc",
                    }}
                  ></div>
                  <span>High Risk</span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      background: getRiskColor("Extreme"),
                      border: "1px solid #ccc",
                    }}
                  ></div>
                  <span>Extreme Risk</span>
                </div>
              </div>
            </div>
            <p>
              {" "}
              Modify the Risk Assessment Matrix to reflect the organisation's
              risk appetite.
            </p>
            {/* Severity Guidance Table */}
            <div style={{ marginTop: "2rem", marginBottom: "2rem" }}>
              <h3 style={{ color: SC3_PRIMARY, marginBottom: "1rem" }}>
                Severity Guidance
              </h3>
              <div
                style={{
                  width: "100vw",
                  maxWidth: "100vw",
                  position: "relative",
                  left: "50%",
                  right: "50%",
                  marginLeft: "-50vw",
                  marginRight: "-50vw",
                  background: "transparent",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  boxSizing: "border-box",
                }}
              >
                {/* Outer wrapper for horizontal scroll so that scroll bar does not hide the last row - works for Chrome and Edge, not for Firefox */}
                <div
                  style={{
                    width: "100%",
                    overflowX: "auto",
                    padding: "0 0.05rem",
                    boxSizing: "border-box",
                  }}
                >
                  <table
                    style={{
                      width: "95vw",
                      minWidth: 1200,
                      borderCollapse: "collapse",
                      background: SC3_TABLE_BG,
                      borderRadius: SC3_TABLE_BORDER_RADIUS,
                      overflow: "hidden",
                      margin: "0 auto",
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            background: SC3_TABLE_HEADER_BG,
                            color: SC3_PRIMARY,
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            fontWeight: "bold",
                            textAlign: "center",
                            minWidth: "100px",
                          }}
                        >
                          Severity Level
                        </th>
                        <th
                          style={{
                            background: SC3_TABLE_HEADER_BG,
                            color: SC3_PRIMARY,
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            fontWeight: "bold",
                            textAlign: "center",
                            minWidth: "120px",
                          }}
                        >
                          People
                        </th>
                        <th
                          style={{
                            background: SC3_TABLE_HEADER_BG,
                            color: SC3_PRIMARY,
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            fontWeight: "bold",
                            textAlign: "center",
                            minWidth: "140px",
                          }}
                        >
                          Assets & Technology/Systems
                        </th>
                        <th
                          style={{
                            background: SC3_TABLE_HEADER_BG,
                            color: SC3_PRIMARY,
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            fontWeight: "bold",
                            textAlign: "center",
                            minWidth: "120px",
                          }}
                        >
                          Environment
                        </th>
                        <th
                          style={{
                            background: SC3_TABLE_HEADER_BG,
                            color: SC3_PRIMARY,
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            fontWeight: "bold",
                            textAlign: "center",
                            minWidth: "140px",
                          }}
                        >
                          Reputation & Customer Impact
                        </th>
                        <th
                          style={{
                            background: SC3_TABLE_HEADER_BG,
                            color: SC3_PRIMARY,
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            fontWeight: "bold",
                            textAlign: "center",
                            minWidth: "120px",
                          }}
                        >
                          Financial
                        </th>
                        <th
                          style={{
                            background: SC3_TABLE_HEADER_BG,
                            color: SC3_PRIMARY,
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            fontWeight: "bold",
                            textAlign: "center",
                            minWidth: "120px",
                          }}
                        >
                          Staff Retention
                        </th>
                        <th
                          style={{
                            background: SC3_TABLE_HEADER_BG,
                            color: SC3_PRIMARY,
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            fontWeight: "bold",
                            textAlign: "center",
                            minWidth: "140px",
                          }}
                        >
                          Information Security & Data Privacy
                        </th>
                        <th
                          style={{
                            background: SC3_TABLE_HEADER_BG,
                            color: SC3_PRIMARY,
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            fontWeight: "bold",
                            textAlign: "center",
                            minWidth: "160px",
                          }}
                        >
                          Governance, Legal, Compliance & Regulatory
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td
                          style={{
                            background: SC3_TABLE_HEADER_BG,
                            color: SC3_PRIMARY,
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          Severe
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Multiple fatalities or permanent disabilities
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Complete loss of critical infrastructure; total system
                          failure
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Catastrophic environmental damage
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Irreparable brand damage; mass customer exodus
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Threatens organizational survival
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Mass exodus of key personnel
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Massive data breach; complete loss of confidentiality
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Criminal prosecution; loss of license to operate;
                          regulatory shutdown
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{
                            background: SC3_TABLE_HEADER_BG,
                            color: SC3_PRIMARY,
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          Major
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Single fatality or serious injury requiring
                          hospitalization
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Significant damage to critical assets; major system
                          disruption
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Serious environmental impact requiring remediation
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          National publicity; significant customer loss
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Significant financial impact on operations
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Loss of critical staff or leadership
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Significant data breach; widespread privacy violations
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Regulatory action; significant fines; political
                          intervention
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{
                            background: SC3_TABLE_HEADER_BG,
                            color: SC3_PRIMARY,
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          Moderate
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Injury requiring medical treatment
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Damage to non-critical assets; system performance
                          degradation
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Limited environmental impact
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Local negative publicity; customer complaints
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Moderate financial impact
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Temporary loss of some staff
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Limited data exposure; security incident
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Regulatory notice; compliance breach; policy changes
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{
                            background: SC3_TABLE_HEADER_BG,
                            color: SC3_PRIMARY,
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          Minor
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Minor injury requiring first aid
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Minor damage, easily repaired; temporary system issues
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Minimal environmental impact
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Internal criticism; minor customer dissatisfaction
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Minor financial impact
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Minimal staff turnover
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Minor security weakness; limited access exposure
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Minor compliance issue; administrative requirements
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{
                            background: SC3_TABLE_HEADER_BG,
                            color: SC3_PRIMARY,
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          Negligible
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          No injury or very minor discomfort
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          No damage or insignificant damage; minor performance
                          impact
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          No environmental impact
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          No impact on reputation or customers
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          Negligible financial impact
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          No impact on staff retention
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          No security or privacy impact
                        </td>
                        <td
                          style={{
                            padding: "8px",
                            border: `1px solid ${SC3_PRIMARY}`,
                            textAlign: "left",
                          }}
                        >
                          No compliance implications
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p></p>
                </div>
              </div>
            </div>
            <p>
              The impact categories are industry-specific and may vary based on
              the organization's context and risk appetite. The Severity
              Guidance Table provides a starting point for assessing the
              potential impact of risks. Authorisation levels to accept
              risks of different severity levels should be defined based on the
              organization's governance structure and risk management policies.
            </p>

            {/* Additional Recommended Fields Section */}
            <details style={{ marginTop: "2rem", marginBottom: "1rem", border: "1px solid #e0e0e0", borderRadius: "4px", padding: "1rem" }}>
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: "bold",
                  color: SC3_ACCENT,
                  marginBottom: "1rem",
                }}
              >
                💡 Recommended Additional Assessment Criteria for Enhanced Risk Assessment
              </summary>
              <div style={{ marginTop: "1rem" }}>
                <p style={{ fontStyle: "italic", color: "#666", marginBottom: "1rem" }}>
                  A Risk Assessment contains a mix of values that either assist in assessing the risk or drive process and decision-making. 
                  There is a temptation to be as thorough as possible, including every detail. However, less is more and it is usually better to keep the assessment fast, simple and focused on the most critical aspects only.
                </p>
                <p style={{ fontStyle: "italic", color: "#666", marginBottom: "1rem" }}>
                  The following fields could enhance your risk assessment process. Consider adding these based on your organization's specific needs and maturity level but avoid overcomplicating the assessment:
                </p>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "1rem" }}>
                  <div>
                    <h4 style={{ color: SC3_PRIMARY, marginBottom: "0.5rem" }}>🎯 Risk Context & Environment</h4>
                    <ul style={{ fontSize: "0.9rem", lineHeight: "1.4" }}>
                      <li><strong>Business Process/System Affected:</strong> Specific processes or systems impacted</li>
                      <li><strong>Risk Location/Geography:</strong> Physical or logical location of risk</li>
                      <li><strong>Data Classification:</strong> Sensitivity level of data involved (Public, Internal, Confidential, Restricted)</li>
                      <li><strong>Application Criticality:</strong> Business importance of affected applications (Critical, High, Medium, Low)</li>
                      <li><strong>Regulatory/Compliance Framework:</strong> Applicable regulations (GDPR, SOX, HIPAA, etc.)</li>
                      <li><strong>Risk Interdependencies:</strong> Related risks or cascade effects</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 style={{ color: SC3_PRIMARY, marginBottom: "0.5rem" }}>🔬 Risk Assessment Methodology</h4>
                    <ul style={{ fontSize: "0.9rem", lineHeight: "1.4" }}>
                      <li><strong>Risk Assessment Method:</strong> Specific methodology used (FAIR, OCTAVE, etc.)</li>
                      <li><strong>Data Sources:</strong> Where risk information was gathered</li>
                      <li><strong>Assumptions Made:</strong> Key assumptions underlying assessment</li>
                      <li><strong>Confidence Level:</strong> Assessor's confidence in rating (High/Medium/Low)</li>
                    </ul>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "1rem" }}>
                  <div>
                    <h4 style={{ color: SC3_GREEN, marginBottom: "0.5rem" }}>📊 Quantitative Enhancement</h4>
                    <ul style={{ fontSize: "0.9rem", lineHeight: "1.4" }}>
                      <li><strong>Cost of Controls:</strong> Budget for implementing mitigating controls</li>
                      <li><strong>Risk Appetite Threshold:</strong> Organizational tolerance level</li>
                      <li><strong>Time to Impact:</strong> How quickly risk could materialize</li>
                      <li><strong>Detection Probability:</strong> Likelihood of detecting before impact</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 style={{ color: SC3_GREEN, marginBottom: "0.5rem" }}>👥 Stakeholder & Communication</h4>
                    <ul style={{ fontSize: "0.9rem", lineHeight: "1.4" }}>
                      <li><strong>Signatory Level:</strong> Required authorization level for risk acceptance (Team Lead, Manager, Director, Executive, Board)</li>
                      <li><strong>Risk Committee/Board Approval:</strong> Governance oversight details</li>
                      <li><strong>Stakeholder Notifications:</strong> Who needs to be informed</li>
                      <li><strong>Escalation Triggers:</strong> Conditions requiring escalation</li>
                    </ul>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                  <div>
                    <h4 style={{ color: SC3_SECONDARY, marginBottom: "0.5rem" }}>📈 Monitoring & Metrics</h4>
                    <ul style={{ fontSize: "0.9rem", lineHeight: "1.4" }}>
                      <li><strong>Key Risk Indicators (KRIs):</strong> Metrics to monitor risk levels</li>
                      <li><strong>Monitoring Frequency:</strong> How often risk is reviewed</li>
                      <li><strong>Last Incident Date:</strong> When this risk type last materialized</li>
                      <li><strong>Trend Analysis:</strong> Risk direction (increasing/stable/decreasing)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 style={{ color: SC3_SECONDARY, marginBottom: "0.5rem" }}>🛠️ Risk Treatment Details</h4>
                    <ul style={{ fontSize: "0.9rem", lineHeight: "1.4" }}>
                      <li><strong>Cost-Benefit Analysis:</strong> Justification for chosen treatment</li>
                      <li><strong>Alternative Options:</strong> Other strategies considered</li>
                      <li><strong>Resource Requirements:</strong> Personnel, technology, budget needed</li>
                      <li><strong>Implementation Timeline:</strong> Detailed schedule for treatment</li>
                    </ul>
                  </div>
                </div>

                <div style={{ 
                  marginTop: "1.5rem", 
                  padding: "1rem", 
                  backgroundColor: "#f0f8ff", 
                  borderLeft: "4px solid " + SC3_SECONDARY,
                  borderRadius: "4px"
                }}>
                  <h4 style={{ color: SC3_PRIMARY, marginBottom: "0.5rem" }}>⭐ Priority Recommendations</h4>
                  <p style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                    If you were to add any additional fields to the risk assessment, consider implementing these high-value fields first:
                  </p>
                  <ol style={{ fontSize: "0.9rem", lineHeight: "1.4", marginLeft: "1rem" }}>
                    <li><strong>Business Process/System Affected</strong> - Critical for impact assessment</li>
                    <li><strong>Confidence Level</strong> - Important for risk management decisions</li>
                    <li><strong>Key Risk Indicators (KRIs)</strong> - Essential for ongoing monitoring</li>
                    <li><strong>Cost of Controls</strong> - Needed for business case justification</li>
                    <li><strong>Regulatory/Compliance Framework</strong> - Important for compliance requirements</li>
                  </ol>
                </div>
              </div>
            </details>

            <p>
              <b>Disclaimer:</b> The information provided here is for general
              informational purposes only and will require adaptation for
              specific businesses and maturity capabilities and is not intended
              as legal advice. Please consult with a qualified legal
              professional for specific legal advice tailored to your situation.
            </p>

          </div>
        </details>

        {/* RAR Fields Section - modeled on sc3-BIA Form Fields */}
        <details open={rarFieldsOpen} style={{ marginBottom: "1rem" }}>
          <summary
            style={{
              cursor: "pointer",
              fontWeight: SC3_BTN_FONT_WEIGHT,
              color: SC3_SECONDARY,
            }}
            onClick={(e) => {
              e.preventDefault();
              setRarFieldsOpen(!rarFieldsOpen);
            }}
          >
            RAR Fields{" "}
            {isEditingRisk && `(Editing: ${form.riskTitle || "Untitled Risk"})`}
          </summary>
          <div>
            <p>
              Complete the following fields to document the risk assessment
              details.
            </p>

            {/* Risk Details Section */}
            <fieldset
              style={{
                border: `2px solid ${SC3_PRIMARY}`,
                borderRadius: SC3_BORDER_RADIUS,
                padding: SC3_FORM_PADDING,
                marginBottom: SC3_SECTION_MARGIN,
                background: "#f5faff",
              }}
            >
              <legend
                style={{
                  fontWeight: SC3_BTN_FONT_WEIGHT,
                  color: SC3_PRIMARY,
                }}
              >
                Risk Details
              </legend>
              
              <div style={{ 
                marginBottom: "1rem", 
                fontSize: "0.875rem", 
                color: "#666",
                fontStyle: "italic" 
              }}>
                Fields marked with <span style={{ color: "#d32f2f" }}>*</span> are mandatory
              </div>

              <table style={{ width: "100%", tableLayout: "fixed" }}>
                <tbody>
                  <tr title="A unique identifier for the risk (e.g. R001, R002)">
                    <td
                      style={{
                        width: "30%",
                        verticalAlign: "top",
                        paddingRight: "1rem",
                        paddingBottom: "0.5rem",
                      }}
                    >
                      <label style={{ color: SC3_PRIMARY }}>
                        Risk ID: <span style={{ color: "#d32f2f" }}>*</span>
                      </label>
                      {showValidation && validationErrors.riskId && (
                        <div style={{ 
                          color: "#d32f2f", 
                          fontSize: "0.875rem", 
                          marginTop: "0.25rem" 
                        }}>
                          {validationErrors.riskId}
                        </div>
                      )}
                    </td>
                    <td style={{ paddingBottom: "0.5rem" }}>
                      <input
                        type="text"
                        name="riskId"
                        placeholder="e.g., R001, R002"
                        value={form.riskId}
                        onChange={handleChange}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: SC3_INPUT_PADDING,
                          borderRadius: SC3_INPUT_BORDER_RADIUS,
                          border: `1px solid ${
                            showValidation && validationErrors.riskId 
                              ? "#d32f2f" 
                              : SC3_SECONDARY
                          }`,
                          fontSize: "1rem",
                          backgroundColor: showValidation && validationErrors.riskId 
                            ? "#ffebee" 
                            : "transparent",
                        }}
                      />
                    </td>
                  </tr>

                  <tr title="A concise name or description of the risk">
                    <td
                      style={{
                        width: "30%",
                        verticalAlign: "top",
                        paddingRight: "1rem",
                        paddingBottom: "0.5rem",
                      }}
                    >
                      <label style={{ color: SC3_PRIMARY }}>
                        Risk Title: <span style={{ color: "#d32f2f" }}>*</span>
                      </label>
                      {showValidation && validationErrors.riskTitle && (
                        <div style={{ 
                          color: "#d32f2f", 
                          fontSize: "0.875rem", 
                          marginTop: "0.25rem" 
                        }}>
                          {validationErrors.riskTitle}
                        </div>
                      )}
                    </td>
                    <td style={{ paddingBottom: "0.5rem" }}>
                      <input
                        type="text"
                        name="riskTitle"
                        placeholder="Concise name or description of the risk"
                        value={form.riskTitle}
                        onChange={handleChange}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: SC3_INPUT_PADDING,
                          borderRadius: SC3_INPUT_BORDER_RADIUS,
                          border: `1px solid ${
                            showValidation && validationErrors.riskTitle 
                              ? "#d32f2f" 
                              : SC3_SECONDARY
                          }`,
                          fontSize: "1rem",
                          backgroundColor: showValidation && validationErrors.riskTitle 
                            ? "#ffebee" 
                            : "transparent",
                        }}
                      />
                    </td>
                  </tr>

                  <tr title="Risk assessment framework used for assessing this risk"> 
                    <td
                      style={{
                        width: "30%",
                        verticalAlign: "top",
                        paddingRight: "1rem",
                        paddingBottom: "0.5rem",
                      }}
                    >
                      <label style={{ color: SC3_PRIMARY }}>
                        Risk Assessment Framework:
                      </label>
                    </td>
                    <td style={{ paddingBottom: "0.5rem" }}>
                      <select
                        name="framework"
                        value={form.framework}
                        onChange={handleChange}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: SC3_INPUT_PADDING,
                          borderRadius: SC3_INPUT_BORDER_RADIUS,
                          border: `1px solid ${SC3_SECONDARY}`,
                          fontSize: "1rem",
                        }}
                      >
                        <option value="">Select Framework</option>
                        <option value="iso-31000">
                          ISO 31000 - Risk Management Guidelines
                        </option>
                        <option value="iso-31010">
                          ISO 31010 - Risk Assessment Techniques
                        </option>
                        <option value="iso-27005">
                          ISO 27005 - Information Security Risk Management
                        </option>
                        <option value="nist-sp-800-30">
                          NIST SP 800-30 - Guide for Conducting Risk Assessments
                        </option>
                        <option value="nist-csf">
                          NIST Cybersecurity Framework
                        </option>
                        <option value="coso-erm">
                          COSO Enterprise Risk Management Framework
                        </option>
                        <option value="octave">
                          OCTAVE (Operationally Critical Threat, Asset, and
                          Vulnerability Evaluation)
                        </option>
                        <option value="fair">
                          FAIR (Factor Analysis of Information Risk)
                        </option>
                        <option value="bs-31100">
                          BS 31100 - Risk Management Code of Practice
                        </option>
                        <option value="as-nzs-4360">
                          AS/NZS 4360 - Risk Management
                        </option>
                        <option value="custom">
                          Custom/Organizational Framework
                        </option>
                        <option value="other">Other</option>
                      </select>
                    </td>
                  </tr>

                  <tr title="Category of risk being assessed (e.g. People, Process, Technology, etc.). There could be multiple categories that this risk falls under. Select the most impactful category and list the other categories in the description field.">
                    <td
                      style={{
                        width: "30%",
                        verticalAlign: "top",
                        paddingRight: "1rem",
                        paddingBottom: "0.5rem",
                      }}
                    >
                      <label style={{ color: SC3_PRIMARY }}>
                        Risk Category:
                      </label>
                    </td>
                    <td style={{ paddingBottom: "0.5rem" }}>
                      <select
                        name="riskCategory"
                        value={form.riskCategory}
                        onChange={handleChange}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: SC3_INPUT_PADDING,
                          borderRadius: SC3_INPUT_BORDER_RADIUS,
                          border: `1px solid ${SC3_SECONDARY}`,
                          fontSize: "1rem",
                        }}
                      >
                        <option value="">Select Risk Category</option>
                        <option value="people">People</option>
                        <option value="process">Process</option>
                        <option value="assets-technology">
                          Assets & Technology/Systems
                        </option>
                        <option value="environment">Environment</option>
                        <option value="reputation-customer">
                          Reputation & Customer Impact
                        </option>
                        <option value="financial">Financial</option>
                        <option value="staff-retention">Staff Retention</option>
                        <option value="information-security">
                          Information Security & Data Privacy
                        </option>
                        <option value="governance-legal-compliance">
                          Governance, Legal, Compliance & Regulatory
                        </option>
                      </select>
                    </td>
                  </tr>

                  <tr title="Detailed explanation of the risk scenario and how it could cause loss of confidentiality, integrity, or availability of information or assets">
                    <td
                      style={{
                        width: "30%",
                        verticalAlign: "top",
                        paddingRight: "1rem",
                        paddingBottom: "0.5rem",
                      }}
                    >
                      <label style={{ color: SC3_PRIMARY }}>
                        Risk Description:
                      </label>
                    </td>
                    <td style={{ paddingBottom: "0.5rem" }}>
                      <textarea
                        name="riskDescription"
                        value={form.riskDescription}
                        onChange={handleChange}
                        placeholder="Detailed explanation of the risk scenario"
                        rows="4"
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: SC3_INPUT_PADDING,
                          borderRadius: SC3_INPUT_BORDER_RADIUS,
                          border: `1px solid ${SC3_SECONDARY}`,
                          fontSize: "1rem",
                          resize: "vertical",
                        }}
                      />
                    </td>
                  </tr>

                  <tr title="Name of the person conducting the risk assessment">
                    <td
                      style={{
                        width: "30%",
                        verticalAlign: "top",
                        paddingRight: "1rem",
                        paddingBottom: "0.5rem",
                      }}
                    >
                      <label style={{ color: SC3_PRIMARY }}>Assessor:</label>
                    </td>
                    <td style={{ paddingBottom: "0.5rem" }}>
                      <input
                        type="text"
                        name="assessor"
                        value={form.assessor}
                        onChange={handleChange}
                        placeholder="Name of the person conducting the risk assessment"
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: SC3_INPUT_PADDING,
                          borderRadius: SC3_INPUT_BORDER_RADIUS,
                          border: `1px solid ${SC3_SECONDARY}`,
                          fontSize: "1rem",
                        }}
                      />
                    </td>
                  </tr>

                  <tr title="Date when the risk was first assessed">
                    <td
                      style={{
                        width: "30%",
                        verticalAlign: "top",
                        paddingRight: "1rem",
                        paddingBottom: "0.5rem",
                      }}
                    >
                      <label style={{ color: SC3_PRIMARY }}>
                        Assessed Date:
                      </label>
                    </td>
                    <td style={{ paddingBottom: "0.5rem" }}>
                      <input
                        type="date"
                        name="assessedDate"
                        value={form.assessedDate}
                        onChange={handleChange}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: SC3_INPUT_PADDING,
                          borderRadius: SC3_INPUT_BORDER_RADIUS,
                          border: `1px solid ${SC3_SECONDARY}`,
                          fontSize: "1rem",
                        }}
                      />
                    </td>
                  </tr>

                  <tr title="Individual or role responsible for managing the risk">
                    <td
                      style={{
                        width: "30%",
                        verticalAlign: "top",
                        paddingRight: "1rem",
                        paddingBottom: "0.5rem",
                      }}
                    >
                      <label style={{ color: SC3_PRIMARY }}>Risk Owner:</label>
                    </td>
                    <td style={{ paddingBottom: "0.5rem" }}>
                      <input
                        type="text"
                        name="riskOwner"
                        value={form.riskOwner}
                        onChange={handleChange}
                        placeholder="Individual or role responsible for managing the risk"
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: SC3_INPUT_PADDING,
                          borderRadius: SC3_INPUT_BORDER_RADIUS,
                          border: `1px solid ${SC3_SECONDARY}`,
                          fontSize: "1rem",
                        }}
                      />
                    </td>
                  </tr>

                  <tr title="Source of the threat that could exploit the vulnerability">
                    <td
                      style={{
                        width: "30%",
                        verticalAlign: "top",
                        paddingRight: "1rem",
                        paddingBottom: "0.5rem",
                      }}
                    >
                      <label style={{ color: SC3_PRIMARY }}>
                        Threat Source:
                      </label>
                    </td>
                    <td style={{ paddingBottom: "0.5rem" }}>
                      <select
                        name="threatSource"
                        value={form.threatSource}
                        onChange={handleChange}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: SC3_INPUT_PADDING,
                          borderRadius: SC3_INPUT_BORDER_RADIUS,
                          border: `1px solid ${SC3_SECONDARY}`,
                          fontSize: "1rem",
                        }}
                      >
                        <option value="">Select Threat Source</option>
                        <option value="internal">Internal</option>
                        <option value="external">External</option>
                        <option value="natural">Natural</option>
                        <option value="people">People</option>
                        <option value="process">Process</option>
                        <option value="technological">Technological</option>
                        <option value="supplier">Supplier/Third Party</option>
                      </select>
                    </td>
                  </tr>

                  <tr title="Description of the vulnerability that could be exploited by the threat">
                    <td
                      style={{
                        width: "30%",
                        verticalAlign: "top",
                        paddingRight: "1rem",
                        paddingBottom: "0.5rem",
                      }}
                    >
                      <label style={{ color: SC3_PRIMARY }}>
                        Vulnerability:
                      </label>
                    </td>
                    <td style={{ paddingBottom: "0.5rem" }}>
                      <textarea
                        name="vulnerability"
                        value={form.vulnerability}
                        onChange={handleChange}
                        placeholder="Weakness or gap that enables the risk"
                        rows="3"
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: SC3_INPUT_PADDING,
                          borderRadius: SC3_INPUT_BORDER_RADIUS,
                          border: `1px solid ${SC3_SECONDARY}`,
                          fontSize: "1rem",
                          resize: "vertical",
                        }}
                      />
                    </td>
                  </tr>

                  <tr title="Existing controls in place to manage the risk">
                    <td
                      style={{
                        width: "30%",
                        verticalAlign: "top",
                        paddingRight: "1rem",
                        paddingBottom: "0.5rem",
                      }}
                    >
                      <label style={{ color: SC3_PRIMARY }}>
                        Current Controls:
                      </label>
                    </td>
                    <td style={{ paddingBottom: "0.5rem" }}>
                      <textarea
                        name="currentControls"
                        value={form.currentControls}
                        onChange={handleChange}
                        placeholder="Existing measures in place to manage the risk"
                        rows="3"
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: SC3_INPUT_PADDING,
                          borderRadius: SC3_INPUT_BORDER_RADIUS,
                          border: `1px solid ${SC3_SECONDARY}`,
                          fontSize: "1rem",
                          resize: "vertical",
                        }}
                      />
                    </td>
                  </tr>

                  <tr title="Assessment of the effectiveness of the current controls">
                    <td
                      style={{
                        width: "30%",
                        verticalAlign: "top",
                        paddingRight: "1rem",
                        paddingBottom: "0.5rem",
                      }}
                    >
                      <label style={{ color: SC3_PRIMARY }}>
                        Control Effectiveness:
                      </label>
                    </td>
                    <td style={{ paddingBottom: "0.5rem" }}>
                      <select
                        name="controlEffectiveness"
                        value={form.controlEffectiveness}
                        onChange={handleChange}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: SC3_INPUT_PADDING,
                          borderRadius: SC3_INPUT_BORDER_RADIUS,
                          border: `1px solid ${SC3_SECONDARY}`,
                          fontSize: "1rem",
                        }}
                      >
                        <option value="">Select Control Effectiveness</option>
                        <option value="very-effective">Very Effective</option>
                        <option value="effective">Effective</option>
                        <option value="moderately-effective">
                          Moderately Effective
                        </option>
                        <option value="limited-effectiveness">
                          Limited Effectiveness
                        </option>
                        <option value="ineffective">Ineffective</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </fieldset>

            {/* Risk Assessment Section */}
            <fieldset
              style={{
                border: `2px solid ${SC3_GREEN}`,
                borderRadius: SC3_BORDER_RADIUS,
                padding: SC3_FORM_PADDING,
                marginBottom: SC3_SECTION_MARGIN,
                background: "#f8fff5",
              }}
            >
              <legend
                style={{
                  fontWeight: SC3_BTN_FONT_WEIGHT,
                  color: SC3_GREEN,
                }}
              >
                Risk Assessment
              </legend>

              <table style={{ width: "100%", tableLayout: "fixed" }}>
                <tbody>
                  <tr title="Type of risk assessment being conducted (Qualitative or Quantitative)">
                    <td
                      style={{
                        width: "30%",
                        verticalAlign: "top",
                        paddingRight: "1rem",
                        paddingBottom: "0.5rem",
                      }}
                    >
                      <label style={{ color: SC3_PRIMARY }}>
                        Assessment Type:
                      </label>
                    </td>
                    <td style={{ paddingBottom: "0.5rem" }}>
                      <div style={{ display: "flex", gap: "1rem" }}>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="radio"
                            name="assessmentType"
                            value="qualitative"
                            checked={form.assessmentType === "qualitative"}
                            onChange={handleChange}
                            style={{ marginRight: "0.25rem" }}
                          />
                          <span>Qualitative</span>
                        </label>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="radio"
                            name="assessmentType"
                            value="quantitative"
                            checked={form.assessmentType === "quantitative"}
                            onChange={handleChange}
                            style={{ marginRight: "0.25rem" }}
                          />
                          <span>Quantitative</span>
                        </label>
                      </div>
                    </td>
                  </tr>

                  {form.assessmentType === "qualitative" && (
                    <>
                      <tr title="Likelihood rating of the risk occurring (1-5 scale)">
                        <td
                          style={{
                            width: "30%",
                            verticalAlign: "top",
                            paddingRight: "1rem",
                            paddingBottom: "0.5rem",
                          }}
                        >
                          <label style={{ color: SC3_PRIMARY }}>
                            Likelihood Rating:
                          </label>
                        </td>
                        <td style={{ paddingBottom: "0.5rem" }}>
                          <select
                            name="likelihood"
                            value={form.likelihood}
                            onChange={handleChange}
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              padding: SC3_INPUT_PADDING,
                              borderRadius: SC3_INPUT_BORDER_RADIUS,
                              border: `1px solid ${SC3_SECONDARY}`,
                              fontSize: "1rem",
                            }}
                          >
                            <option value="">Select Likelihood</option>
                            <option value="1">Very Unlikely (1)</option>
                            <option value="2">Unlikely (2)</option>
                            <option value="3">Possible (3)</option>
                            <option value="4">Likely (4)</option>
                            <option value="5">Very Likely (5)</option>
                          </select>
                        </td>
                      </tr>

                      <tr title="Impact rating of the risk if it occurs (1-5 scale)">
                        <td
                          style={{
                            width: "30%",
                            verticalAlign: "top",
                            paddingRight: "1rem",
                            paddingBottom: "0.5rem",
                          }}
                        >
                          <label style={{ color: SC3_PRIMARY }}>
                            Impact Rating:
                          </label>
                        </td>
                        <td style={{ paddingBottom: "0.5rem" }}>
                          <select
                            name="impact"
                            value={form.impact}
                            onChange={handleChange}
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              padding: SC3_INPUT_PADDING,
                              borderRadius: SC3_INPUT_BORDER_RADIUS,
                              border: `1px solid ${SC3_SECONDARY}`,
                              fontSize: "1rem",
                            }}
                          >
                            <option value="">Select Impact</option>
                            <option value="1">Negligible (1)</option>
                            <option value="2">Minor (2)</option>
                            <option value="3">Moderate (3)</option>
                            <option value="4">Major (4)</option>
                            <option value="5">Severe (5)</option>
                          </select>
                        </td>
                      </tr>

                      <tr title="Overall risk score calculated from likelihood and impact ratings">
                        <td
                          style={{
                            width: "30%",
                            verticalAlign: "top",
                            paddingRight: "1rem",
                            paddingBottom: "0.5rem",
                          }}
                        >
                          <label style={{ color: SC3_PRIMARY }}>
                            Overall Risk Score:
                          </label>
                        </td>
                        <td style={{ paddingBottom: "0.5rem" }}>
                          <input
                            type="text"
                            name="overallRiskScore"
                            value={
                              overallRiskScore > 0
                                ? overallRiskScore.toString()
                                : ""
                            }
                            readOnly
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              padding: SC3_INPUT_PADDING,
                              borderRadius: SC3_INPUT_BORDER_RADIUS,
                              border: `1px solid ${SC3_SECONDARY}`,
                              fontSize: "1rem",
                              backgroundColor: "#f5f5f5",
                              color: "#666",
                            }}
                          />
                          <small
                            style={{ color: "#666", fontSize: "0.875rem" }}
                          >
                            Calculated as: Likelihood ({form.likelihood || 0}) +
                            Impact ({form.impact || 0}) = {overallRiskScore}
                          </small>
                        </td>
                      </tr>
                    </>
                  )}

                  {form.assessmentType === "quantitative" && (
                    <>
                      <tr title="Single Loss Expectancy (SLE) - expected loss from a single incident">
                        <td
                          style={{
                            width: "30%",
                            verticalAlign: "top",
                            paddingRight: "1rem",
                            paddingBottom: "0.5rem",
                          }}
                        >
                          <label style={{ color: SC3_PRIMARY }}>
                            Single Loss Expectancy (SLE):
                          </label>
                        </td>
                        <td style={{ paddingBottom: "0.5rem" }}>
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <select
                              name="sleCurrency"
                              value={form.sleCurrency}
                              onChange={handleChange}
                              style={{
                                width: "120px",
                                padding: SC3_INPUT_PADDING,
                                borderRadius: SC3_INPUT_BORDER_RADIUS,
                                border: `1px solid ${SC3_SECONDARY}`,
                                fontSize: "1rem",
                                backgroundColor: "white",
                              }}
                            >
                              <option value="dollar">$ (dollar)</option>
                              <option value="euro">€ (euro)</option>
                              <option value="pound">£ (pound)</option>
                              <option value="yen">¥ (yen)</option>
                              <option value="rupee">₹ (rupee)</option>
                              <option value="peso">₱ (peso)</option>
                              <option value="won">₩ (won)</option>
                              <option value="lira">₺ (lira)</option>
                              <option value="franc">₣ (franc)</option>
                              <option value="shekel">₪ (shekel)</option>
                              <option value="other">¤ (other)</option>
                            </select>
                            <input
                              type="number"
                              placeholder="Expected loss from a single incident (e.g., 10000)"
                              name="sle"
                              value={form.sle}
                              onChange={handleChange}
                              style={{
                                flex: 1,
                                boxSizing: "border-box",
                                padding: SC3_INPUT_PADDING,
                                borderRadius: SC3_INPUT_BORDER_RADIUS,
                                border: `1px solid ${SC3_SECONDARY}`,
                                fontSize: "1rem",
                              }}
                            />
                          </div>
                        </td>
                      </tr>

                      <tr title="Annual Rate of Occurrence (ARO) - expected frequency of incidents per year">
                        <td
                          style={{
                            width: "30%",
                            verticalAlign: "top",
                            paddingRight: "1rem",
                            paddingBottom: "0.5rem",
                          }}
                        >
                          <label style={{ color: SC3_PRIMARY }}>
                            Annual Rate of Occurrence (ARO):
                          </label>
                        </td>
                        <td style={{ paddingBottom: "0.5rem" }}>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Expected frequency per year (e.g., 0.5, 2.0)"
                            name="aro"
                            value={form.aro}
                            onChange={handleChange}
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              padding: SC3_INPUT_PADDING,
                              borderRadius: SC3_INPUT_BORDER_RADIUS,
                              border: `1px solid ${SC3_SECONDARY}`,
                              fontSize: "1rem",
                            }}
                          />
                        </td>
                      </tr>

                      <tr title="Annual Loss Expectancy (ALE) - expected loss per year">
                        <td
                          style={{
                            width: "30%",
                            verticalAlign: "top",
                            paddingRight: "1rem",
                            paddingBottom: "0.5rem",
                          }}
                        >
                          <label style={{ color: SC3_PRIMARY }}>
                            Annual Loss Expectancy (ALE):
                          </label>
                        </td>
                        <td style={{ paddingBottom: "0.5rem" }}>
                          <input
                            type="text"
                            name="ale"
                            value={formatCurrency(calculateALE(form), form.sleCurrency)}
                            readOnly
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              padding: SC3_INPUT_PADDING,
                              borderRadius: SC3_INPUT_BORDER_RADIUS,
                              border: `1px solid ${SC3_SECONDARY}`,
                              fontSize: "1rem",
                              backgroundColor: "#f5f5f5",
                              color: "#666",
                            }}
                          />
                          <small
                            style={{ color: "#666", fontSize: "0.875rem" }}
                          >
                            Calculated as: SLE × ARO ={" "}
                            {formatCurrency(calculateALE(form), form.sleCurrency)}
                          </small>
                        </td>
                      </tr>
                    </>
                  )}

                  <tr title="Risk level based on the assessment type">
                    <td
                      style={{
                        width: "30%",
                        verticalAlign: "top",
                        paddingRight: "1rem",
                        paddingBottom: "0.5rem",
                      }}
                    >
                      <label style={{ color: SC3_PRIMARY }}>Risk Level:</label>
                    </td>
                    <td style={{ paddingBottom: "0.5rem" }}>
                      {form.assessmentType === "qualitative" ? (
                        <>
                          <input
                            type="text"
                            value={riskLevel}
                            readOnly
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              padding: SC3_INPUT_PADDING,
                              borderRadius: SC3_INPUT_BORDER_RADIUS,
                              border: `2px solid ${getRiskColor(riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1))}`,
                              fontSize: "1rem",
                              backgroundColor: getRiskColor(
                                riskLevel.charAt(0).toUpperCase() +
                                  riskLevel.slice(1),
                              ),
                              color: "#fff",
                              fontWeight: "bold",
                              textTransform: "capitalize",
                              textAlign: "center",
                            }}
                          />
                          <small
                            style={{ color: "#666", fontSize: "0.875rem" }}
                          >
                            Automatically determined based on Risk Assessment
                            Matrix
                          </small>
                        </>
                      ) : (
                        <>
                          <select
                            name="manualRiskLevel"
                            value={form.manualRiskLevel}
                            onChange={handleChange}
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              padding: SC3_INPUT_PADDING,
                              borderRadius: SC3_INPUT_BORDER_RADIUS,
                              border: `2px solid ${getRiskColor(form.manualRiskLevel.charAt(0).toUpperCase() + form.manualRiskLevel.slice(1))}`,
                              fontSize: "1rem",
                              backgroundColor: getRiskColor(
                                form.manualRiskLevel.charAt(0).toUpperCase() +
                                  form.manualRiskLevel.slice(1),
                              ),
                              color: form.manualRiskLevel ? "#fff" : "#333",
                              fontWeight: "bold",
                              textAlign: "center",
                            }}
                          >
                            <option value="">Select Risk Level</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="extreme">Extreme</option>
                          </select>
                          <small
                            style={{ color: "#666", fontSize: "0.875rem" }}
                          >
                            Manually select based on quantitative analysis
                          </small>
                        </>
                      )}
                    </td>
                  </tr>

                  <tr title="Strategy for treating the identified risk">
                    <td
                      style={{
                        width: "30%",
                        verticalAlign: "top",
                        paddingRight: "1rem",
                        paddingBottom: "0.5rem",
                      }}
                    >
                      <label style={{ color: SC3_PRIMARY }}>Treatment Strategy:</label>
                    </td>
                    <td style={{ paddingBottom: "0.5rem" }}>
                      <select
                        name="treatmentStrategy"
                        value={form.treatmentStrategy}
                        onChange={handleChange}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: SC3_INPUT_PADDING,
                          borderRadius: SC3_INPUT_BORDER_RADIUS,
                          border: `1px solid ${SC3_SECONDARY}`,
                          fontSize: "1rem",
                        }}
                      >
                        <option value="">Select Treatment Strategy</option>
                        <option value="avoid">Avoid</option>
                        <option value="mitigate">Mitigate</option>
                        <option value="transfer">Transfer</option>
                        <option value="accept">Accept</option>
                      </select>
                    </td>
                  </tr>

                  <tr title="Recommended actions to mitigate the risk">
                    <td
                      style={{
                        width: "30%",
                        verticalAlign: "top",
                        paddingRight: "1rem",
                        paddingBottom: "0.5rem",
                      }}
                    >
                      <label style={{ color: SC3_PRIMARY }}>Recommended Actions:</label>
                    </td>
                    <td style={{ paddingBottom: "0.5rem" }}>
                      <textarea
                        name="recommendedActions"
                        value={form.recommendedActions}
                        onChange={handleChange}
                        rows="3"
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: SC3_INPUT_PADDING,
                          borderRadius: SC3_INPUT_BORDER_RADIUS,
                          border: `1px solid ${SC3_SECONDARY}`,
                          fontSize: "1rem",
                          fontFamily: "inherit",
                          resize: "vertical",
                        }}
                        placeholder="Describe specific actions to mitigate this risk..."
                      />
                    </td>
                  </tr>

                  <tr title="Person responsible for implementing the recommended actions">
                    <td
                      style={{
                        width: "30%",
                        verticalAlign: "top",
                        paddingRight: "1rem",
                        paddingBottom: "0.5rem",
                      }}
                    >
                      <label style={{ color: SC3_PRIMARY }}>Action Owner:</label>
                    </td>
                    <td style={{ paddingBottom: "0.5rem" }}>
                      <input
                        type="text"
                        name="actionOwner"
                        value={form.actionOwner}
                        onChange={handleChange}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: SC3_INPUT_PADDING,
                          borderRadius: SC3_INPUT_BORDER_RADIUS,
                          border: `1px solid ${SC3_SECONDARY}`,
                          fontSize: "1rem",
                        }}
                        placeholder="Person responsible for implementing the actions?"
                      />
                    </td>
                  </tr>

                  <tr title="Target date for implementing the recommended actions">
                    <td
                      style={{
                        width: "30%",
                        verticalAlign: "top",
                        paddingRight: "1rem",
                        paddingBottom: "0.5rem",
                      }}
                    >
                      <label style={{ color: SC3_PRIMARY }}>Target Date:</label>
                    </td>
                    <td style={{ paddingBottom: "0.5rem" }}>
                      <input
                        type="date"
                        name="targetDate"
                        value={form.targetDate}
                        onChange={handleChange}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: SC3_INPUT_PADDING,
                          borderRadius: SC3_INPUT_BORDER_RADIUS,
                          border: `1px solid ${SC3_SECONDARY}`,
                          fontSize: "1rem",
                        }}
                      />
                    </td>
                  </tr>

                  {form.assessmentType === "qualitative" && (
                    <>
                      <tr title="Likelihood of the risk occurring after implementing controls">
                        <td
                          style={{
                            width: "30%",
                            verticalAlign: "top",
                            paddingRight: "1rem",
                            paddingBottom: "0.5rem",
                          }}
                        >
                          <label style={{ color: SC3_PRIMARY }}>
                            Residual Risk Likelihood:
                          </label>
                        </td>
                        <td style={{ paddingBottom: "0.5rem" }}>
                          <select
                            name="residualLikelihood"
                            value={form.residualLikelihood}
                            onChange={handleChange}
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              padding: SC3_INPUT_PADDING,
                              borderRadius: SC3_INPUT_BORDER_RADIUS,
                              border: `1px solid ${SC3_SECONDARY}`,
                              fontSize: "1rem",
                            }}
                          >
                            <option value="">Select Residual Likelihood</option>
                            <option value="1">Very Unlikely (1)</option>
                            <option value="2">Unlikely (2)</option>
                            <option value="3">Possible (3)</option>
                            <option value="4">Likely (4)</option>
                            <option value="5">Very Likely (5)</option>
                          </select>
                        </td>
                      </tr>

                      <tr title="Risk impact after implementing controls">
                        <td
                          style={{
                            width: "30%",
                            verticalAlign: "top",
                            paddingRight: "1rem",
                            paddingBottom: "0.5rem",
                          }}
                        >
                          <label style={{ color: SC3_PRIMARY }}>
                            Residual Risk Impact:
                          </label>
                        </td>
                        <td style={{ paddingBottom: "0.5rem" }}>
                          <select
                            name="residualImpact"
                            value={form.residualImpact}
                            onChange={handleChange}
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              padding: SC3_INPUT_PADDING,
                              borderRadius: SC3_INPUT_BORDER_RADIUS,
                              border: `1px solid ${SC3_SECONDARY}`,
                              fontSize: "1rem",
                            }}
                          >
                            <option value="">Select Residual Impact</option>
                            <option value="1">Negligible (1)</option>
                            <option value="2">Minor (2)</option>
                            <option value="3">Moderate (3)</option>
                            <option value="4">Major (4)</option>
                            <option value="5">Severe (5)</option>
                          </select>
                        </td>
                      </tr>
                    </>
                  )}

                  <tr title="Residual risk level after implementing controls">
                    <td
                      style={{
                        width: "30%",
                        verticalAlign: "top",
                        paddingRight: "1rem",
                        paddingBottom: "0.5rem",
                      }}
                    >
                      <label style={{ color: SC3_PRIMARY }}>
                        Residual Risk:
                      </label>
                    </td>
                    <td style={{ paddingBottom: "0.5rem" }}>
                      {form.assessmentType === "qualitative" ? (
                        <>
                          <input
                            type="text"
                            value={calculatedResidualRiskLevel}
                            readOnly
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              padding: SC3_INPUT_PADDING,
                              borderRadius: SC3_INPUT_BORDER_RADIUS,
                              border: `2px solid ${getRiskColor(calculatedResidualRiskLevel.charAt(0).toUpperCase() + calculatedResidualRiskLevel.slice(1))}`,
                              fontSize: "1rem",
                              backgroundColor: getRiskColor(
                                calculatedResidualRiskLevel
                                  .charAt(0)
                                  .toUpperCase() +
                                  calculatedResidualRiskLevel.slice(1),
                              ),
                              color: "#fff",
                              fontWeight: "bold",
                              textTransform: "capitalize",
                              textAlign: "center",
                            }}
                          />
                          <small
                            style={{ color: "#666", fontSize: "0.875rem" }}
                          >
                            Automatically calculated from Residual Likelihood
                            and Impact
                          </small>
                        </>
                      ) : (
                        <>
                          <select
                            name="residualRisk"
                            value={form.residualRisk}
                            onChange={handleChange}
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              padding: SC3_INPUT_PADDING,
                              borderRadius: SC3_INPUT_BORDER_RADIUS,
                              border: `2px solid ${getRiskColor(form.residualRisk.charAt(0).toUpperCase() + form.residualRisk.slice(1))}`,
                              fontSize: "1rem",
                              backgroundColor: getRiskColor(
                                form.residualRisk.charAt(0).toUpperCase() +
                                  form.residualRisk.slice(1),
                              ),
                              color: form.residualRisk ? "#fff" : "#333",
                              fontWeight: "bold",
                              textAlign: "center",
                            }}
                          >
                            <option value="">Select Residual Risk Level</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="extreme">Extreme</option>
                          </select>
                          <small
                            style={{ color: "#666", fontSize: "0.875rem" }}
                          >
                            Manually select based on quantitative analysis
                          </small>
                        </>
                      )}
                    </td>
                  </tr>

                  <tr title="Date for reviewing the risk assessment">
                    <td
                      style={{
                        width: "30%",
                        verticalAlign: "top",
                        paddingRight: "1rem",
                        paddingBottom: "0.5rem",
                      }}
                    >
                      <label style={{ color: SC3_PRIMARY }}>Review Date:</label>
                    </td>
                    <td style={{ paddingBottom: "0.5rem" }}>
                      <input
                        type="date"
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: SC3_INPUT_PADDING,
                          borderRadius: SC3_INPUT_BORDER_RADIUS,
                          border: `1px solid ${SC3_SECONDARY}`,
                          fontSize: "1rem",
                        }}
                      />
                    </td>
                  </tr>

                  <tr title="Status of the risk assessment">
                    <td
                      style={{
                        width: "30%",
                        verticalAlign: "top",
                        paddingRight: "1rem",
                        paddingBottom: "0.5rem",
                      }}
                    >
                      <label style={{ color: SC3_PRIMARY }}>Status:</label>
                    </td>
                    <td style={{ paddingBottom: "0.5rem" }}>
                      <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: SC3_INPUT_PADDING,
                          borderRadius: SC3_INPUT_BORDER_RADIUS,
                          border: `2px solid ${form.status ? getStatusColor(form.status) : SC3_SECONDARY}`,
                          fontSize: "1rem",
                          backgroundColor: form.status ? getStatusColor(form.status) : "white",
                          color: form.status ? "white" : "#333",
                          fontWeight: form.status ? "bold" : "normal",
                        }}
                      >
                        <option value="">Select Status</option>
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="monitoring">Monitoring</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                  </tr>

                  {form.status === "closed" && (
                    <>
                      <tr title="Date when the risk was closed">
                        <td
                          style={{
                            width: "30%",
                            verticalAlign: "top",
                            paddingRight: "1rem",
                            paddingBottom: "0.5rem",
                          }}
                        >
                          <label style={{ color: SC3_PRIMARY }}>
                            Closed Date:
                          </label>
                        </td>
                        <td style={{ paddingBottom: "0.5rem" }}>
                          <input
                            type="date"
                            defaultValue={getToday()}
                            name="closedDate"
                            value={form.closedDate}
                            onChange={handleChange}
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              padding: SC3_INPUT_PADDING,
                              borderRadius: SC3_INPUT_BORDER_RADIUS,
                              border: `1px solid ${SC3_SECONDARY}`,
                              fontSize: "1rem",
                            }}
                          />
                        </td>
                      </tr>

                      <tr title="Name of the person who closed the risk">
                        <td
                          style={{
                            width: "30%",
                            verticalAlign: "top",
                            paddingRight: "1rem",
                            paddingBottom: "0.5rem",
                          }}
                        >
                          <label style={{ color: SC3_PRIMARY }}>
                            Closed By:
                          </label>
                        </td>
                        <td style={{ paddingBottom: "0.5rem" }}>
                          <input
                            type="text"
                            name="closedBy"
                            value={form.closedBy}
                            onChange={handleChange}
                            placeholder="Name of the person who closed the risk"
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              padding: SC3_INPUT_PADDING,
                              borderRadius: SC3_INPUT_BORDER_RADIUS,
                              border: `1px solid ${SC3_SECONDARY}`,
                              fontSize: "1rem",
                            }}
                          />
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>

              {/* Risk Matrix Visualization */}
              {form.assessmentType === "qualitative" && (riskLevel ||
                calculatedResidualRiskLevel ||
                form.residualRisk) && (
                <div style={{ marginTop: "2rem" }}>
                  <h4 style={{ color: SC3_PRIMARY, marginBottom: "1rem" }}>
                    Risk Assessment Matrix - Current Risk Position
                  </h4>
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        borderCollapse: "collapse",
                        border: `2px solid ${SC3_PRIMARY}`,
                        borderRadius: SC3_BORDER_RADIUS,
                        overflow: "hidden",
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_PRIMARY,
                              padding: "8px",
                              border: `1px solid ${SC3_PRIMARY}`,
                              fontWeight: "bold",
                              textAlign: "center",
                            }}
                          >
                            Severity ↓ / Likelihood →
                          </th>
                          {[
                            "Very Unlikely",
                            "Unlikely",
                            "Possible",
                            "Likely",
                            "Very Likely",
                          ].map((likelihoodLabel) => (
                            <th
                              key={likelihoodLabel}
                              style={{
                                background: SC3_TABLE_HEADER_BG,
                                color: SC3_PRIMARY,
                                padding: "8px",
                                border: `1px solid ${SC3_PRIMARY}`,
                                fontWeight: "bold",
                                textAlign: "center",
                                minWidth: "120px",
                              }}
                            >
                              {likelihoodLabel}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          "Severe",
                          "Major",
                          "Moderate",
                          "Minor",
                          "Negligible",
                        ].map((severityLabel) => (
                          <tr key={severityLabel}>
                            <td
                              style={{
                                background: SC3_TABLE_HEADER_BG,
                                color: SC3_PRIMARY,
                                padding: "8px",
                                border: `1px solid ${SC3_PRIMARY}`,
                                fontWeight: "bold",
                                textAlign: "center",
                              }}
                            >
                              {severityLabel}
                            </td>
                            {[
                              "Very Unlikely",
                              "Unlikely",
                              "Possible",
                              "Likely",
                              "Very Likely",
                            ].map((likelihoodLabel) => {
                              const matrixKey = `${severityLabel}-${likelihoodLabel}`;
                              const cellRiskLevel = riskMatrix[matrixKey];

                              // Check if this cell contains the current risk or residual risk
                              const isCurrentRisk =
                                form.assessmentType === "qualitative" &&
                                form.likelihood &&
                                form.impact &&
                                likelihoodLabel ===
                                  [
                                    "Very Unlikely",
                                    "Unlikely",
                                    "Possible",
                                    "Likely",
                                    "Very Likely",
                                  ][parseInt(form.likelihood) - 1] &&
                                severityLabel ===
                                  [
                                    "Negligible",
                                    "Minor",
                                    "Moderate",
                                    "Major",
                                    "Severe",
                                  ][parseInt(form.impact) - 1];

                              const isResidualRisk =
                                (form.assessmentType === "qualitative" &&
                                  form.residualLikelihood &&
                                  form.residualImpact &&
                                  likelihoodLabel ===
                                    [
                                      "Very Unlikely",
                                      "Unlikely",
                                      "Possible",
                                      "Likely",
                                      "Very Likely",
                                    ][parseInt(form.residualLikelihood) - 1] &&
                                  severityLabel ===
                                    [
                                      "Negligible",
                                      "Minor",
                                      "Moderate",
                                      "Major",
                                      "Severe",
                                    ][parseInt(form.residualImpact) - 1]) ||
                                (form.assessmentType === "quantitative" &&
                                  form.residualRisk &&
                                  cellRiskLevel?.toLowerCase() ===
                                    form.residualRisk.toLowerCase());

                              let cellContent = cellRiskLevel;
                              let indicators = [];

                              if (isCurrentRisk) {
                                indicators.push("🔴"); // Current Risk indicator
                              }
                              if (isResidualRisk) {
                                indicators.push("🟢"); // Residual Risk indicator
                              }

                              if (indicators.length > 0) {
                                cellContent = `${cellRiskLevel} ${indicators.join(" ")}`;
                              }

                              return (
                                <td
                                  key={likelihoodLabel}
                                  style={{
                                    padding: "8px",
                                    border: `1px solid ${SC3_PRIMARY}`,
                                    textAlign: "center",
                                    background: getRiskColor(cellRiskLevel),
                                    color: "#fff",
                                    fontWeight: "bold",
                                    fontSize: "0.9rem",
                                    position: "relative",
                                  }}
                                >
                                  {cellContent}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Legend */}
                  <div
                    style={{
                      marginTop: "1rem",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "1rem",
                      justifyContent: "center",
                      fontSize: "0.9em",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span>🔴</span>
                      <span>Current Risk Level</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span>🟢</span>
                      <span>Residual Risk Level</span>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: "0.5rem",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "1rem",
                      justifyContent: "center",
                      fontSize: "0.85em",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          background: getRiskColor("Low"),
                          border: "1px solid #ccc",
                        }}
                      ></div>
                      <span>Low Risk</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          background: getRiskColor("Medium"),
                          border: "1px solid #ccc",
                        }}
                      ></div>
                      <span>Medium Risk</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          background: getRiskColor("High"),
                          border: "1px solid #ccc",
                        }}
                      ></div>
                      <span>High Risk</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          background: getRiskColor("Extreme"),
                          border: "1px solid #ccc",
                        }}
                      ></div>
                      <span>Extreme Risk</span>
                    </div>
                  </div>
                </div>
              )}
            </fieldset>

            <p
              style={{
                marginTop: "1.5rem",
                fontStyle: "italic",
                color: SC3_PRIMARY,
              }}
            >
              <strong>Note:</strong> RAR fields should be customized based on
              organizational risk management frameworks, industry requirements,
              and regulatory obligations. Consider adding custom fields for
              specific business contexts.
            </p>

            {/* Submit/Update Button */}
            <div
              style={{
                marginTop: "2rem",
                textAlign: "center",
                borderTop: `2px solid ${SC3_PRIMARY}`,
                paddingTop: "1.5rem",
              }}
            >
              {isEditingRisk ? (
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={handleUpdateRisk}
                    style={{
                      background: SC3_ACCENT,
                      color: "#000",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: SC3_BORDER_RADIUS,
                      fontWeight: SC3_BTN_FONT_WEIGHT,
                      cursor: "pointer",
                      fontSize: "1rem",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.background = "#e0a800")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.background = SC3_ACCENT)
                    }
                  >
                    Update Risk
                  </button>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "Discard changes and return to risks list?",
                        )
                      ) {
                        clearRarFields();
                        setSelectedRiskIndex(null);
                        setIsEditingRisk(false);
                        setRarFieldsOpen(false);
                        setRisksOpen(true);
                      }
                    }}
                    style={{
                      background: "#fff",
                      color: SC3_PRIMARY,
                      border: `2px solid ${SC3_PRIMARY}`,
                      padding: "10px 20px",
                      borderRadius: SC3_BORDER_RADIUS,
                      fontWeight: SC3_BTN_FONT_WEIGHT,
                      cursor: "pointer",
                      fontSize: "1rem",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = SC3_PRIMARY;
                      e.target.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "#fff";
                      e.target.style.color = SC3_PRIMARY;
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSubmitRisk}
                  style={{
                    background: SC3_SECONDARY,
                    color: "#fff",
                    border: "none",
                    padding: "12px 24px",
                    borderRadius: SC3_BORDER_RADIUS,
                    fontWeight: SC3_BTN_FONT_WEIGHT,
                    cursor: "pointer",
                    fontSize: "1rem",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => (e.target.style.background = "#007aa3")}
                  onMouseLeave={(e) =>
                    (e.target.style.background = SC3_SECONDARY)
                  }
                >
                  Submit Risk Details
                </button>
              )}
            </div>
          </div>
        </details>

        {/* Full-width Risks Section */}
        <div
          style={{
            width: "100vw",
            marginLeft: "calc(-50vw + 50%)",
            background: "#f8f9fa",
            borderTop: `2px solid ${SC3_PRIMARY}`,
            padding: "2rem 1rem",
            marginTop: "2rem",
          }}
        >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
          }}
        >
          <details open={risksOpen} style={{ marginBottom: "1rem" }}>
            <summary
              style={{
                cursor: "pointer",
                fontWeight: SC3_BTN_FONT_WEIGHT,
                color: SC3_SECONDARY,
              }}
              onClick={(e) => {
                e.preventDefault();
                setRisksOpen(!risksOpen);
              }}
            >
              Current Risk Assessment ({risks.length} risks identified)
            </summary>
            <div>
              {/* Header stays inside the background card */}
              {risks.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#666",
                    }}
                  >
                    Total risks:{" "}
                    <strong style={{ color: SC3_PRIMARY }}>
                      {risks.length}
                    </strong>
                    {risks.filter((r) => r.assessmentType === "qualitative").length > 0 && (
                      <span style={{ marginLeft: "1rem" }}>
                        Qualitative:{" "}
                        <strong style={{ color: SC3_SECONDARY }}>
                          {risks.filter((r) => r.assessmentType === "qualitative").length}
                        </strong>
                      </span>
                    )}
                    {risks.filter((r) => r.assessmentType === "quantitative").length > 0 && (
                      <span style={{ marginLeft: "1rem" }}>
                        Quantitative:{" "}
                        <strong style={{ color: SC3_ACCENT }}>
                          {risks.filter((r) => r.assessmentType === "quantitative").length}
                        </strong>
                      </span>
                    )}
                    {risks.filter((r) => r.status === "open").length > 0 && (
                      <span style={{ marginLeft: "1rem" }}>
                        Open:{" "}
                        <strong style={{ color: "#dc3545" }}>
                          {risks.filter((r) => r.status === "open").length}
                        </strong>
                      </span>
                    )}
                    {risks.filter((r) => r.status === "in-progress").length > 0 && (
                      <span style={{ marginLeft: "1rem" }}>
                        In Progress:{" "}
                        <strong style={{ color: "#fd7e14" }}>
                          {risks.filter((r) => r.status === "in-progress").length}
                        </strong>
                      </span>
                    )}
                    {risks.filter((r) => r.status === "monitoring").length > 0 && (
                      <span style={{ marginLeft: "1rem" }}>
                        Monitoring:{" "}
                        <strong style={{ color: "#6f42c1" }}>
                          {risks.filter((r) => r.status === "monitoring").length}
                        </strong>
                      </span>
                    )}
                    {risks.filter((r) => r.status === "closed").length > 0 && (
                      <span style={{ marginLeft: "1rem" }}>
                        Closed:{" "}
                        <strong style={{ color: "#28a745" }}>
                          {risks.filter((r) => r.status === "closed").length}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {risks.length === 0 && (
                <div
                  style={{
                    background: "#f0f8ff",
                    border: `2px dashed ${SC3_SECONDARY}`,
                    borderRadius: SC3_BORDER_RADIUS,
                    padding: "2rem",
                    textAlign: "center",
                    color: SC3_PRIMARY,
                    marginTop: "1rem",
                  }}
                >
                  <h4 style={{ color: SC3_SECONDARY, marginBottom: "0.5rem" }}>
                    Current Risk Assessment - No Risks Identified
                  </h4>
                  <p style={{ marginBottom: "1rem" }}>
                    No risks have been added to the current assessment yet. Use
                    the "RAR Fields" section above to:
                  </p>
                  <ul
                    style={{
                      textAlign: "left",
                      display: "inline-block",
                      margin: "0 0 1rem 0",
                      padding: "0",
                      listStyle: "none",
                    }}
                  >
                    <li style={{ marginBottom: "0.5rem" }}>
                      • Fill in risk details (title, description, category,
                      etc.)
                    </li>
                    <li style={{ marginBottom: "0.5rem" }}>
                      • Assess likelihood and impact
                    </li>
                    <li style={{ marginBottom: "0.5rem" }}>
                      • Define mitigation strategies
                    </li>
                    <li style={{ marginBottom: "0.5rem" }}>
                      • Click "Submit Risk Details" to add to this table
                    </li>
                  </ul>
                  <button
                    onClick={handleNewRisk}
                    style={{
                      background: SC3_GREEN,
                      color: "#fff",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: SC3_BORDER_RADIUS,
                      fontWeight: SC3_BTN_FONT_WEIGHT,
                      cursor: "pointer",
                      fontSize: "1rem",
                      marginTop: "1rem",
                    }}
                  >
                    + Add First Risk
                  </button>
                </div>
              )}
            </div>
          </details>

          {/* Table spills out both sides */}
          {risks.length > 0 && (
            <div
              style={{
                width: "100vw",
                maxWidth: "100vw",
                position: "relative",
                left: "50%",
                right: "50%",
                marginLeft: "-50vw",
                marginRight: "-50vw",
                background: "transparent",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxSizing: "border-box"
              }}
            >
                {/* Outer wrapper for horizontal scroll so that scroll bar does not hide the last row - works for Chrome and Edge, not for Firefox */}
                <div
                  style={{
                    width: "100%",
                    overflowX: "auto",
                    padding: "0 0.05rem",
                    boxSizing: "border-box"
                  }}
                >
                  {/* Table is now inside the scrollable area */}
                  <table
                    style={{
                      width: "95vw",
                      minWidth: 1400,
                      borderCollapse: "collapse",
                      background: SC3_TABLE_BG,
                      borderRadius: SC3_TABLE_BORDER_RADIUS,
                      overflow: "hidden",
                      margin: "0 auto",
                      border: `2px solid ${SC3_PRIMARY}`,
                    }}
                  >
                    <thead>
                        <tr>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_PRIMARY,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_PRIMARY}`,
                              fontWeight: "bold",
                              textAlign: "left",
                              minWidth: "100px",
                            }}
                          >
                            Risk ID
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_PRIMARY,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_PRIMARY}`,
                              fontWeight: "bold",
                              textAlign: "left",
                              minWidth: "120px",
                            }}
                          >
                            Risk Title
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_PRIMARY,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_PRIMARY}`,
                              fontWeight: "bold",
                              textAlign: "left",
                              minWidth: "120px",
                            }}
                          >
                            Framework
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_PRIMARY,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_PRIMARY}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "120px",
                            }}
                          >
                            Category
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_PRIMARY,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_PRIMARY}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "120px",
                            }}
                          >
                            Description
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_PRIMARY,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_PRIMARY}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "120px",
                            }}
                          >
                            Assessor
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_PRIMARY,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_PRIMARY}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "120px",
                            }}
                          >
                            Assessed Date
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_PRIMARY,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_PRIMARY}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "120px",
                            }}
                          >
                            Owner
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_PRIMARY,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_PRIMARY}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "120px",
                            }}
                          >
                            Threat Source
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_PRIMARY,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_PRIMARY}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "120px",
                            }}
                          >
                            Vulnerability
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_PRIMARY,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_PRIMARY}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "120px",
                            }}
                          >
                            Current Controls
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_PRIMARY,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_PRIMARY}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "120px",
                            }}
                          >
                            Control Effectiveness
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_GREEN,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_GREEN}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "120px",
                            }}
                          >
                            Assessment Type
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_GREEN,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_GREEN}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "110px",
                            }}
                          >
                            Likelihood
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_GREEN,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_GREEN}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "110px",
                            }}
                          >
                            Impact
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_GREEN,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_GREEN}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "120px",
                            }}
                          >
                            Risk Level
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_GREEN,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_GREEN}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "120px",
                            }}
                          >
                            Treatment Strategy
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_GREEN,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_GREEN}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "120px",
                            }}
                          >
                            Recommended Actions
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_GREEN,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_GREEN}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "120px",
                            }}
                          >
                            Action Owner
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_GREEN,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_GREEN}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "120px",
                            }}
                          >
                            Target Date
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_GREEN,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_GREEN}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "120px",
                            }}
                          >
                            Residual Likelihood
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_GREEN,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_GREEN}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "120px",
                            }}
                          >
                            Residual Impact
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_GREEN,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_GREEN}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "130px",
                            }}
                          >
                            Residual Risk
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_GREEN,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_GREEN}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "150px",
                            }}
                          >
                            Review Date
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_GREEN,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_GREEN}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "120px",
                            }}
                          >
                            Status
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_GREEN,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_GREEN}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "120px",
                            }}
                          >
                            Closed Date
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_GREEN,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_GREEN}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "150px",
                            }}
                          >
                            Closed By
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_PRIMARY,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_PRIMARY}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "70px",
                            }}
                          >
                            Order
                          </th>
                          <th
                            style={{
                              background: SC3_TABLE_HEADER_BG,
                              color: SC3_PRIMARY,
                              padding: "12px 8px",
                              border: `1px solid ${SC3_PRIMARY}`,
                              fontWeight: "bold",
                              textAlign: "center",
                              minWidth: "100px",
                            }}
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {risks.map((risk, index) => {
                          const isCurrentlyEditing =
                            selectedRiskIndex === index && isEditingRisk;
                          const isSelected = selectedRiskIndex === index;
                          const isDragOver = dragOverIndex === index;

                          return (
                            <tr
                              key={risk.id}
                              draggable="true"
                              onDragStart={(e) => handleDragStart(e, index)}
                              onDragEnd={handleDragEnd}
                              onDragOver={(e) => handleDragOver(e, index)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, index)}
                              style={{
                                background: isDragOver
                                  ? "#e8f5e8"
                                  : isCurrentlyEditing
                                    ? "#fff3cd"
                                    : isSelected
                                      ? "#e6f3ff"
                                      : "#fff",
                                cursor:
                                  draggedRiskIndex === index
                                    ? "grabbing"
                                    : "grab",
                                transition: "background-color 0.2s ease",
                                border: isDragOver
                                  ? `2px solid ${SC3_GREEN}`
                                  : isCurrentlyEditing
                                    ? `2px solid ${SC3_ACCENT}`
                                    : "none",
                                opacity: draggedRiskIndex === index ? 0.5 : 1,
                              }}
                              onClick={() => handleSelectRisk(index)}
                              onMouseEnter={(e) => {
                                if (!isSelected && draggedRiskIndex === null) {
                                  e.target.parentElement.style.background =
                                    "#f0f8ff";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected && draggedRiskIndex === null) {
                                  e.target.parentElement.style.background =
                                    "#fff";
                                }
                              }}
                            >
                              
                              <td
                                style={{
                                  padding: "12px 8px",
                                  border: `1px solid ${SC3_PRIMARY}`,
                                  fontWeight: "bold",
                                  position: "relative",
                                }}
                              >
                                {isCurrentlyEditing && (
                                  <span
                                    style={{
                                      position: "absolute",
                                      top: "2px",
                                      right: "2px",
                                      background: SC3_ACCENT,
                                      color: "#fff",
                                      fontSize: "10px",
                                      padding: "2px 4px",
                                      borderRadius: "2px",
                                      fontWeight: "normal",
                                    }}
                                  >
                                    EDITING
                                  </span>
                                )}
                                {risk.riskId}
                              </td>
                              <td
                                style={{
                                  padding: "12px 8px",
                                  border: `1px solid ${SC3_PRIMARY}`,
                                  maxWidth: "300px",
                                  wordBreak: "break-word",
                                  lineHeight: "1.4",
                                }}
                              >
                                {risk.riskTitle}
                              </td>
                              <td
                                style={{
                                  padding: "12px 8px",
                                  border: `1px solid ${SC3_PRIMARY}`,
                                  maxWidth: "300px",
                                  wordBreak: "break-word",
                                  lineHeight: "1.4",
                                }}
                              >
                                {risk.framework || "Not set"}
                              </td>
                              <td
                                style={{
                                  padding: "12px 8px",
                                  border: `1px solid ${SC3_PRIMARY}`,
                                  textAlign: "center",

                                }}
                              >
                                {risk.riskCategory || "Not set"}
                              </td>
                              <td
                                style={{
                                  padding: "12px 8px",
                                  border: `1px solid ${SC3_PRIMARY}`,
                                  textAlign: "center",
                                }}
                              >
                                {risk.riskDescription || "Not set"}
                              </td>
                                <td
                                    style={{
                                    padding: "12px 8px",
                                    border: `1px solid ${SC3_PRIMARY}`,
                                    textAlign: "center",
                                    }}
                                  >
                                    {risk.assessor || "Not set"}
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px 8px",
                                      border: `1px solid ${SC3_PRIMARY}`,
                                      textAlign: "center",
                                    }}
                                  >
                                    {risk.assessedDate || "Not set"}
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px 8px",
                                      border: `1px solid ${SC3_PRIMARY}`,
                                      textAlign: "center",
                                    }}
                                  >
                                    {risk.riskOwner || "Not set"}
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px 8px",
                                      border: `1px solid ${SC3_PRIMARY}`,
                                      textAlign: "center",
                                    }}
                                  >
                                    {risk.threatSource || "Not set"}
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px 8px",
                                      border: `1px solid ${SC3_PRIMARY}`,
                                      textAlign: "center",
                                    }}
                                  >
                                    {risk.vulnerability || "Not set"}
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px 8px",
                                      border: `1px solid ${SC3_PRIMARY}`,
                                      textAlign: "center",
                                    }}
                                  >
                                    {risk.currentControls || "Not set"}
                                  </td>
                                  <td
                                    style={{
                                      padding: "12px 8px",
                                      border: `1px solid ${SC3_PRIMARY}`,
                                      textAlign: "center",
                                    }}
                                  >
                                    {risk.controlEffectiveness || "Not set"}
                                  </td>
                              <td
                                style={{
                                  padding: "12px 8px",
                                  border: `1px solid ${SC3_PRIMARY}`,
                                  textAlign: "center",
                                  textTransform: "capitalize",
                                }}
                              >
                                {risk.assessmentType}
                              </td>
                              <td
                                style={{
                                  padding: "12px 8px",
                                  border: `1px solid ${SC3_PRIMARY}`,
                                  textAlign: "center",
                                }}
                              >
                                {risk.assessmentType === "qualitative" &&
                                risk.likelihood
                                  ? likelihoodMap[risk.likelihood] || risk.likelihood
                                  : risk.assessmentType === "quantitative"
                                    ? "N/A"
                                    : "Not set"}
                              </td>
                              <td
                                style={{
                                  padding: "12px 8px",
                                  border: `1px solid ${SC3_PRIMARY}`,
                                  textAlign: "center",
                                }}
                              >
                                {risk.assessmentType === "qualitative" &&
                                risk.impact
                                  ? impactMap[risk.impact] || risk.impact
                                  : risk.assessmentType === "quantitative"
                                    ? "N/A"
                                    : "Not set"}
                              </td>
                              <td
                                style={{
                                  padding: "12px 8px",
                                  border: `1px solid ${SC3_PRIMARY}`,
                                  textAlign: "center",
                                  background: risk.riskLevel
                                    ? getRiskColor(
                                        risk.riskLevel.charAt(0).toUpperCase() +
                                          risk.riskLevel.slice(1),
                                      )
                                    : "transparent",
                                  color: risk.riskLevel ? "#fff" : "inherit",
                                  fontWeight: risk.riskLevel
                                    ? "bold"
                                    : "normal",
                                  textTransform: "capitalize",
                                }}
                              >
                                {risk.riskLevel || "Not set"}
                              </td>
                              <td
                                style={{
                                  padding: "12px 8px",
                                  border: `1px solid ${SC3_PRIMARY}`,
                                  textAlign: "center",
                                }}
                              >
                                {risk.treatmentStrategy || "Not set"}
                              </td>
                              <td
                                style={{
                                  padding: "12px 8px",
                                  border: `1px solid ${SC3_PRIMARY}`,
                                  textAlign: "center",
                                }}
                              >
                                {risk.recommendedActions || "Not set"}
                              </td>
                              <td
                                style={{
                                  padding: "12px 8px",
                                  border: `1px solid ${SC3_PRIMARY}`,
                                  textAlign: "center",
                                }}
                              >
                                {risk.actionOwner || "Not set"}
                              </td>
                              <td
                                style={{
                                  padding: "12px 8px",
                                  border: `1px solid ${SC3_PRIMARY}`,
                                  textAlign: "center",
                                }}
                              >
                                {risk.targetDate || "Not set"}
                              </td>
                              <td
                                style={{
                                  padding: "12px 8px",
                                  border: `1px solid ${SC3_PRIMARY}`,
                                  textAlign: "center",
                                }}
                              >
                                {risk.assessmentType === "qualitative" && risk.residualLikelihood
                                  ? likelihoodMap[parseInt(risk.residualLikelihood)] || risk.residualLikelihood
                                  : risk.assessmentType === "quantitative"
                                    ? "N/A"
                                    : "Not set"}
                              </td>
                              <td
                                style={{
                                  padding: "12px 8px",
                                  border: `1px solid ${SC3_PRIMARY}`,
                                  textAlign: "center",
                                }}
                              >
                                {risk.assessmentType === "qualitative" && risk.residualImpact
                                  ? impactMap[parseInt(risk.residualImpact)] || risk.residualImpact
                                  : risk.assessmentType === "quantitative"
                                    ? "N/A"
                                    : "Not set"}
                              </td>
                              <td
                                style={{
                                  padding: "12px 8px",
                                  border: `1px solid ${SC3_PRIMARY}`,
                                  textAlign: "center",
                                  background: risk.calculatedResidualRiskLevel
                                    ? getRiskColor(
                                        risk.calculatedResidualRiskLevel
                                          .charAt(0)
                                          .toUpperCase() +
                                          risk.calculatedResidualRiskLevel.slice(
                                            1,
                                          ),
                                      )
                                    : "transparent",
                                  color: risk.calculatedResidualRiskLevel
                                    ? "#fff"
                                    : "inherit",
                                  fontWeight: risk.calculatedResidualRiskLevel
                                    ? "bold"
                                    : "normal",
                                  textTransform: "capitalize",
                                }}
                              >
                                {risk.calculatedResidualRiskLevel || "Not set"}
                              </td>
                              <td
                                style={{
                                  padding: "12px 8px",
                                  border: `1px solid ${SC3_PRIMARY}`,
                                  textAlign: "center",
                                }}
                              >
                                {risk.reviewDate || "Not set"}
                              </td>
                              <td
                                style={{
                                  padding: "12px 8px",
                                  border: `1px solid ${SC3_PRIMARY}`,
                                  textAlign: "center",
                                  textTransform: "capitalize",
                                  backgroundColor: risk.status ? getStatusColor(risk.status) : "transparent",
                                  color: risk.status ? "white" : "inherit",
                                  fontWeight: risk.status ? "bold" : "normal",
                                }}
                              >
                                {risk.status || "Not set"}
                              </td>
                              <td
                                style={{
                                  padding: "12px 8px",
                                  border: `1px solid ${SC3_PRIMARY}`,
                                  textAlign: "center",
                                }}
                              >
                                {risk.status === "closed" && risk.closedDate ? risk.closedDate : risk.status === "closed" ? "Not set" : "N/A"}
                              </td>
                              <td
                                style={{
                                  padding: "12px 8px",
                                  border: `1px solid ${SC3_PRIMARY}`,
                                  textAlign: "center",
                                }}
                              >
                                {risk.status === "closed" && risk.closedBy ? risk.closedBy : risk.status === "closed" ? "Not set" : "N/A"}
                              </td>
                              <td
                                style={{
                                  padding: "8px",
                                  border: `1px solid ${SC3_PRIMARY}`,
                                  textAlign: "center",
                                  verticalAlign: "middle",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "2px",
                                    alignItems: "center",
                                  }}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveRiskUp(index);
                                    }}
                                    disabled={index === 0}
                                    style={{
                                      background:
                                        index === 0 ? "#ccc" : SC3_SECONDARY,
                                      color: "#fff",
                                      border: "none",
                                      padding: "2px 6px",
                                      borderRadius: "2px",
                                      cursor:
                                        index === 0 ? "not-allowed" : "pointer",
                                      fontSize: "10px",
                                      lineHeight: "1",
                                    }}
                                    title="Move Up"
                                  >
                                    ▲
                                  </button>
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      fontWeight: "bold",
                                      color: SC3_PRIMARY,
                                      minWidth: "20px",
                                      textAlign: "center",
                                    }}
                                  >
                                    {index + 1}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveRiskDown(index);
                                    }}
                                    disabled={index === risks.length - 1}
                                    style={{
                                      background:
                                        index === risks.length - 1
                                          ? "#ccc"
                                          : SC3_SECONDARY,
                                      color: "#fff",
                                      border: "none",
                                      padding: "2px 6px",
                                      borderRadius: "2px",
                                      cursor:
                                        index === risks.length - 1
                                          ? "not-allowed"
                                          : "pointer",
                                      fontSize: "10px",
                                      lineHeight: "1",
                                    }}
                                    title="Move Down"
                                  >
                                    ▼
                                  </button>
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: "8px",
                                  border: `1px solid ${SC3_PRIMARY}`,
                                  textAlign: "center",
                                }}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteRisk(index);
                                  }}
                                  style={{
                                    background: "#dc3545",
                                    color: "#fff",
                                    border: "none",
                                    padding: "4px 8px",
                                    borderRadius: "3px",
                                    cursor: "pointer",
                                    fontSize: "0.8rem",
                                  }}
                                  title="Delete Risk"
                                >
                                  ×
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <p></p>
                  </div>
                </div>
              )}

              {risks.length === 0 && (
                <div
                  style={{
                    width: "100vw",
                    maxWidth: "100vw", 
                    position: "relative",
                    left: "50%",
                    right: "50%",
                    marginLeft: "-50vw",
                    marginRight: "-50vw",
                    background: "#f0f8ff",
                    border: `2px dashed ${SC3_SECONDARY}`,
                    borderRadius: SC3_BORDER_RADIUS,
                    padding: "2rem",
                    textAlign: "center",
                    color: SC3_PRIMARY,
                    marginTop: "1rem",
                  }}
                >
                  <h4 style={{ color: SC3_SECONDARY, marginBottom: "0.5rem" }}>
                    Current Risk Assessment - No Risks Identified
                  </h4>
                  <p style={{ marginBottom: "1rem" }}>
                    No risks have been added to the current assessment yet. Use
                    the "RAR Fields" section above to:
                  </p>
                  <ul
                    style={{
                      textAlign: "left",
                      display: "inline-block",
                      margin: "0 0 1rem 0",
                      padding: "0",
                      listStyle: "none",
                    }}
                  >
                    <li style={{ marginBottom: "0.5rem" }}>
                      • Fill in risk details (title, description, category,
                      etc.)
                    </li>
                    <li style={{ marginBottom: "0.5rem" }}>
                      • Assess likelihood and impact
                    </li>
                    <li style={{ marginBottom: "0.5rem" }}>
                      • Define mitigation strategies
                    </li>
                    <li style={{ marginBottom: "0.5rem" }}>
                      • Click "Submit Risk Details" to add to this table
                    </li>
                  </ul>
                  <button
                    onClick={handleNewRisk}
                    style={{
                      background: SC3_GREEN,
                      color: "#fff",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: SC3_BORDER_RADIUS,
                      fontWeight: SC3_BTN_FONT_WEIGHT,
                      cursor: "pointer",
                      fontSize: "1rem",
                      marginTop: "1rem",
                    }}
                  >
                    + Add First Risk
                  </button>
                </div>
              )}

          {/* Risk Assessment Table Legend */}
          <div
            style={{
              marginTop: "1rem",
              marginBottom: "1rem",
              padding: "0.75rem",
              background: "#f8f9fa",
              border: `1px solid #e9ecef`,
              borderRadius: SC3_BORDER_RADIUS,
              fontSize: "0.85rem",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1rem",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: "bold", color: SC3_PRIMARY }}>
                Legend:
              </span>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    background: "#e6f3ff",
                    border: "1px solid #ccc",
                    borderRadius: "2px",
                  }}
                ></div>
                <span>Selected Risk</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    background: "#fff3cd",
                    border: `2px solid ${SC3_ACCENT}`,
                    borderRadius: "2px",
                  }}
                ></div>
                <span>Currently Editing in RAR Fields</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    background: "#e8f5e8",
                    border: `2px solid ${SC3_GREEN}`,
                    borderRadius: "2px",
                  }}
                ></div>
                <span>Drag Drop Target</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span
                  style={{
                    background: getRiskColor("High"),
                    color: "#fff",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                  }}
                >
                  Risk Level
                </span>
                <span>Color-coded by severity</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span style={{ fontSize: "12px" }}>▲▼</span>
                <span>Use arrows or drag rows to reorder</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            marginTop: "1rem",
            marginBottom: "2rem",
            flexWrap: "wrap"
          }}>
            <button
              onClick={handleNewRisk}
              style={{
                background: SC3_GREEN,
                color: "#fff",
                border: "none",
                padding: SC3_BTN_PADDING,
                borderRadius: SC3_BTN_RADIUS,
                fontWeight: SC3_BTN_FONT_WEIGHT,
                fontSize: SC3_BTN_FONT_SIZE,
                cursor: "pointer",
                boxShadow: SC3_BTN_BOX_SHADOW(SC3_GREEN),
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => e.target.style.background = "#2e7d32"}
              onMouseOut={(e) => e.target.style.background = SC3_GREEN}
            >
              + Add New Risk
            </button>
            
            <button
              onClick={handleStartNew}
              style={{
                background: "#dc3545",
                color: "#fff",
                border: "none",
                padding: SC3_BTN_PADDING,
                borderRadius: SC3_BTN_RADIUS,
                fontWeight: SC3_BTN_FONT_WEIGHT,
                fontSize: SC3_BTN_FONT_SIZE,
                cursor: "pointer",
                boxShadow: SC3_BTN_BOX_SHADOW("#dc3545"),
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => e.target.style.background = "#c82333"}
              onMouseOut={(e) => e.target.style.background = "#dc3545"}
            >
              🗑️ Start New
            </button>
            
            <button
              onClick={handleExportToExcel}
              style={{
                background: SC3_SECONDARY,
                color: "#fff",
                border: "none",
                padding: SC3_BTN_PADDING,
                borderRadius: SC3_BTN_RADIUS,
                fontWeight: SC3_BTN_FONT_WEIGHT,
                fontSize: SC3_BTN_FONT_SIZE,
                cursor: "pointer",
                boxShadow: SC3_BTN_BOX_SHADOW(SC3_SECONDARY),
                transition: "all 0.3s ease"
              }}
              onMouseOver={(e) => e.target.style.background = "#007bb5"}
              onMouseOut={(e) => e.target.style.background = SC3_SECONDARY}
            >
              📊 Export to Excel
            </button>
          </div>

          </div>
          </div>

          {/* Final form section */}
          <div
            style={{
              marginTop: "2rem",
          fontFamily: "Segoe UI, Arial, sans-serif",
          color: SC3_PRIMARY,
        }}
      >
        {/* Risk Assessment Report Section */}
        <details style={{ marginBottom: "1rem" }}>
          <summary
            style={{
              cursor: "pointer",
              fontWeight: SC3_BTN_FONT_WEIGHT,
              color: SC3_SECONDARY,
            }}
          >
            Risk Assessment Report
          </summary>
          <div>
            <h3 style={{ color: SC3_PRIMARY, marginBottom: "1rem" }}>
              Risk Assessment Report Structure
            </h3>

            {/* Risk Portfolio Analytics - Embedded within Risk Assessment Results */}
            {risks.length > 0 && (
              <div style={{
                marginTop: "1.5rem",
                marginBottom: "1.5rem",
                backgroundColor: "#f8f9fa",
                padding: "1.5rem",
                borderRadius: "8px",
                border: `1px solid ${SC3_SECONDARY}20`
              }}>
                <h5 style={{
                  color: SC3_PRIMARY,
                  marginBottom: "1rem",
                  textAlign: "center",
                  fontSize: "1.2rem",
                  fontWeight: "600"
                }}>
                  Risk Portfolio Analytics Dashboard
                </h5>
                
                {/* Analytics Filter Controls */}
                <div style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "1.5rem"
                }}>
                  <label style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.9rem",
                    color: SC3_PRIMARY,
                    cursor: "pointer"
                  }}>
                    <input
                      type="checkbox"
                      checked={includeClosedRisks}
                      onChange={(e) => setIncludeClosedRisks(e.target.checked)}
                      style={{
                        marginRight: "0.25rem"
                      }}
                    />
                    Include closed risks in analytics
                  </label>
                </div>
                
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "1.5rem",
                  alignItems: "start"
                }}>
                  {/* Risk Levels Distribution */}
                  <div style={{
                    backgroundColor: "#fff",
                    padding: "1.5rem",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    textAlign: "center"
                  }}>
                    <h6 style={{ color: SC3_PRIMARY, marginBottom: "1rem", fontSize: "1rem" }}>Risk Levels Distribution</h6>
                    {createDonutChart(getRiskLevelData(), 160)}
                    <div style={{ marginTop: "1rem", fontSize: "0.8rem" }}>
                      {getRiskLevelData().map(item => (
                        <div key={item.label} style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.3rem",
                          padding: "0.15rem 0"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <div style={{
                              width: "8px",
                              height: "8px",
                              backgroundColor: item.color,
                              borderRadius: "2px"
                            }}></div>
                            <span>{item.label}</span>
                          </div>
                          <span style={{ fontWeight: "600", color: SC3_PRIMARY }}>
                            {item.count} ({((item.count / getFilteredRisksCount()) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Residual Risk Levels Distribution */}
                  <div style={{
                    backgroundColor: "#fff",
                    padding: "1.5rem",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    textAlign: "center"
                  }}>
                    <h6 style={{ color: SC3_PRIMARY, marginBottom: "1rem", fontSize: "1rem" }}>Residual Risk Levels</h6>
                    {(() => {
                      const residualData = getResidualRiskData();
                      const chart = createDonutChart(residualData, 160);
                      return chart || (
                        <div style={{
                          width: "160px",
                          height: "160px",
                          margin: "0 auto",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "2px dashed #ddd",
                          borderRadius: "50%",
                          color: "#999",
                          fontSize: "0.9rem"
                        }}>
                          No Data
                        </div>
                      );
                    })()}
                    <div style={{ marginTop: "1rem", fontSize: "0.8rem" }}>
                      {(() => {
                        const residualData = getResidualRiskData();
                        return residualData.length > 0 ? residualData.map(item => (
                          <div key={item.label} style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "0.3rem",
                            padding: "0.15rem 0"
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              <div style={{
                                width: "8px",
                                height: "8px",
                                backgroundColor: item.color,
                                borderRadius: "2px"
                              }}></div>
                              <span>{item.label}</span>
                            </div>
                            <span style={{ fontWeight: "600", color: SC3_PRIMARY }}>
                              {item.count} ({((item.count / getFilteredRisksCount()) * 100).toFixed(1)}%)
                            </span>
                          </div>
                        )) : (
                          <div style={{ color: "#999", fontStyle: "italic" }}>
                            No residual risk assessments completed
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Status Distribution */}
                  <div style={{
                    backgroundColor: "#fff",
                    padding: "1.5rem",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    textAlign: "center"
                  }}>
                    <h6 style={{ color: SC3_PRIMARY, marginBottom: "1rem", fontSize: "1rem" }}>Status Distribution</h6>
                    {createDonutChart(getStatusData(), 160)}
                    <div style={{ marginTop: "1rem", fontSize: "0.8rem" }}>
                      {getStatusData().map(item => (
                        <div key={item.label} style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.3rem",
                          padding: "0.15rem 0"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <div style={{
                              width: "8px",
                              height: "8px",
                              backgroundColor: item.color,
                              borderRadius: "2px"
                            }}></div>
                            <span>{item.label}</span>
                          </div>
                          <span style={{ fontWeight: "600", color: SC3_PRIMARY }}>
                            {item.count} ({((item.count / getFilteredRisksCount()) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Threat Source Distribution */}
                  <div style={{
                    backgroundColor: "#fff",
                    padding: "1.5rem",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    textAlign: "center"
                  }}>
                    <h6 style={{ color: SC3_PRIMARY, marginBottom: "1rem", fontSize: "1rem" }}>Threat Source Distribution</h6>
                    {createDonutChart(getThreatSourceData(), 160)}
                    <div style={{ marginTop: "1rem", fontSize: "0.8rem" }}>
                      {getThreatSourceData().map(item => (
                        <div key={item.label} style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.3rem",
                          padding: "0.15rem 0"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <div style={{
                              width: "8px",
                              height: "8px",
                              backgroundColor: item.color,
                              borderRadius: "2px"
                            }}></div>
                            <span>{item.label}</span>
                          </div>
                          <span style={{ fontWeight: "600", color: SC3_PRIMARY }}>
                            {item.count} ({((item.count / getFilteredRisksCount()) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Categories Distribution */}
                  <div style={{
                    backgroundColor: "#fff",
                    padding: "1.5rem",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    textAlign: "center"
                  }}>
                    <h6 style={{ color: SC3_PRIMARY, marginBottom: "1rem", fontSize: "1rem" }}>Categories Distribution</h6>
                    {createDonutChart(getCategoryData(), 160)}
                    <div style={{ marginTop: "1rem", fontSize: "0.8rem" }}>
                      {getCategoryData().map(item => (
                        <div key={item.label} style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.3rem",
                          padding: "0.15rem 0"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <div style={{
                              width: "8px",
                              height: "8px",
                              backgroundColor: item.color,
                              borderRadius: "2px"
                            }}></div>
                            <span>{item.label}</span>
                          </div>
                          <span style={{ fontWeight: "600", color: SC3_PRIMARY }}>
                            {item.count} ({((item.count / getFilteredRisksCount()) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Treatment Strategies Distribution */}
                  <div style={{
                    backgroundColor: "#fff",
                    padding: "1.5rem",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    textAlign: "center"
                  }}>
                    <h6 style={{ color: SC3_PRIMARY, marginBottom: "1rem", fontSize: "1rem" }}>Treatment Strategies</h6>
                    {createDonutChart(getTreatmentData(), 160)}
                    <div style={{ marginTop: "1rem", fontSize: "0.8rem" }}>
                      {getTreatmentData().map(item => (
                        <div key={item.label} style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.3rem",
                          padding: "0.15rem 0"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <div style={{
                              width: "8px",
                              height: "8px",
                              backgroundColor: item.color,
                              borderRadius: "2px"
                            }}></div>
                            <span>{item.label}</span>
                          </div>
                          <span style={{ fontWeight: "600", color: SC3_PRIMARY }}>
                            {item.count} ({((item.count / getFilteredRisksCount()) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Top 5 Risks by Risk Level */}
                <div style={{
                  backgroundColor: "#fff",
                  padding: "1.5rem",
                  borderRadius: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  marginTop: "1.5rem"
                }}>
                  <h6 style={{
                    color: SC3_PRIMARY,
                    marginBottom: "1rem",
                    fontSize: "1rem",
                    textAlign: "center"
                  }}>
                    Top 5 Risks by Risk Level
                  </h6>
                  
                  {(() => {
                    const totalRisks = risks.length;
                    const filteredRisks = includeClosedRisks ? risks : risks.filter(risk => risk.status !== 'closed');
                    const eligibleRisks = filteredRisks.filter(risk => {
                      const hasTitle = risk.riskTitle && risk.riskTitle.trim() !== '';
                      const hasLevel = risk.riskLevel && risk.riskLevel.trim() !== '';
                      return hasTitle || hasLevel;
                    });
                    const top5Risks = getTop5RisksByLevel();
                    
                    if (totalRisks === 0) {
                      return (
                        <div style={{
                          textAlign: "center",
                          color: "#999",
                          fontStyle: "italic",
                          padding: "2rem"
                        }}>
                          No risks have been added to the assessment yet.<br/>
                          <span style={{ fontSize: "0.85rem" }}>
                            Add risks using the form above to see the top risks analysis.
                          </span>
                        </div>
                      );
                    }

                    if (filteredRisks.length === 0) {
                      return (
                        <div style={{
                          textAlign: "center",
                          color: "#999",
                          fontStyle: "italic",
                          padding: "2rem"
                        }}>
                          All {totalRisks} risk{totalRisks !== 1 ? 's are' : ' is'} closed.<br/>
                          <span style={{ fontSize: "0.85rem" }}>
                            Check "Include closed risks in analytics" to see closed risks.
                          </span>
                        </div>
                      );
                    }

                    if (eligibleRisks.length === 0) {
                      return (
                        <div style={{
                          textAlign: "center",
                          color: "#999",
                          fontStyle: "italic",
                          padding: "2rem"
                        }}>                        {filteredRisks.length} risk{filteredRisks.length !== 1 ? 's' : ''} found, but none have sufficient data for ranking.<br/>
                        <span style={{ fontSize: "0.85rem" }}>
                          Risks need at least a title or risk level to be displayed here.
                        </span>
                        </div>
                      );
                    }

                    return (
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem"
                      }}>
                        {/* Summary info */}
                        <div style={{
                          fontSize: "0.85rem",
                          color: "#666",
                          textAlign: "center",
                          marginBottom: "0.5rem",
                          padding: "0.5rem",
                          backgroundColor: "#f8f9fa",
                          borderRadius: "4px"
                        }}>
                          Showing top {top5Risks.length} of {eligibleRisks.length} eligible risk{eligibleRisks.length !== 1 ? 's' : ''}
                          {!includeClosedRisks && totalRisks > filteredRisks.length && 
                            ` (${totalRisks - filteredRisks.length} closed risk${totalRisks - filteredRisks.length !== 1 ? 's' : ''} excluded)`
                          }
                        </div>

                        {top5Risks.map((risk, index) => (
                          <div
                            key={risk.riskTitle || `risk-${index}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              padding: "0.75rem",
                              borderRadius: "6px",
                              border: "1px solid #e9ecef",
                              backgroundColor: "#fafafa",
                              gap: "1rem"
                            }}
                          >
                            {/* Rank Number */}
                            <div style={{
                              minWidth: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              backgroundColor: SC3_PRIMARY,
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.8rem",
                              fontWeight: "600"
                            }}>
                              {index + 1}
                            </div>

                            {/* Risk Level Badge */}
                            <div style={{
                              padding: "0.25rem 0.5rem",
                              borderRadius: "4px",
                              backgroundColor: risk.riskLevel ? getRiskColor(risk.riskLevel.charAt(0).toUpperCase() + risk.riskLevel.slice(1).toLowerCase()) : "#E0E0E0",
                              color: "white",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              minWidth: "70px",
                              textAlign: "center"
                            }}>
                              {risk.riskLevel?.toUpperCase() || 'N/A'}
                            </div>

                            {/* Risk Details */}
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontWeight: "600",
                                color: SC3_PRIMARY,
                                fontSize: "0.9rem",
                                marginBottom: "0.25rem"
                              }}>
                                {risk.riskTitle || 'Untitled Risk'}
                              </div>
                              
                              <div style={{
                                fontSize: "0.8rem",
                                color: "#666",
                                display: "flex",
                                gap: "1rem",
                                flexWrap: "wrap"
                              }}>
                                <span>
                                  <strong>Category:</strong> {risk.category || 'N/A'}
                                </span>
                                <span>
                                  <strong>Likelihood:</strong> {likelihoodMap[risk.likelihood] || risk.likelihood || 'N/A'}
                                </span>
                                <span>
                                  <strong>Impact:</strong> {impactMap[risk.impact] || risk.impact || 'N/A'}
                                </span>
                                <span>
                                  <strong>Status:</strong> {risk.status?.charAt(0).toUpperCase() + risk.status?.slice(1) || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Risk Matrix Heat Map */}
                <div style={{
                  backgroundColor: "#fff",
                  padding: "1.5rem",
                  borderRadius: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  marginTop: "1.5rem"
                }}>
                  <h6 style={{
                    color: SC3_PRIMARY,
                    marginBottom: "1rem",
                    fontSize: "1rem",
                    textAlign: "center"
                  }}>
                    Risk Matrix Heat Map
                  </h6>
                  
                  {(() => {
                    const { matrix, impactLevels, likelihoodLevels } = getRiskMatrixHeatMapData();
                    const totalRisks = risks.length;
                    // Use the same filtering logic as getRiskMatrixHeatMapData
                    const filteredRisks = risks.filter(risk => {
                      const isNotClosed = includeClosedRisks || risk.status !== 'closed';
                      const isQualitative = risk.assessmentType === 'qualitative';
                      return isNotClosed && isQualitative;
                    });
                    const allQualitativeRisks = risks.filter(risk => risk.assessmentType === 'qualitative');
                    
                    if (filteredRisks.length === 0) {
                      return (
                        <div style={{
                          textAlign: "center",
                          color: "#999",
                          fontStyle: "italic",
                          padding: "2rem"
                        }}>
                          No qualitative risks available for heat map analysis.<br/>
                          <span style={{ fontSize: "0.85rem" }}>
                            {allQualitativeRisks.length > 0 
                              ? "All qualitative risks are closed. Check 'Include closed risks' to see the heat map."
                              : "Add qualitative risks with likelihood and impact scores to see the heat map."
                            }
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div>
                        {/* Summary info */}
                        <div style={{
                          fontSize: "0.85rem",
                          color: "#666",
                          textAlign: "center",
                          marginBottom: "1rem",
                          padding: "0.5rem",
                          backgroundColor: "#f8f9fa",
                          borderRadius: "4px"
                        }}>                        Heat map based on {filteredRisks.length} qualitative risk{filteredRisks.length !== 1 ? 's' : ''}
                        {!includeClosedRisks && allQualitativeRisks.length > filteredRisks.length && 
                          ` (${allQualitativeRisks.length - filteredRisks.length} closed qualitative risk${allQualitativeRisks.length - filteredRisks.length !== 1 ? 's' : ''} excluded)`
                        }
                      </div>

                      {/* Caveat about qualitative risks only */}
                      <div style={{
                        fontSize: "0.8rem",
                        color: "#856404",
                        textAlign: "center",
                        marginBottom: "1rem",
                        padding: "0.5rem",
                        backgroundColor: "#fff3cd",
                        borderRadius: "4px",
                        border: "1px solid #ffeaa7"
                      }}>
                        <strong>Note:</strong> This heat map only displays qualitative risks with likelihood and impact scores. 
                        Quantitative risks (using ALE calculations) are not included in this visualization.
                      </div>

                        {/* Heat Map Table */}
                        <div style={{ 
                          overflowX: "auto",
                          display: "flex",
                          justifyContent: "center"
                        }}>
                          <table style={{
                            borderCollapse: "collapse",
                            fontSize: "0.8rem",
                            backgroundColor: "white",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            borderRadius: "6px",
                            overflow: "hidden"
                          }}>
                            <thead>
                              <tr>
                                <th style={{
                                  padding: "0.75rem",
                                  backgroundColor: "#f8f9fa",
                                  border: "1px solid #dee2e6",
                                  fontWeight: "600",
                                  color: SC3_PRIMARY,
                                  textAlign: "center",
                                  minWidth: "80px"
                                }}>
                                  Impact ↓<br/>Likelihood →
                                </th>
                                {likelihoodLevels.map(likelihood => (
                                  <th key={likelihood} style={{
                                    padding: "0.75rem",
                                    backgroundColor: "#f8f9fa",
                                    border: "1px solid #dee2e6",
                                    fontWeight: "600",
                                    color: SC3_PRIMARY,
                                    textAlign: "center",
                                    minWidth: "90px",
                                    fontSize: "0.75rem"
                                  }}>
                                    {likelihood}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {impactLevels.slice().reverse().map(impact => (
                                <tr key={impact}>
                                  <td style={{
                                    padding: "0.75rem",
                                    backgroundColor: "#f8f9fa",
                                    border: "1px solid #dee2e6",
                                    fontWeight: "600",
                                    color: SC3_PRIMARY,
                                    textAlign: "center",
                                    fontSize: "0.75rem"
                                  }}>
                                    {impact}
                                  </td>
                                  {likelihoodLevels.map(likelihood => {
                                    const cell = matrix[impact][likelihood];
                                    const count = cell.count;
                                    const riskLevel = cell.riskLevel;
                                    
                                    // Calculate opacity based on count (0 = very light, max count = full opacity)
                                    const maxCount = Math.max(...impactLevels.flatMap(imp => 
                                      likelihoodLevels.map(like => matrix[imp][like].count)
                                    ));
                                    const opacity = maxCount > 0 ? Math.max(0.2, count / maxCount) : 0.1;
                                    
                                    return (
                                      <td key={`${impact}-${likelihood}`} style={{
                                        padding: "0.75rem",
                                        border: "1px solid #dee2e6",
                                        textAlign: "center",
                                        backgroundColor: getRiskColor(riskLevel),
                                        opacity: opacity,
                                        color: count > 0 ? "white" : "#666",
                                        fontWeight: count > 0 ? "600" : "400",
                                        position: "relative"
                                      }}>
                                        <div style={{
                                          fontSize: count > 0 ? "1.1rem" : "0.9rem",
                                          lineHeight: "1"
                                        }}>
                                          {count}
                                        </div>
                                        {count > 0 && (
                                          <div style={{
                                            fontSize: "0.65rem",
                                            marginTop: "0.25rem",
                                            opacity: 0.9
                                          }}>
                                            {riskLevel}
                                          </div>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Legend */}
                        <div style={{
                          marginTop: "1rem",
                          display: "flex",
                          flexWrap: "wrap",
                          justifyContent: "center",
                          gap: "1rem",
                          fontSize: "0.75rem"
                        }}>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem"
                          }}>
                            <div style={{
                              width: "12px",
                              height: "12px",
                              backgroundColor: getRiskColor("Low"),
                              borderRadius: "2px"
                            }}></div>
                            <span>Low Risk</span>
                          </div>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem"
                          }}>
                            <div style={{
                              width: "12px",
                              height: "12px",
                              backgroundColor: getRiskColor("Medium"),
                              borderRadius: "2px"
                            }}></div>
                            <span>Medium Risk</span>
                          </div>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem"
                          }}>
                            <div style={{
                              width: "12px",
                              height: "12px",
                              backgroundColor: getRiskColor("High"),
                              borderRadius: "2px"
                            }}></div>
                            <span>High Risk</span>
                          </div>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem"
                          }}>
                            <div style={{
                              width: "12px",
                              height: "12px",
                              backgroundColor: getRiskColor("Extreme"),
                              borderRadius: "2px"
                            }}></div>
                            <span>Extreme Risk</span>
                          </div>
                        </div>

                        {/* Additional info */}
                        <div style={{
                          marginTop: "0.75rem",
                          fontSize: "0.7rem",
                          color: "#666",
                          textAlign: "center",
                          fontStyle: "italic"
                        }}>
                          Cell opacity indicates risk concentration. Numbers show count of risks in each category.
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Additional Considerations Collapsible Section */}
            <div style={{ marginTop: "2rem" }}>
              <div 
                onClick={() => setShowAdditionalConsiderations(!showAdditionalConsiderations)}
                style={{
                  cursor: "pointer",
                  padding: "12px 16px",
                  backgroundColor: "#f5f5f5",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  marginBottom: showAdditionalConsiderations ? "1rem" : "0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.3s ease"
                }}
              >
                <h3 style={{
                  margin: 0,
                  color: SC3_PRIMARY,
                  fontSize: "1.1rem",
                  fontWeight: "600"
                }}>
                  Additional Considerations for Including in a Risk Assessment Report
                </h3>
                <span style={{
                  fontSize: "1.2rem",
                  color: SC3_PRIMARY,
                  fontWeight: "bold",
                  transform: showAdditionalConsiderations ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease"
                }}>
                  ▶
                </span>
              </div>

              {showAdditionalConsiderations && (
                <div style={{
                  border: "1px solid #ddd",
                  borderTop: "none",
                  borderRadius: "0 0 8px 8px",
                  padding: "1.5rem",
                  backgroundColor: "#fafafa",
                  animation: "slideDown 0.3s ease"
                }}>
                  <style>
                    {`
                      @keyframes slideDown {
                        from {
                          opacity: 0;
                          transform: translateY(-10px);
                        }
                        to {
                          opacity: 1;
                          transform: translateY(0);
                        }
                      }
                    `}
                  </style>

            <h4
              style={{
                color: SC3_PRIMARY,
                marginTop: "0",
                marginBottom: "0.5rem",
              }}
            >
              Executive Summary
            </h4>
            <ul>
              <li>
                <strong>Assessment Overview:</strong> Brief description of the
                risk assessment scope, objectives, and methodology
              </li>
              <li>
                <strong>Key Findings:</strong> Summary of critical risks
                identified and their potential impacts
              </li>
              <li>
                <strong>Risk Profile:</strong> Overall risk posture and heat map
                summary
              </li>
              <li>
                <strong>Priority Recommendations:</strong> Top 3-5 risk
                treatment recommendations requiring immediate attention
              </li>
            </ul>

            <h4
              style={{
                color: SC3_PRIMARY,
                marginTop: "1.5rem",
                marginBottom: "0.5rem",
              }}
            >
              Methodology
            </h4>
            <ul>
              <li>
                <strong>Assessment Approach:</strong> Risk assessment framework
                and standards used
              </li>
              <li>
                <strong>Scope Definition:</strong> Systems, processes, and
                assets included in the assessment
              </li>
              <li>
                <strong>Data Collection:</strong> Information gathering methods
                and sources
              </li>
              <li>
                <strong>Risk Criteria:</strong> Likelihood and impact rating
                scales and definitions
              </li>
            </ul>

            <h4
              style={{
                color: SC3_PRIMARY,
                marginTop: "1.5rem",
                marginBottom: "0.5rem",
              }}
            >
              Risk Assessment Results
            </h4>
            <ul>
              <li>
                <strong>Risk Inventory:</strong> Comprehensive list of
                identified risks with descriptions
              </li>
              <li>
                <strong>Risk Analysis:</strong> Detailed likelihood and impact
                assessments for each risk
              </li>
              <li>
                <strong>Risk Evaluation:</strong> Risk level determinations and
                prioritization
              </li>
              <li>
                <strong>Risk Heat Map:</strong> Visual representation of risk
                landscape
              </li>
            </ul>

            <h4
              style={{
                color: SC3_PRIMARY,
                marginTop: "1.5rem",
                marginBottom: "0.5rem",
              }}
            >
              Risk Treatment Recommendations
            </h4>
            <ul>
              <li>
                <strong>Treatment Strategies:</strong> Recommended approaches
                for addressing each risk
              </li>
              <li>
                <strong>Control Measures:</strong> Specific controls and
                safeguards to implement
              </li>
              <li>
                <strong>Implementation Timeline:</strong> Phased approach and
                priority sequencing
              </li>
              <li>
                <strong>Resource Requirements:</strong> Budget, personnel, and
                technology needs
              </li>
            </ul>

            <h4
              style={{
                color: SC3_PRIMARY,
                marginTop: "1.5rem",
                marginBottom: "0.5rem",
              }}
            >
              Monitoring and Review
            </h4>
            <ul>
              <li>
                <strong>Risk Monitoring Framework:</strong> Key risk indicators
                and monitoring mechanisms
              </li>
              <li>
                <strong>Review Schedule:</strong> Frequency and triggers for
                risk assessment updates
              </li>
              <li>
                <strong>Reporting Structure:</strong> Risk reporting procedures
                and stakeholder communication
              </li>
              <li>
                <strong>Continuous Improvement:</strong> Lessons learned and
                process enhancement recommendations
              </li>
            </ul>

            <h4
              style={{
                color: SC3_PRIMARY,
                marginTop: "1.5rem",
                marginBottom: "0.5rem",
              }}
            >
              Appendices
            </h4>
            <ul>
              <li>
                <strong>Risk Register:</strong> Detailed risk inventory with
                full descriptions and assessments
              </li>
              <li>
                <strong>Risk Heat Maps:</strong> Visual representation of risk
                landscape and priorities
              </li>
              <li>
                <strong>Supporting Documentation:</strong> Evidence, data
                sources, and reference materials
              </li>
              <li>
                <strong>Stakeholder Feedback:</strong> Input and validation from
                key stakeholders
              </li>
              <li>
                <strong>Glossary:</strong> Definitions of risk management terms
                and concepts
              </li>
            </ul>

            <p style={{ marginTop: "1.5rem", fontStyle: "italic" }}>
              <strong>Note:</strong> The RAR structure should be tailored to
              organizational needs and regulatory requirements. Consider
              industry-specific risk factors and compliance obligations when
              developing the assessment framework.
            </p>
                </div>
              )}
            </div>
          </div>
        </details>
        </div>
      </div>
    </div>
  );
};

function WrappedRARForm() {
  return (
    <>
      <RARForm />
      <div
        style={{
          width: "100%",
          textAlign: "center",
          color: "#888",
          fontSize: "0.95em",
          marginTop: "2em",
          marginBottom: "0.5em",
          letterSpacing: "0.03em",
          userSelect: "none",
        }}
      >
        SC3 RAR Form {VERSION}
      </div>
    </>
  );
}

export default WrappedRARForm;
