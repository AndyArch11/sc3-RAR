import React, { useState } from "react";
import DistributionChart, { CumulativeDistributionChart } from './DistributionChart';
import RiskHeatMap from './RiskHeatMap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import "./RAR.css";

// SC3.com.au theme colours
const SC3_SECONDARY = "#0099cc"; // Bright blue

// Simple chart component for SLE/ARO/ALE visualization with cumulative risk cost
const QuantitativeValuesChart = ({ sle, aro, ale, formatCurrency }) => {
  const sleValue = parseFloat(sle) || 0;
  const aroValue = parseFloat(aro) || 0;
  const aleValue = parseFloat(ale) || 0;

  // Calculate cumulative risk costs over time (1, 5, 10 years)
  const chartData = [
    {
      period: 'Year 1',
      value: aleValue,
      displayValue: formatCurrency(aleValue),
      color: '#2196f3',
      description: 'Expected loss in first year'
    },
    {
      period: 'Year 5',
      value: aleValue * 5,
      displayValue: formatCurrency(aleValue * 5),
      color: '#ff9800',
      description: 'Cumulative expected loss over 5 years'
    },
    {
      period: 'Year 10',
      value: aleValue * 10,
      displayValue: formatCurrency(aleValue * 10),
      color: '#f44336',
      description: 'Cumulative expected loss over 10 years'
    }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rar-chart-tooltip">
          <p className="rar-tooltip-label">{`${label}`}</p>
          <p className="rar-tooltip-value">{data.displayValue}</p>
          <p className="rar-tooltip-description">{data.description}</p>
          {label === 'Year 1' && (
            <div className="rar-tooltip-breakdown">
              <small>SLE: {formatCurrency(sleValue)} × ARO: {aroValue}</small>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rar-quantitative-chart-container">
      <h4 className="rar-quantitative-chart-title">
        📊 Cumulative Risk Cost Over Time
      </h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="period" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              if (value >= 1000000) {
                return '$' + (value / 1000000).toFixed(1) + 'M';
              } else if (value >= 1000) {
                return '$' + (value / 1000).toFixed(0) + 'K';
              }
              return '$' + value.toLocaleString();
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="value" 
            fill="#2196f3"
            stroke="#333"
            strokeWidth={1}
          >
            {chartData.map((entry, index) => (
              <Bar key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      <div className="rar-quantitative-chart-summary">
        <div className="rar-chart-calculation-display">
          <div className="rar-calc-formula">
            <span className="rar-calc-component rar-calc-base">
              Base Calculation: SLE ({formatCurrency(sleValue)}) × ARO ({aroValue}) = ALE ({formatCurrency(aleValue)})
            </span>
          </div>
          
          <div className="rar-cumulative-breakdown">
            <h5>Cumulative Risk Cost Projections:</h5>
            <div className="rar-cumulative-items">
              <div className="rar-cumulative-item">
                <span className="rar-cumulative-period">1 Year:</span>
                <span className="rar-cumulative-value">{formatCurrency(aleValue)}</span>
                <span className="rar-cumulative-formula">({formatCurrency(aleValue)} × 1)</span>
              </div>
              <div className="rar-cumulative-item">
                <span className="rar-cumulative-period">5 Years:</span>
                <span className="rar-cumulative-value">{formatCurrency(aleValue * 5)}</span>
                <span className="rar-cumulative-formula">({formatCurrency(aleValue)} × 5)</span>
              </div>
              <div className="rar-cumulative-item">
                <span className="rar-cumulative-period">10 Years:</span>
                <span className="rar-cumulative-value">{formatCurrency(aleValue * 10)}</span>
                <span className="rar-cumulative-formula">({formatCurrency(aleValue)} × 10)</span>
              </div>
            </div>
          </div>
          
          <div className="rar-frequency-interpretation">
            Risk frequency: {aroValue < 1 
              ? `Expected to occur approximately once every ${Math.round(1/aroValue)} years`
              : `Expected to occur approximately ${aroValue} times per year`
            }
          </div>
          
          <div className="rar-investment-guidance">
            <strong>Investment Guidance:</strong> Risk mitigation investments up to {formatCurrency(aleValue * 5)}&nbsp;over 5 years could be cost-justified to reduce this risk.
          </div>
        </div>
      </div>
    </div>
  );
};

const InputForm = ({
    // Form state
    form,
    showValidation,
    validationErrors,
    
    // UI state
    rarFieldsOpen,
    setRarFieldsOpen,
    isEditingRisk,
    setIsEditingRisk,
    setSelectedRiskIndex,
    setRisksOpen,
    
    // Functions
    handleChange,
    handleSubmitRisk,
    handleUpdateRisk,
    clearRarFields,
    
    // Calculation functions
    calculateALE,
    calculateResidualALE,
    formatCurrency,
    getRiskColor,
    getStatusColor,
    getToday,
    getApproverPlaceholder,
    riskLevel,
    calculatedResidualRiskLevel,
    overallRiskScore,
    
    // Monte Carlo functions
    calculateMonteCarloExpectedLoss,
    calculateMonteCarloVaR,
    calculateMonteCarloResults,
    getMonteCarloResults,
    handleRefreshMonteCarloSimulation,
    getMonteCarloExpectedLossNumeric,
    
    // Residual Monte Carlo functions
    calculateResidualMonteCarloExpectedLoss,
    calculateResidualMonteCarloVaR,
    calculateResidualMonteCarloResults,
    getResidualMonteCarloExpectedLossNumeric,
    
    // Risk level functions
    getQuantitativeRiskLevel,
    getAdvancedQuantitativeRiskLevel,
    
    // Tab state management
    activeQualitativeTab,
    setActiveQualitativeTab,
    activeQuantitativeTab,
    setActiveQuantitativeTab,
    activeAdvancedQuantitativeTab,
    setActiveAdvancedQuantitativeTab,
    
    // Risk matrix
    riskMatrix
}) => {
  // State for VaR and EAL visibility toggles
  const [showVaR, setShowVaR] = useState(true);
  const [showEAL, setShowEAL] = useState(true);
  const [showPercentiles, setShowPercentiles] = useState(true);

  return (
    <form onSubmit={handleSubmitRisk}>
        {/* RAR Fields Section*/}
        <details className="rar-intro-details" open={rarFieldsOpen} onToggle={e => {setRarFieldsOpen(e.target.open); e.preventDefault();}}>
          <summary className="rar-intro-summary">
            RAR Fields{" "}
            {isEditingRisk && `(Editing: ${form.riskTitle || "Untitled Risk"})`}
          </summary>
          <div>
            <p>
              Complete the following fields to document the risk assessment
              details.
            </p>

            {/* Risk Details Section */}
            <fieldset className="rar-fieldset">
              <legend className="rar-legend">Risk Details</legend>
              
              <div className="rar-form-note">
                Fields marked with <span className="rar-required">*</span> are mandatory
              </div>

              <table className="rar-form-table">
                <tbody>
                  <tr title="A unique identifier for the risk (e.g. R001, R002)">
                    <td className="rar-form-label-cell">
                      <label className="rar-form-label">
                        Risk ID: <span className="rar-required">*</span>
                      </label>
                      {showValidation && validationErrors.riskId && (
                        <div className="rar-validation-error">
                          {validationErrors.riskId}
                        </div>
                      )}
                    </td>
                    <td className="rar-form-input-cell">
                      <input
                        type="text"
                        name="riskId"
                        placeholder="e.g., R001, R002"
                        value={form.riskId}
                        onChange={handleChange}
                        className={`rar-input ${showValidation && validationErrors.riskId ? 'error' : ''}`}
                      />
                    </td>
                  </tr>

                  <tr title="A concise name or description of the risk">
                    <td className="rar-form-label-cell">
                      <label className="rar-form-label">
                        Risk Title: <span className="rar-required">*</span>
                      </label>
                      {showValidation && validationErrors.riskTitle && (
                        <div className="rar-validation-error">
                          {validationErrors.riskTitle}
                        </div>
                      )}
                    </td>
                    <td className="rar-form-input-cell">
                      <input
                        type="text"
                        name="riskTitle"
                        placeholder="Concise name or description of the risk"
                        value={form.riskTitle}
                        onChange={handleChange}
                        className={`rar-input ${showValidation && validationErrors.riskTitle ? 'error' : ''}`}
                      />
                    </td>
                  </tr>

                  <tr title="Risk assessment framework used for assessing this risk"> 
                    <td className="rar-form-label-cell">
                      <label className="rar-form-label">
                        Risk Assessment Framework:
                      </label>
                    </td>
                    <td className="rar-form-input-cell">
                      <select
                        name="framework"
                        value={form.framework}
                        onChange={handleChange}
                        className="rar-select"
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
                        <option value="dread">
                          DREAD (Damage, Reproducibility, Exploitability,
                          Affected Users, and Discoverability)
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
                    <td className="rar-form-label-cell">
                      <label className="rar-form-label">
                        Risk Category:
                      </label>
                    </td>
                    <td className="rar-form-input-cell">
                      <select
                        name="riskCategory"
                        value={form.riskCategory}
                        onChange={handleChange}
                        className="rar-select"
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
                    <td className="rar-form-label-cell">
                      <label className="rar-form-label">
                        Risk Description:
                      </label>
                    </td>
                    <td className="rar-form-input-cell">
                      <textarea
                        name="riskDescription"
                        value={form.riskDescription}
                        onChange={handleChange}
                        placeholder="Detailed explanation of the risk scenario"
                        rows="4"
                        className="rar-textarea"
                      />
                    </td>
                  </tr>

                  <tr title="Name of the person conducting the risk assessment">
                    <td className="rar-form-label-cell">
                      <label className="rar-form-label">Assessor:</label>
                    </td>
                    <td className="rar-form-input-cell">
                      <input
                        type="text"
                        name="assessor"
                        value={form.assessor}
                        onChange={handleChange}
                        placeholder="Name of the person conducting the risk assessment"
                        className="rar-input"
                      />
                    </td>
                  </tr>

                  <tr title="Date when the risk was first assessed">
                    <td className="rar-form-label-cell">
                      <label className="rar-form-label">
                        Assessed Date:
                      </label>
                    </td>
                    <td className="rar-form-input-cell">
                      <input
                        type="date"
                        name="assessedDate"
                        value={form.assessedDate}
                        onChange={handleChange}
                        className="rar-input rar-input-date"
                      />
                    </td>
                  </tr>

                  <tr title="Individual or role responsible for managing the risk">
                    <td className="rar-form-label-cell">
                      <label className="rar-form-label">Risk Owner:</label>
                    </td>
                    <td className="rar-form-input-cell">
                      <input
                        type="text"
                        name="riskOwner"
                        value={form.riskOwner}
                        onChange={handleChange}
                        placeholder="Individual or role responsible for managing the risk"
                        className="rar-input"
                      />
                    </td>
                  </tr>

                  <tr title="Source of the threat that could exploit the vulnerability">
                    <td className="rar-form-label-cell">
                      <label className="rar-form-label">
                        Threat Source:
                      </label>
                    </td>
                    <td className="rar-form-input-cell">
                      <select
                        name="threatSource"
                        value={form.threatSource}
                        onChange={handleChange}
                        className="rar-select"
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
                    <td className="rar-form-label-cell">
                      <label className="rar-form-label">
                        Vulnerability:
                      </label>
                    </td>
                    <td className="rar-form-input-cell">
                      <textarea
                        name="vulnerability"
                        value={form.vulnerability}
                        onChange={handleChange}
                        placeholder="Weakness or gap that enables the risk"
                        rows="3"
                        className="rar-textarea"
                      />
                    </td>
                  </tr>

                  <tr title="Existing controls in place to manage the risk">
                    <td className="rar-form-label-cell">
                      <label className="rar-form-label">
                        Current Controls:
                      </label>
                    </td>
                    <td className="rar-form-input-cell">
                      <textarea
                        name="currentControls"
                        value={form.currentControls}
                        onChange={handleChange}
                        placeholder="Existing measures in place to manage the risk"
                        rows="3"
                        className="rar-textarea"
                      />
                    </td>
                  </tr>

                  <tr title="Assessment of the effectiveness of the current controls">
                    <td className="rar-form-label-cell">
                      <label className="rar-form-label">
                        Control Effectiveness:
                      </label>
                    </td>
                    <td className="rar-form-input-cell">
                      <select
                        name="controlEffectiveness"
                        value={form.controlEffectiveness}
                        onChange={handleChange}
                        className="rar-select"
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
            <fieldset className="rar-fieldset rar-fieldset-assessment">
              <legend className="rar-legend rar-legend-assessment">
                Risk Assessment
              </legend>

              <table className="rar-form-table">
                <tbody>
                  <tr title="Type of risk assessment being conducted (Qualitative or Quantitative)">
                    <td className="rar-form-label-cell">
                      <label className="rar-form-label">
                        Assessment Type:
                      </label>
                    </td>
                    <td className="rar-form-input-cell">
                      <div className="rar-radio-group">
                        <label className="rar-radio-label">
                          <input
                            type="radio"
                            name="assessmentType"
                            value="qualitative"
                            checked={form.assessmentType === "qualitative"}
                            onChange={handleChange}
                            className="rar-radio"
                          />
                          <span>Qualitative</span>
                        </label>
                        <label className="rar-radio-label">
                          <input
                            type="radio"
                            name="assessmentType"
                            value="quantitative"
                            checked={form.assessmentType === "quantitative"}
                            onChange={handleChange}
                            className="rar-radio"
                          />
                          <span>Quantitative</span>
                        </label>
                        <label className="rar-radio-label">
                          <input
                            type="radio"
                            name="assessmentType"
                            value="advancedQuantitative"
                            checked={form.assessmentType === "advancedQuantitative"}
                            onChange={handleChange}
                            className="rar-radio"
                          />
                          <span>Advanced Quantitative (Monte Carlo)</span>
                        </label>
                      </div>
                    </td>
                  </tr>

                  {form.assessmentType === "qualitative" && (
                    <>
                      {/* Tab Navigation */}
                      <tr>
                        <td colSpan="2">
                          <div className="rar-qualitative-tabs">
                            <button
                              type="button"
                              className={`rar-qualitative-tab ${activeQualitativeTab === 'risk' ? 'active' : ''}`}
                              onClick={() => setActiveQualitativeTab('risk')}
                            >
                              Risk
                            </button>
                            <button
                              type="button"
                              className={`rar-qualitative-tab ${activeQualitativeTab === 'residualRisk' ? 'active' : ''}`}
                              onClick={() => setActiveQualitativeTab('residualRisk')}
                            >
                              Residual Risk
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Risk Tab Content */}
                      {activeQualitativeTab === 'risk' && (
                        <>
                          <tr title="Likelihood rating of the risk occurring (1-5 scale)" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">
                                Likelihood Rating:
                              </label>
                            </td>
                            <td className="rar-form-input-cell">
                              <select
                                name="likelihood"
                                value={form.likelihood}
                                onChange={handleChange}
                                className="rar-select"
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

                          <tr title="Impact rating of the risk if it occurs (1-5 scale)" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">
                                Impact Rating:
                              </label>
                            </td>
                            <td className="rar-form-input-cell">
                              <select
                                name="impact"
                                value={form.impact}
                                onChange={handleChange}
                                className="rar-select"
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

                          <tr title="Overall risk score calculated from likelihood and impact ratings" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">
                                Overall Risk Score:
                              </label>
                            </td>
                            <td className="rar-form-input-cell">
                              <input
                                type="text"
                                name="overallRiskScore"
                                value={
                                  overallRiskScore > 0
                                    ? overallRiskScore.toString()
                                    : ""
                                }
                                readOnly
                                className="rar-input rar-input-readonly"
                              />
                              <small className="rar-help-text">
                                Calculated as: Likelihood ({form.likelihood || 0}) +
                                Impact ({form.impact || 0}) = {overallRiskScore}
                              </small>
                            </td>
                          </tr>

                          <tr title="Risk level based on overall risk score" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">Risk Level:</label>
                            </td>
                            <td className="rar-form-input-cell">
                              <input
                                type="text"
                                value={riskLevel}
                                readOnly
                                className="rar-input rar-input-risk-level"
                                style={{
                                  border: `2px solid ${getRiskColor(riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1))}`,
                                  backgroundColor: getRiskColor(
                                    riskLevel.charAt(0).toUpperCase() +
                                      riskLevel.slice(1),
                                  ),
                                  color: '#fff',
                                }}
                              />
                              <small className="rar-help-text">
                                Calculated from Overall Risk Score: {riskLevel}
                              </small>
                            </td>
                          </tr>
                        </>
                      )}                      

                      {/* Residual Risk Tab Content */}
                      {activeQualitativeTab === 'residualRisk' && (
                        <>
                          <tr title="Current risk level for comparison reference" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">Current Risk Level:</label>
                            </td>
                            <td className="rar-form-input-cell">
                              <input
                                type="text"
                                value={riskLevel || 'Not set'}
                                readOnly
                                className="rar-input rar-input-readonly rar-input-risk-level"
                                style={{
                                  border: `2px solid ${riskLevel ? getRiskColor(riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)) : '#ddd'}`,
                                  backgroundColor: riskLevel ? getRiskColor(
                                    riskLevel.charAt(0).toUpperCase() +
                                      riskLevel.slice(1),
                                  ) : '#f8f9fa',
                                  color: riskLevel ? '#fff' : '#6c757d',
                                }}
                              />
                              <small className="rar-help-text">
                                Reference: Current risk level from Risk tab for comparison
                              </small>
                            </td>
                          </tr>

                          <tr title="Strategy for treating the identified risk" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">Treatment Strategy:</label>
                            </td>
                            <td className="rar-form-input-cell">
                              <select
                                name="treatmentStrategy"
                                value={form.treatmentStrategy}
                                onChange={handleChange}
                                className="rar-select"
                              >
                                <option value="">Select Treatment Strategy</option>
                                <option value="avoid">Avoid</option>
                                <option value="mitigate">Mitigate</option>
                                <option value="transfer">Transfer</option>
                                <option value="accept">Accept</option>
                              </select>
                            </td>
                          </tr>

                          <tr title="Recommended actions to mitigate the risk" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">Recommended Actions:</label>
                            </td>
                            <td className="rar-form-input-cell">
                              <textarea
                                name="recommendedActions"
                                value={form.recommendedActions}
                                onChange={handleChange}
                                rows="3"
                                className="rar-textarea-actions"
                                placeholder="Describe specific actions to mitigate this risk..."
                              />
                            </td>
                          </tr>

                          <tr title="Person responsible for implementing the recommended actions" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">Action Owner:</label>
                            </td>
                            <td className="rar-form-action-input-cell">
                              <input
                                type="text"
                                name="actionOwner"
                                value={form.actionOwner}
                                onChange={handleChange}
                                className="rar-input-action"
                                placeholder="Person responsible for implementing the actions?"
                              />
                            </td>
                          </tr>

                          <tr title="Target date for implementing the recommended actions" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">Target Date:</label>
                            </td>
                            <td className="rar-form-action-input-cell">
                              <input
                                type="date"
                                name="targetDate"
                                value={form.targetDate}
                                onChange={handleChange}
                                className="rar-input rar-input-date"
                              />
                            </td>
                          </tr>

                          <tr title="Likelihood of the risk occurring after implementing controls" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">
                                Residual Risk Likelihood:
                              </label>
                            </td>
                            <td className="rar-form-action-input-cell">
                              <select
                                name="residualLikelihood"
                                value={form.residualLikelihood}
                                onChange={handleChange}
                                className="rar-select-action"
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

                          <tr title="Risk impact after implementing controls" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">
                                Residual Risk Impact:
                              </label>
                            </td>
                            <td className="rar-form-action-input-cell">
                              <select
                                name="residualImpact"
                                value={form.residualImpact}
                                onChange={handleChange}
                                    className="rar-select-action"
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

                          <tr title="Residual risk level after implementing controls" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">
                                Residual Risk:
                              </label>
                            </td>
                            <td className="rar-form-action-input-cell">
                              {form.assessmentType === "qualitative" ? (
                                <>
                                  <input
                                    type="text"
                                    value={calculatedResidualRiskLevel}
                                    readOnly
                                    className="rar-input rar-input-risk-level"
                                    style={{
                                      border: `2px solid ${getRiskColor(calculatedResidualRiskLevel.charAt(0).toUpperCase() + calculatedResidualRiskLevel.slice(1))}`,
                                      backgroundColor: getRiskColor(
                                        calculatedResidualRiskLevel
                                          .charAt(0)
                                          .toUpperCase() +
                                          calculatedResidualRiskLevel.slice(1),
                                      ),
                                    }}
                                  />
                                  <small className="rar-help-text">
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
                                    className="rar-select rar-select-risk-level"
                                    style={{
                                      border: `2px solid ${getRiskColor(form.residualRisk.charAt(0).toUpperCase() + form.residualRisk.slice(1))}`,
                                      backgroundColor: getRiskColor(
                                        form.residualRisk.charAt(0).toUpperCase() +
                                          form.residualRisk.slice(1),
                                      ),
                                      color: form.residualRisk ? "#fff" : "#333",
                                    }}
                                  >
                                    <option value="">Select Residual Risk Level</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="extreme">Extreme</option>
                                  </select>
                                  <small className="rar-help-text">
                                    Manually select based on {form.assessmentType === "advancedQuantitative" ? "Monte Carlo analysis" : "quantitative analysis"}
                                  </small>
                                </>
                              )}
                            </td>
                          </tr>
                        </>
                      )}

                    </>
                  )}

                  {form.assessmentType === "quantitative" && (
                    <>
                      <tr>
                        <td colSpan="2">
                          <div className="rar-qualitative-tabs">
                            <button
                              type="button"
                              className={`rar-qualitative-tab ${activeQuantitativeTab === 'risk' ? 'active' : ''}`}
                              onClick={() => setActiveQuantitativeTab('risk')}
                            >
                              Risk
                            </button>
                            <button
                              type="button"
                              className={`rar-qualitative-tab ${activeQuantitativeTab === 'residualRisk' ? 'active' : ''}`}
                              onClick={() => setActiveQuantitativeTab('residualRisk')}
                            >
                              Residual Risk
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Risk Tab Content */}
                      {activeQuantitativeTab === 'risk' && (
                        <>
                          <tr title="Single Loss Expectancy (SLE) - expected loss from a single incident" className="rar-tab-specific-content">
                        <td className="rar-form-label-cell">
                          <label className="rar-form-label">
                            Single Loss Expectancy (SLE):
                          </label>
                        </td>
                        <td className="rar-form-input-cell">
                          <div className="rar-currency-input">
                            <select
                              name="sleCurrency"
                              value={form.sleCurrency}
                              onChange={handleChange}
                              className="rar-select rar-select-currency"
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
                              placeholder="Auto-populated from Impact, or enter manually"
                              name="sle"
                              value={form.sle}
                              onChange={handleChange}
                              className="rar-input rar-input-currency"
                            />
                          </div>
                        </td>
                      </tr>

                      <tr title="Annual Rate of Occurrence (ARO) - expected frequency of incidents per year" className="rar-tab-specific-content">
                        <td className="rar-form-label-cell">
                          <label className="rar-form-label">
                            Annual Rate of Occurrence (ARO):
                          </label>
                        </td>
                        <td className="rar-form-input-cell">
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Auto-populated from Likelihood, or enter manually"
                            name="aro"
                            value={form.aro}
                            onChange={handleChange}
                            className="rar-input"
                          />
                        </td>
                      </tr>

                      <tr title="Annual Loss Expectancy (ALE) - expected loss per year" className="rar-tab-specific-content">
                        <td className="rar-form-label-cell">
                          <label className="rar-form-label">
                            Annual Loss Expectancy (ALE):
                          </label>
                        </td>
                        <td className="rar-form-input-cell">
                          <input
                            type="text"
                            name="ale"
                            value={formatCurrency(calculateALE(form), form.sleCurrency)}
                            readOnly
                            className="rar-input rar-input-readonly"
                          />
                          <small className="rar-help-text">
                            Calculated as: SLE × ARO ={" "}
                            {formatCurrency(calculateALE(form), form.sleCurrency)}
                          </small>
                        </td>
                      </tr>
                      {form.sle && form.aro && calculateALE(form) > 0 && (
                        <tr className="rar-tab-specific-content">
                          <td colSpan="2" className="rar-form-input-cell">
                            <QuantitativeValuesChart
                              sle={form.sle}
                              aro={form.aro}
                              ale={calculateALE(form)}
                              formatCurrency={(value) => formatCurrency(value, form.sleCurrency)}
                            />
                          </td>
                        </tr>
                      )}

                      <tr title="Risk level based on quantitative assessment" className="rar-tab-specific-content">
                        <td className="rar-form-label-cell">
                          <label className="rar-form-label">Risk Level:</label>
                        </td>
                        <td className="rar-form-input-cell">
                          <select
                            name="manualRiskLevel"
                            value={form.manualRiskLevel}
                            onChange={handleChange}
                            className="rar-select rar-select-risk-level"
                            style={{
                              border: `2px solid ${getRiskColor(form.manualRiskLevel.charAt(0).toUpperCase() + form.manualRiskLevel.slice(1))}`,
                              backgroundColor: getRiskColor(
                                form.manualRiskLevel.charAt(0).toUpperCase() +
                                  form.manualRiskLevel.slice(1),
                              ),
                              color: form.manualRiskLevel ? "#fff" : "#333",
                            }}
                          >
                            <option value="">Select Risk Level</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="extreme">Extreme</option>
                          </select>
                          <small className="rar-help-text">
                            Automatically calculated based on ALE and threshold values
                          </small>
                        </td>
                      </tr>
                        </>
                      )}

                      {/* Residual Risk Tab Content */}
                      {activeQuantitativeTab === 'residualRisk' && (
                        <>
                          <tr title="Current risk level for comparison reference" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">Current Risk Level:</label>
                            </td>
                            <td className="rar-form-input-cell">
                              <input
                                type="text"
                                value={form.manualRiskLevel || 'Not set'}
                                readOnly
                                className="rar-input rar-input-readonly rar-input-risk-level"
                                style={{
                                  border: `2px solid ${form.manualRiskLevel ? getRiskColor(form.manualRiskLevel.charAt(0).toUpperCase() + form.manualRiskLevel.slice(1)) : '#ddd'}`,
                                  backgroundColor: form.manualRiskLevel ? getRiskColor(
                                    form.manualRiskLevel.charAt(0).toUpperCase() +
                                      form.manualRiskLevel.slice(1),
                                  ) : '#f8f9fa',
                                  color: form.manualRiskLevel ? '#fff' : '#6c757d',
                                }}
                              />
                              <small className="rar-help-text">
                                Reference: Current risk level from Risk tab for comparison
                              </small>
                            </td>
                          </tr>

                          <tr title="Strategy for treating the identified risk" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">Treatment Strategy:</label>
                            </td>
                            <td className="rar-form-input-cell">
                              <select
                                name="treatmentStrategy"
                                value={form.treatmentStrategy}
                                onChange={handleChange}
                                className="rar-select"
                              >
                                <option value="">Select Treatment Strategy</option>
                                <option value="avoid">Avoid</option>
                                <option value="mitigate">Mitigate</option>
                                <option value="transfer">Transfer</option>
                                <option value="accept">Accept</option>
                              </select>
                            </td>
                          </tr>

                          <tr title="Recommended actions to mitigate the risk" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">Recommended Actions:</label>
                            </td>
                            <td className="rar-form-input-cell">
                              <textarea
                                name="recommendedActions"
                                value={form.recommendedActions}
                                onChange={handleChange}
                                rows="3"
                                className="rar-textarea-actions"
                                placeholder="Describe specific actions to mitigate this risk..."
                              />
                            </td>
                          </tr>

                          <tr title="Person responsible for implementing the recommended actions" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">Action Owner:</label>
                            </td>
                            <td className="rar-form-action-input-cell">
                              <input
                                type="text"
                                name="actionOwner"
                                value={form.actionOwner}
                                onChange={handleChange}
                                className="rar-input-action"
                                placeholder="Person responsible for implementing the actions?"
                              />
                            </td>
                          </tr>

                          <tr title="Target date for implementing the recommended actions" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">Target Date:</label>
                            </td>
                            <td className="rar-form-action-input-cell">
                              <input
                                type="date"
                                name="targetDate"
                                value={form.targetDate}
                                onChange={handleChange}
                                className="rar-input rar-input-date"
                              />
                            </td>
                          </tr>

                          <tr title="Residual Single Loss Expectancy (SLE) after implementing controls" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">
                                Residual Single Loss Expectancy (SLE):
                              </label>
                            </td>
                            <td className="rar-form-input-cell">
                              <div className="rar-currency-input">
                                <select
                                  name="residualSleCurrency"
                                  value={form.residualSleCurrency}
                                  onChange={handleChange}
                                  className="rar-select rar-select-currency"
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
                                  placeholder="Auto-populated from Residual Impact, or enter manually"
                                  name="residualSle"
                                  value={form.residualSle}
                                  onChange={handleChange}
                                  className="rar-input rar-input-currency"
                                />
                              </div>
                            </td>
                          </tr>

                          <tr title="Residual Annual Rate of Occurrence (ARO) after implementing controls" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">
                                Residual Annual Rate of Occurrence (ARO):
                              </label>
                            </td>
                            <td className="rar-form-input-cell">
                              <input
                                type="number"
                                step="0.1"
                                placeholder="Auto-populated from Residual Likelihood, or enter manually"
                                name="residualAro"
                                value={form.residualAro}
                                onChange={handleChange}
                                className="rar-input"
                              />
                            </td>
                          </tr>

                          <tr title="Residual Annual Loss Expectancy (ALE) after implementing controls" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">
                                Residual Annual Loss Expectancy (ALE):
                              </label>
                            </td>
                            <td className="rar-form-input-cell">
                              <input
                                type="text"
                                name="residualAle"
                                value={formatCurrency(calculateResidualALE(form), form.residualSleCurrency)}
                                readOnly
                                className="rar-input rar-input-readonly"
                              />
                              <small className="rar-help-text">
                                Calculated as: Residual SLE × Residual ARO ={" "}
                                {formatCurrency(calculateResidualALE(form), form.residualSleCurrency)}
                              </small>
                            </td>
                          </tr>

                          {form.residualSle && form.residualAro && calculateResidualALE(form) > 0 && (
                            <tr className="rar-tab-specific-content">
                              <td colSpan="2" className="rar-form-input-cell">
                                <QuantitativeValuesChart
                                  sle={form.residualSle}
                                  aro={form.residualAro}
                                  ale={calculateResidualALE(form)}
                                  formatCurrency={(value) => formatCurrency(value, form.residualSleCurrency)}
                                />
                              </td>
                            </tr>
                          )}

                          <tr title="Residual risk level after implementing controls" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">
                                Residual Risk:
                              </label>
                            </td>
                            <td className="rar-form-action-input-cell">
                              <input
                                type="text"
                                value={getQuantitativeRiskLevel(calculateResidualALE(form))}
                                readOnly
                                className="rar-input rar-input-readonly rar-input-risk-level"
                                style={{
                                  border: `2px solid ${getRiskColor(getQuantitativeRiskLevel(calculateResidualALE(form)).charAt(0).toUpperCase() + getQuantitativeRiskLevel(calculateResidualALE(form)).slice(1))}`,
                                  backgroundColor: getRiskColor(
                                    getQuantitativeRiskLevel(calculateResidualALE(form)).charAt(0).toUpperCase() +
                                      getQuantitativeRiskLevel(calculateResidualALE(form)).slice(1),
                                  ),
                                  color: "#fff",
                                }}
                              />
                              <small className="rar-help-text">
                                Automatically calculated based on Residual ALE and threshold values
                              </small>
                            </td>
                          </tr>
                        </>
                      )}
                    </>
                  )}

                  {form.assessmentType === "advancedQuantitative" && (
                    <> 
                      <tr>
                        <td colSpan="2" className="rar-form-input-cell">
                          <div className="rar-simulation-header">
                            <div className="rar-simulation-header-content">
                              <div>
                                <h4 className="rar-simulation-title">
                                  Monte Carlo Simulation Parameters
                                </h4>
                                <p className="rar-simulation-description">
                                  Configure the parameters for Monte Carlo simulation to model risk uncertainty and generate probabilistic risk estimates.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={handleRefreshMonteCarloSimulation}
                                className="rar-btn-refresh"
                                title="Re-run Monte Carlo simulation with current parameters"
                              >
                                🔄 Refresh
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                                     
                      {/* Tab Navigation */}
                      <tr>
                        <td colSpan="2">
                          <div className="rar-qualitative-tabs">
                            <button
                              type="button"
                              className={`rar-qualitative-tab ${activeAdvancedQuantitativeTab === 'risk' ? 'active' : ''}`}
                              onClick={() => setActiveAdvancedQuantitativeTab('risk')}
                            >
                              Risk
                            </button>
                            <button
                              type="button"
                              className={`rar-qualitative-tab ${activeAdvancedQuantitativeTab === 'residualRisk' ? 'active' : ''}`}
                              onClick={() => setActiveAdvancedQuantitativeTab('residualRisk')}
                            >
                              Residual Risk
                            </button>
                          </div>
                        </td>
                      </tr>     

                      {/* Risk Tab Content */}
                      {activeAdvancedQuantitativeTab === 'risk' && (
                        <>
                          <tr title="Number of simulation iterations (typically 10,000 or more)" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">Simulation Iterations:</label>
                            </td>
                          <td className="rar-form-input-cell">
                            <input
                              type="number"
                              placeholder="Number of iterations (e.g., 10000)"
                              name="monteCarloIterations"
                              value={form.monteCarloIterations}
                              onChange={handleChange}
                              min="1000"
                              max="100000"
                              className="rar-input"
                            />
                          </td>
                        </tr>

                        <tr title="Loss distribution type for Monte Carlo simulation" className="rar-tab-specific-content">
                          <td className="rar-form-label-cell">
                            <label className="rar-form-label">Loss Distribution:</label>
                          </td>
                          <td className="rar-form-input-cell">
                            <select
                              name="lossDistribution"
                              value={form.lossDistribution}
                              onChange={handleChange}
                              className="rar-select"
                            >
                              <option value="triangular">Triangular</option>
                              <option value="normal">Normal</option>
                              <option value="lognormal">Log-Normal</option>
                              <option value="uniform">Uniform</option>
                              <option value="beta">Beta</option>
                            </select>
                            {form.lossDistribution && (
                              <small className="rar-help-text rar-distribution-info">
                                <strong>Use case:</strong>{" "}
                                {form.lossDistribution === "triangular" && 
                                  "Commonly used when you have minimum, most likely, and maximum loss estimates. Ideal for expert judgment scenarios where three-point estimates are available."}
                                {form.lossDistribution === "normal" && 
                                  "Used for losses that cluster around a mean value with symmetric spread. Suitable for well-understood risks with historical data showing bell-curve patterns."}
                                {form.lossDistribution === "lognormal" && 
                                  "Best for losses that are always positive and right-skewed (most losses are small, but occasional large losses occur). Uses natural logarithm (ln, base e). Parameters: μ (mu) = 1-6 and σ (sigma) = 0.3-1.2 for reasonable results. The fields below represent parameters of the underlying normal distribution, not the log-normal mean/std."}
                                {form.lossDistribution === "uniform" && 
                                  "Used when all loss values within a range are equally likely. Appropriate when there's complete uncertainty about loss magnitude within known bounds."}
                                {form.lossDistribution === "beta" && 
                                  "Flexible distribution for bounded losses (between min/max) with various shapes. Useful for modeling expert opinions with different confidence levels."}
                              </small>
                            )}
                          </td>
                        </tr>

                        {/* Distribution-specific Loss Parameters */}
                        {(form.lossDistribution === "triangular") && (
                          <>
                            <tr title="Minimum loss value for the distribution" className="rar-tab-specific-content">
                              <td className="rar-form-label-cell">
                                <label className="rar-form-label">Minimum Loss:</label>
                              </td>
                              <td className="rar-form-input-cell">
                                <div className="rar-currency-input">
                                  <select
                                    name="sleCurrency"
                                    value={form.sleCurrency}
                                    onChange={handleChange}
                                    className="rar-select rar-select-currency"
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
                                    placeholder="Minimum loss value"
                                    name="minLoss"
                                    value={form.minLoss}
                                    onChange={handleChange}
                                    className="rar-input rar-input-currency"
                                  />
                                </div>
                              </td>
                            </tr>

                            <tr title="Most likely loss value for the distribution" className="rar-tab-specific-content">
                              <td className="rar-form-label-cell">
                                <label className="rar-form-label">Most Likely Loss (mode):</label>
                              </td>
                              <td className="rar-form-input-cell">
                                <div className="rar-currency-input">
                                  <select
                                    name="sleCurrency"
                                    value={form.sleCurrency}
                                    onChange={handleChange}
                                    className="rar-select rar-select-currency"
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
                                    placeholder="Most likely loss value"
                                    name="mostLikelyLoss"
                                    value={form.mostLikelyLoss}
                                    onChange={handleChange}
                                    className="rar-input rar-input-currency"
                                  />
                                </div>
                              </td>
                            </tr>

                            <tr title="Maximum loss value for the distribution" className="rar-tab-specific-content">
                              <td className="rar-form-label-cell">
                                <label className="rar-form-label">Maximum Loss:</label>
                              </td>
                              <td className="rar-form-input-cell">
                                <div className="rar-currency-input">
                                  <select
                                    name="sleCurrency"
                                    value={form.sleCurrency}
                                    onChange={handleChange}
                                    className="rar-select rar-select-currency"
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
                                    placeholder="Maximum loss value"
                                    name="maxLoss"
                                    value={form.maxLoss}
                                    onChange={handleChange}
                                    className="rar-input rar-input-currency"
                                  />
                                </div>
                              </td>
                            </tr>
                            <tr className="rar-tab-specific-content">
                              <td colSpan="2" className="rar-form-input-cell">
                                <DistributionChart
                                  distributionType="triangular"
                                  parameters={{
                                    min: parseFloat(form.minLoss) || 0,
                                    mode: parseFloat(form.mostLikelyLoss) || 0,
                                    max: parseFloat(form.maxLoss) || 0
                                  }}
                                  title="Loss Distribution - Triangular"
                                  formatCurrency={(value) => formatCurrency(value, form.sleCurrency)}
                                />
                              </td>
                            </tr>
                            <tr className="rar-tab-specific-content">
                              <td colSpan="2" className="rar-form-input-cell">
                                <CumulativeDistributionChart
                                  distributionType="triangular"
                                  parameters={{
                                    min: parseFloat(form.minLoss) || 0,
                                    mode: parseFloat(form.mostLikelyLoss) || 0,
                                    max: parseFloat(form.maxLoss) || 0
                                  }}
                                  title="Loss Distribution - Triangular"
                                  formatCurrency={(value) => formatCurrency(value, form.sleCurrency)}
                                />
                              </td>
                            </tr>
                          </>
                        )}

                        {(form.lossDistribution === "normal" || form.lossDistribution === "lognormal") && (
                          <>
                            <tr title="Mean (average) loss value for the distribution" className="rar-tab-specific-content">
                              <td className="rar-form-label-cell">
                                <label className="rar-form-label">
                                  {form.lossDistribution === "lognormal" ? "μ (Mu - Underlying Normal Mean):" : "Mean Loss:"}
                                </label>
                              </td>
                              <td className="rar-form-input-cell">
                                <div className="rar-currency-input">
                                  <select
                                    name="sleCurrency"
                                    value={form.sleCurrency}
                                    onChange={handleChange}
                                    className="rar-select rar-select-currency"
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
                                    placeholder={form.lossDistribution === "lognormal" ? "μ (mu) value (e.g., 2-5)" : "Mean loss value"}
                                    name="lossMean"
                                    value={form.lossMean}
                                    onChange={handleChange}
                                    className="rar-input rar-input-currency"
                                  />
                                </div>
                              </td>
                            </tr>

                            <tr title="Standard deviation of loss values" className="rar-tab-specific-content">
                              <td className="rar-form-label-cell">
                                <label className="rar-form-label">
                                  {form.lossDistribution === "lognormal" ? "σ (Sigma - Underlying Normal Std Dev):" : "Loss Standard Deviation:"}
                                </label>
                              </td>
                              <td className="rar-form-input-cell">
                                <div className="rar-currency-input">
                                  <select
                                    name="sleCurrency"
                                    value={form.sleCurrency}
                                    onChange={handleChange}
                                    className="rar-select rar-select-currency"
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
                                    placeholder={form.lossDistribution === "lognormal" ? "σ (sigma) value (e.g., 0.3-1.2)" : "Standard deviation"}
                                    name="lossStdDev"
                                    value={form.lossStdDev}
                                    onChange={handleChange}
                                    className="rar-input rar-input-currency"
                                  />
                                </div>
                              </td>
                            </tr>
                            
                            {/* Log-Normal Distribution Statistics Display */}
                            {form.lossDistribution === "lognormal" && form.lossMean && form.lossStdDev && (
                              <tr className="rar-tab-specific-content">
                                <td colSpan="2" className="rar-form-input-cell">
                                  <div className="rar-lognormal-stats">
                                    <h5 style={{ margin: '10px 0 5px 0', color: '#0099cc' }}>
                                      📊 Resulting Log-Normal Distribution:
                                    </h5>
                                    <div style={{ 
                                      display: 'grid', 
                                      gridTemplateColumns: '1fr 1fr', 
                                      gap: '10px',
                                      padding: '10px',
                                      backgroundColor: '#f8f9fa',
                                      border: '1px solid #dee2e6',
                                      borderRadius: '5px',
                                      fontSize: '14px'
                                    }}>
                                      <div>
                                        <strong>Actual Mean:</strong><br/>
                                        {(() => {
                                          const mu = parseFloat(form.lossMean) || 0;
                                          const sigma = parseFloat(form.lossStdDev) || 1;
                                          const actualMean = Math.exp(mu + (sigma * sigma) / 2);
                                          return formatCurrency(actualMean, form.sleCurrency);
                                        })()}
                                      </div>
                                      <div>
                                        <strong>Actual Std Dev:</strong><br/>
                                        {(() => {
                                          const mu = parseFloat(form.lossMean) || 0;
                                          const sigma = parseFloat(form.lossStdDev) || 1;
                                          const actualVariance = (Math.exp(sigma * sigma) - 1) * Math.exp(2 * mu + sigma * sigma);
                                          const actualStdDev = Math.sqrt(actualVariance);
                                          return formatCurrency(actualStdDev, form.sleCurrency);
                                        })()}
                                      </div>
                                      <div>
                                        <strong>Median:</strong><br/>
                                        {(() => {
                                          const mu = parseFloat(form.lossMean) || 0;
                                          const median = Math.exp(mu);
                                          return formatCurrency(median, form.sleCurrency);
                                        })()}
                                      </div>
                                      <div>
                                        <strong>Mode:</strong><br/>
                                        {(() => {
                                          const mu = parseFloat(form.lossMean) || 0;
                                          const sigma = parseFloat(form.lossStdDev) || 1;
                                          const mode = Math.exp(mu - sigma * sigma);
                                          return formatCurrency(mode, form.sleCurrency);
                                        })()}
                                      </div>
                                    </div>
                                    <small style={{ color: '#6c757d', fontStyle: 'italic' }}>
                                      These are the actual statistics of the log-normal distribution created from your μ and σ parameters.
                                    </small>
                                  </div>
                                </td>
                              </tr>
                            )}
                              <tr className="rar-tab-specific-content">
                              <td colSpan="2" className="rar-form-input-cell">
                                {form.lossDistribution === 'lognormal' && (
                                  <div style={{ 
                                    backgroundColor: '#f0f8ff', 
                                    padding: '8px', 
                                    borderRadius: '4px', 
                                    marginBottom: '10px',
                                    fontSize: '12px',
                                    color: '#0066cc'
                                  }}>
                                    <strong>Graph Range Info:</strong> The chart shows the 1st to 99th percentile range of your log-normal distribution. With μ={parseFloat(form.lossMean) || 0} and σ={parseFloat(form.lossStdDev) || 1}, this covers roughly {formatCurrency(Math.exp((parseFloat(form.lossMean) || 0) + (parseFloat(form.lossStdDev) || 1) * (-2.326)), form.sleCurrency)} to {formatCurrency(Math.exp((parseFloat(form.lossMean) || 0) + (parseFloat(form.lossStdDev) || 1) * 2.326), form.sleCurrency)}.
                                  </div>
                                )}
                                <DistributionChart
                                  distributionType={form.lossDistribution}
                                  parameters={{
                                    mean: parseFloat(form.lossMean) || 0,
                                    stdDev: parseFloat(form.lossStdDev) || 1
                                  }}
                                  title={`Loss Distribution - ${form.lossDistribution === 'lognormal' ? 'Log-Normal (1st-99th percentile)' : 'Normal'}`}
                                  formatCurrency={(value) => formatCurrency(value, form.sleCurrency)}
                                />
                              </td>
                            </tr>
                            <tr className="rar-tab-specific-content">
                              <td colSpan="2" className="rar-form-input-cell">
                                <CumulativeDistributionChart
                                  distributionType={form.lossDistribution}
                                  parameters={{
                                    mean: parseFloat(form.lossMean) || 0,
                                    stdDev: parseFloat(form.lossStdDev) || 1
                                  }}
                                  title={`Cumulative Loss Distribution - ${form.lossDistribution === 'lognormal' ? 'Log-Normal (1st-99th percentile)' : 'Normal'}`}
                                  formatCurrency={(value) => formatCurrency(value, form.sleCurrency)}
                                />
                              </td>
                            </tr>
                          </>
                        )}

                        {form.lossDistribution === "uniform" && (
                          <>
                            <tr title="Minimum loss value for uniform distribution" className="rar-tab-specific-content">
                              <td className="rar-form-label-cell">
                                <label className="rar-form-label">Minimum Loss:</label>
                              </td>
                              <td className="rar-form-input-cell">
                                <div className="rar-currency-input">
                                  <select
                                    name="sleCurrency"
                                    value={form.sleCurrency}
                                    onChange={handleChange}
                                    className="rar-select rar-select-currency"
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
                                    placeholder="Minimum loss value"
                                    name="minLoss"
                                    value={form.minLoss}
                                    onChange={handleChange}
                                    className="rar-input rar-input-currency"
                                  />
                                </div>
                              </td>
                            </tr>

                            <tr title="Maximum loss value for uniform distribution" className="rar-tab-specific-content">
                              <td className="rar-form-label-cell">
                                <label className="rar-form-label">Maximum Loss:</label>
                              </td>
                              <td className="rar-form-input-cell">
                                <div className="rar-currency-input">
                                  <select
                                    name="sleCurrency"
                                    value={form.sleCurrency}
                                    onChange={handleChange}
                                    className="rar-select rar-select-currency"
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
                                    placeholder="Maximum loss value"
                                    name="maxLoss"
                                    value={form.maxLoss}
                                    onChange={handleChange}
                                    className="rar-input rar-input-currency"
                                  />
                                </div>
                              </td>
                            </tr>
                            <tr className="rar-tab-specific-content">
                              <td colSpan="2" className="rar-form-input-cell">
                                <DistributionChart
                                  distributionType="uniform"
                                  parameters={{
                                    minVal: parseFloat(form.minLoss) || 0,
                                    maxVal: parseFloat(form.maxLoss) || 1
                                  }}
                                  title="Loss Distribution - Uniform"
                                  formatCurrency={(value) => formatCurrency(value, form.sleCurrency)}
                                />
                              </td>
                            </tr>
                            <tr>
                              <td colSpan="2" className="rar-form-input-cell">
                                <CumulativeDistributionChart
                                  distributionType="uniform"
                                  parameters={{
                                    minVal: parseFloat(form.minLoss) || 0,
                                    maxVal: parseFloat(form.maxLoss) || 1
                                  }}
                                  title="Loss Distribution - Uniform"
                                  formatCurrency={(value) => formatCurrency(value, form.sleCurrency)}
                                />
                              </td>
                            </tr> 
                          </>
                        )}

                        {form.lossDistribution === "beta" && (
                          <>
                            <tr title="Minimum loss value for beta distribution" className="rar-tab-specific-content">
                              <td className="rar-form-label-cell">
                                <label className="rar-form-label">Minimum Loss:</label>
                              </td>
                              <td className="rar-form-input-cell">
                                <div className="rar-currency-input">
                                  <select
                                    name="sleCurrency"
                                    value={form.sleCurrency}
                                    onChange={handleChange}
                                    className="rar-select rar-select-currency"
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
                                    placeholder="Minimum loss value"
                                    name="minLoss"
                                    value={form.minLoss}
                                    onChange={handleChange}
                                    className="rar-input rar-input-currency"
                                  />
                                </div>
                              </td>
                            </tr>

                            <tr title="Maximum loss value for beta distribution" className="rar-tab-specific-content">
                              <td className="rar-form-label-cell">
                                <label className="rar-form-label">Maximum Loss:</label>
                              </td>
                              <td className="rar-form-input-cell">
                                <div className="rar-currency-input">
                                  <select
                                    name="sleCurrency"
                                    value={form.sleCurrency}
                                    onChange={handleChange}
                                    className="rar-select rar-select-currency"
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
                                    placeholder="Maximum loss value"
                                    name="maxLoss"
                                    value={form.maxLoss}
                                    onChange={handleChange}
                                    className="rar-input rar-input-currency"
                                  />
                                </div>
                              </td>
                            </tr>

                            <tr title="Alpha parameter for beta distribution skewness. A higher alpha skews the distribution towards larger loss values." className="rar-tab-specific-content">
                              <td className="rar-form-label-cell">
                                <label className="rar-form-label">Alpha Parameter:</label>
                              </td>
                              <td className="rar-form-input-cell">
                                <input
                                  type="number"
                                  step="0.1"
                                  placeholder="Alpha parameter (e.g., 2.0)"
                                  name="lossAlpha"
                                  value={form.lossAlpha}
                                  onChange={handleChange}
                                  className="rar-input"
                                />
                              </td>
                            </tr>

                            <tr title="Beta parameter for beta distribution skewness. A higher beta skews the distribution towards smaller loss values." className="rar-tab-specific-content">
                              <td className="rar-form-label-cell">
                                <label className="rar-form-label">Beta Parameter:</label>
                              </td>
                              <td className="rar-form-input-cell">
                                <input
                                  type="number"
                                  step="0.1"
                                  placeholder="Beta parameter (e.g., 5.0)"
                                  name="lossBeta"
                                  value={form.lossBeta}
                                  onChange={handleChange}
                                  className="rar-input"
                                />
                              </td>
                            </tr>

                            <tr className="rar-tab-specific-content">
                              <td colSpan="2" className="rar-form-input-cell">
                                <DistributionChart
                                  distributionType="beta"
                                  parameters={{
                                    alpha: parseFloat(form.lossAlpha) || 2,
                                    beta: parseFloat(form.lossBeta) || 5,
                                    minBeta: parseFloat(form.minLoss) || 0,
                                    maxBeta: parseFloat(form.maxLoss) || 1
                                  }}
                                  title="Loss Distribution - Beta"
                                  formatCurrency={(value) => formatCurrency(value, form.sleCurrency)}
                                />
                                <CumulativeDistributionChart
                                  distributionType="beta"
                                  parameters={{
                                    alpha: parseFloat(form.lossAlpha) || 2,
                                    beta: parseFloat(form.lossBeta) || 5,
                                    minBeta: parseFloat(form.minLoss) || 0,
                                    maxBeta: parseFloat(form.maxLoss) || 1
                                  }}
                                  title="Loss Distribution - Beta"
                                  formatCurrency={(value) => formatCurrency(value, form.sleCurrency)}
                                />
                              </td>
                            </tr>
                          </>
                        )}

                        <tr title="Frequency distribution type for Monte Carlo simulation" className="rar-tab-specific-content">
                          <td className="rar-form-label-cell">
                            <label className="rar-form-label">Frequency Distribution:</label>
                          </td>
                          <td className="rar-form-input-cell">
                            <select
                              name="frequencyDistribution"
                              value={form.frequencyDistribution}
                              onChange={handleChange}
                              className="rar-select"
                            >
                              <option value="triangular">Triangular</option>
                              <option value="poisson">Poisson</option>
                              <option value="normal">Normal</option>
                              <option value="uniform">Uniform</option>
                              <option value="exponential">Exponential</option>
                            </select>
                            {form.frequencyDistribution && (
                              <small className="rar-help-text rar-distribution-info">
                                <strong>Use case:</strong>{" "}
                                {form.frequencyDistribution === "triangular" && 
                                  "Used when you can estimate minimum, most likely, and maximum frequencies based on expert judgment or limited historical data."}
                                {form.frequencyDistribution === "poisson" && 
                                  "Ideal for modeling discrete event counts (e.g., number of incidents per year) when events occur independently at a constant average rate."}
                                {form.frequencyDistribution === "normal" && 
                                  "Suitable for frequencies that vary symmetrically around a mean value. Often used for well-established processes with stable historical patterns."}
                                {form.frequencyDistribution === "uniform" && 
                                  "Used when any frequency within a range is equally likely. Appropriate when there's complete uncertainty about event frequency within known bounds."}
                                {form.frequencyDistribution === "exponential" && 
                                  "Models time between events or frequency of rare events. Common for reliability analysis and modeling time to failure scenarios."}
                              </small>
                            )}
                          </td>
                        </tr>

                        {/* Distribution-specific Frequency Parameters */}
                        {form.frequencyDistribution === "triangular" && (
                          <>
                            <tr title="Minimum frequency of occurrence per year" className="rar-tab-specific-content">
                              <td className="rar-form-label-cell">
                                <label className="rar-form-label">Minimum Frequency:</label>
                              </td>
                              <td className="rar-form-input-cell">
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="Minimum frequency per year (e.g., 0.1)"
                                  name="minFrequency"
                                  value={form.minFrequency}
                                  onChange={handleChange}
                                  className="rar-input"
                                />
                              </td>
                            </tr>

                            <tr title="Most likely frequency of occurrence per year" className="rar-tab-specific-content">
                              <td className="rar-form-label-cell">
                                <label className="rar-form-label">Most Likely Frequency (mode):</label>
                              </td>
                              <td className="rar-form-input-cell">
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="Most likely frequency per year (e.g., 0.5)"
                                  name="mostLikelyFrequency"
                                  value={form.mostLikelyFrequency}
                                  onChange={handleChange}
                                  className="rar-input"
                                />
                              </td>
                            </tr>

                            <tr title="Maximum frequency of occurrence per year" className="rar-tab-specific-content">
                              <td className="rar-form-label-cell">
                                <label className="rar-form-label">Maximum Frequency:</label>
                              </td>
                              <td className="rar-form-input-cell">
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="Maximum frequency per year (e.g., 2.0)"
                                  name="maxFrequency"
                                  value={form.maxFrequency}
                                  onChange={handleChange}
                                  className="rar-input"
                                />
                              </td>
                            </tr>
                            <tr className="rar-tab-specific-content">
                              <td colSpan="2" className="rar-form-input-cell">
                                <DistributionChart
                                  distributionType="triangular"
                                  parameters={{
                                    min: parseFloat(form.minFrequency) || 0,
                                    mode: parseFloat(form.mostLikelyFrequency) || 0,
                                    max: parseFloat(form.maxFrequency) || 1
                                  }}
                                  title="Frequency Distribution - Triangular"
                                />
                                <CumulativeDistributionChart
                                  distributionType="triangular"
                                  parameters={{
                                    min: parseFloat(form.minFrequency) || 0,
                                    mode: parseFloat(form.mostLikelyFrequency) || 0,
                                    max: parseFloat(form.maxFrequency) || 1
                                  }}
                                  title="Frequency Distribution - Triangular"
                                  formatCurrency={null}
                                />
                              </td>
                            </tr>
                          </>
                        )}

                        {form.frequencyDistribution === "normal" && (
                          <>
                            <tr title="Mean frequency of occurrence per year" className="rar-tab-specific-content">
                              <td className="rar-form-label-cell">
                                <label className="rar-form-label">Mean Frequency:</label>
                              </td>
                              <td className="rar-form-input-cell">
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="Mean frequency per year (e.g., 1.0)"
                                  name="frequencyMean"
                                  value={form.frequencyMean}
                                  onChange={handleChange}
                                  className="rar-input"
                                />
                              </td>
                            </tr>

                            <tr title="Standard deviation of frequency" className="rar-tab-specific-content">
                              <td className="rar-form-label-cell">
                                <label className="rar-form-label">Frequency Standard Deviation:</label>
                              </td>
                              <td className="rar-form-input-cell">
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="Standard deviation (e.g., 0.3)"
                                  name="frequencyStdDev"
                                  value={form.frequencyStdDev}
                                  onChange={handleChange}
                                  className="rar-input" 
                                />
                              </td>
                            </tr>
                            <tr className="rar-tab-specific-content">
                              <td colSpan="2" className="rar-form-input-cell">
                                <DistributionChart
                                  distributionType="normal"
                                  parameters={{
                                    mean: parseFloat(form.frequencyMean) || 0,
                                    stdDev: parseFloat(form.frequencyStdDev) || 0
                                  }}
                                  title="Frequency Distribution - Normal"
                                />
                                <CumulativeDistributionChart
                                  distributionType="normal"
                                  parameters={{
                                    mean: parseFloat(form.frequencyMean) || 0,
                                    stdDev: parseFloat(form.frequencyStdDev) || 0
                                  }}
                                  title="Frequency Distribution - Normal"
                                  formatCurrency={null}
                                />
                              </td>
                            </tr>
                          </>
                        )}

                        {form.frequencyDistribution === "uniform" && (
                          <>
                            <tr title="Minimum frequency of occurrence per year" className="rar-tab-specific-content">
                              <td className="rar-form-label-cell">
                                <label className="rar-form-label">Minimum Frequency:</label>
                              </td>
                              <td className="rar-form-input-cell">
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="Minimum frequency per year (e.g., 0.1)"
                                  name="minFrequency"
                                  value={form.minFrequency}
                                  onChange={handleChange}
                                  className="rar-input"
                                />
                              </td>
                            </tr>

                            <tr title="Maximum frequency of occurrence per year" className="rar-tab-specific-content">
                              <td className="rar-form-label-cell">
                                <label className="rar-form-label">Maximum Frequency:</label>
                              </td>
                              <td className="rar-form-input-cell">
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="Maximum frequency per year (e.g., 2.0)"
                                  name="maxFrequency"
                                  value={form.maxFrequency}
                                  onChange={handleChange}
                                  className="rar-input"
                                />
                              </td>
                            </tr>
                            <tr className="rar-tab-specific-content">
                              <td colSpan="2" className="rar-form-input-cell">
                                <DistributionChart
                                  distributionType="uniform"
                                  parameters={{
                                    minVal: parseFloat(form.minFrequency) || 0,
                                    maxVal: parseFloat(form.maxFrequency) || 1
                                  }}
                                  title="Frequency Distribution - Uniform"
                                />
                                <CumulativeDistributionChart
                                  distributionType="uniform"
                                  parameters={{
                                    minVal: parseFloat(form.minFrequency) || 0,
                                    maxVal: parseFloat(form.maxFrequency) || 1
                                  }}
                                  title="Frequency Distribution - Uniform"
                                  formatCurrency={null}
                                />
                              </td>
                            </tr>
                          </>
                        )}

                        {form.frequencyDistribution === "poisson" && (
                          <>
                          <tr title="Lambda parameter for Poisson distribution (average event rate)" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">Lambda (Average Event Rate):</label>
                            </td>
                            <td className="rar-form-input-cell">
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Average events per year (e.g., 1.5)"
                                name="frequencyLambda"
                                value={form.frequencyLambda}
                                onChange={handleChange}
                                className="rar-input"
                              />
                            </td>
                          </tr>
                          <tr className="rar-tab-specific-content">
                            <td colSpan="2" className="rar-form-input-cell">
                              <DistributionChart
                                distributionType="poisson"
                                parameters={{
                                  frequencyLambda: parseFloat(form.frequencyLambda) || 0
                                }}
                                title="Frequency Distribution - Poisson"
                              />
                              <CumulativeDistributionChart
                                distributionType="poisson"
                                parameters={{
                                  frequencyLambda: parseFloat(form.frequencyLambda) || 0
                                }}
                                title="Frequency Distribution - Poisson"
                                formatCurrency={null}
                              />
                            </td>
                          </tr>
                          </>
                        )}

                        {form.frequencyDistribution === "exponential" && (
                          <>
                          <tr title="Lambda parameter for exponential distribution (rate parameter - number of events per year)" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">Lambda (Rate Parameter):</label>
                            </td>
                            <td className="rar-form-input-cell">
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Rate parameter (e.g., 0.5)"
                                name="frequencyLambdaExp"
                                value={form.frequencyLambdaExp}
                                onChange={handleChange}
                                className="rar-input"
                              />
                            </td>
                          </tr>
                          <tr className="rar-tab-specific-content">
                            <td colSpan="2" className="rar-form-input-cell">
                              <DistributionChart
                                distributionType="exponential"
                                parameters={{
                                  frequencyLambdaExp: parseFloat(form.frequencyLambdaExp) || 0
                                }}
                                title="Frequency Distribution - Exponential"
                              />
                              <CumulativeDistributionChart
                                distributionType="exponential"
                                parameters={{
                                  frequencyLambdaExp: parseFloat(form.frequencyLambdaExp) || 0
                                }}
                                title="Frequency Distribution - Exponential"
                                formatCurrency={null}
                              />
                            </td>
                          </tr>
                          </>
                        )}

                        <tr title="Confidence level for Value at Risk calculation" className="rar-tab-specific-content">
                          <td className="rar-form-label-cell">
                            <label className="rar-form-label">Confidence Level:</label>
                          </td>
                          <td className="rar-form-input-cell">
                            <select
                              name="confidenceLevel"
                              value={form.confidenceLevel}
                              onChange={handleChange}
                              className="rar-select"
                            >
                              <option value="90">90%</option>
                              <option value="95">95%</option>
                              <option value="99">99%</option>
                              <option value="99.5">99.5%</option>
                            </select>
                          </td>
                        </tr>

                        <tr title="Expected annual loss from Monte Carlo simulation" className="rar-tab-specific-content">
                          <td className="rar-form-label-cell">
                            <label className="rar-form-label">Expected Annual Loss (EAL):</label>
                          </td>
                          <td className="rar-form-input-cell">
                            <input
                              type="text"
                              name="expectedLoss"
                              value={calculateMonteCarloExpectedLoss(form)}
                              readOnly
                              className="rar-input rar-input-readonly"
                            />
                            <small className="rar-help-text">
                              Calculated as: Mean(Loss) × Mean(Frequency) = {calculateMonteCarloExpectedLoss(form)}
                            </small>
                          </td>
                        </tr>

                        <tr title="Value at Risk at the selected confidence level" className="rar-tab-specific-content">
                          <td className="rar-form-label-cell">
                            <label className="rar-form-label">Value at Risk (VaR):</label>
                          </td>
                          <td className="rar-form-input-cell">
                            <input
                              type="text"
                              name="valueAtRisk"
                              value={calculateMonteCarloVaR(form)}
                              readOnly
                              className="rar-input rar-input-readonly"
                            />
                            <small className="rar-help-text">
                              {form.confidenceLevel}% VaR based on triangular distribution approximation
                            </small>
                          </td>
                        </tr>

                        <tr title="Summary of Monte Carlo simulation results" className="rar-tab-specific-content">
                          <td className="rar-form-label-cell">
                            <label className="rar-form-label">Simulation Results:</label>
                          </td>
                          <td className="rar-form-input-cell">
                            <textarea
                              name="monteCarloResults"
                              value={calculateMonteCarloResults(form)}
                              readOnly
                              rows="12"
                              className="rar-textarea rar-input-readonly rar-textarea-monospace"
                            />
                            <small className="rar-help-text">
                              Automatically generated summary based on triangular distribution approximation
                            </small>
                          </td>
                        </tr>

                        <tr title="Heat map display options" className="rar-tab-specific-content">
                          <td className="rar-form-label-cell">
                            <label className="rar-form-label">Heat Map Display Options:</label>
                          </td>
                          <td className="rar-form-input-cell">
                            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
                                <input
                                  type="checkbox"
                                  checked={showVaR}
                                  onChange={(e) => setShowVaR(e.target.checked)}
                                />
                                <span style={{ color: '#0066ff', fontWeight: 'bold' }}>VaR Line</span>
                              </label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
                                <input
                                  type="checkbox"
                                  checked={showEAL}
                                  onChange={(e) => setShowEAL(e.target.checked)}
                                />
                                <span style={{ color: '#00cc66', fontWeight: 'bold' }}>EAL Line</span>
                              </label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
                                <input
                                  type="checkbox"
                                  checked={showPercentiles}
                                  onChange={(e) => setShowPercentiles(e.target.checked)}
                                />
                                <span>Percentile Lines</span>
                              </label>
                            </div>
                            <small className="rar-help-text">
                              Toggle visibility of different contour lines on the heat maps
                            </small>
                          </td>
                        </tr>

                        <tr title="Joint unit cost and frequency heat map with probability density" className="rar-tab-specific-content">
                          <td colSpan="2" className="rar-form-input-cell">
                            {(() => {
                              const results = getMonteCarloResults(form);
                              const varValue = results.valueAtRisk || 0;
                              const ealValue = results.expectedAnnualLoss || 0;
                              const varStdDev = results.valueAtRiskStdDev || results.varStandardDeviation || (varValue * 0.15); // Default to 15% if not available
                              const ealStdDev = results.expectedAnnualLossStdDev || results.ealStandardDeviation || (ealValue * 0.15); // Default to 15% if not available
                              
                              console.log('VaR & EAL Calculation Debug:', {
                                varValue,
                                ealValue,
                                varStdDev,
                                ealStdDev,
                                resultsValueAtRisk: results.valueAtRisk,
                                resultsExpectedAnnualLoss: results.expectedAnnualLoss,
                                fullResults: results,
                                formValues: {
                                  minFrequency: form.minFrequency,
                                  mostLikelyFrequency: form.mostLikelyFrequency,
                                  maxFrequency: form.maxFrequency,
                                  minLoss: form.minLoss,
                                  mostLikelyLoss: form.mostLikelyLoss,
                                  maxLoss: form.maxLoss
                                }
                              });
                              
                              return (
                                <RiskHeatMap
                                  frequencyDistribution={form.frequencyDistribution || 'triangular'}
                                  frequencyParams={{
                                    min: parseFloat(form.minFrequency) || parseFloat(form.frequencyMean) - parseFloat(form.frequencyStdDev) || parseFloat(form.frequencyLambdaExp) * 0.1 || 0.1,
                                    mode: parseFloat(form.mostLikelyFrequency) || parseFloat(form.frequencyMean) || parseFloat(form.frequencyLambda) || parseFloat(form.frequencyLambdaExp) || 1,
                                    max: parseFloat(form.maxFrequency) || parseFloat(form.frequencyMean) + parseFloat(form.frequencyStdDev) || parseFloat(form.frequencyLambdaExp) * 10 || 10,
                                    mean: parseFloat(form.frequencyMean) || parseFloat(form.frequencyLambda) || undefined,
                                    std: parseFloat(form.frequencyStdDev) || undefined,
                                    lambda: parseFloat(form.frequencyLambda) || parseFloat(form.frequencyLambdaExp) || undefined
                                  }}
                                  lossDistribution={form.lossDistribution || 'triangular'}
                                  lossParams={{
                                    min: parseFloat(form.minLoss) || parseFloat(form.lossMean) - parseFloat(form.lossStdDev) || 1000,
                                    mode: parseFloat(form.mostLikelyLoss) || parseFloat(form.lossMean) || 50000,
                                    max: parseFloat(form.maxLoss) || parseFloat(form.lossMean) + parseFloat(form.lossStdDev) || 500000,
                                    mean: parseFloat(form.lossMean) || undefined,
                                    std: parseFloat(form.lossStdDev) || undefined,
                                    mu: parseFloat(form.lognormalMuLoss) || undefined,
                                    sigma: parseFloat(form.lognormalSigmaLoss) || undefined,
                                    alpha: parseFloat(form.lossAlpha) || undefined,
                                    beta: parseFloat(form.lossBeta) || undefined
                                  }}
                                  formatCurrency={(value) => formatCurrency(value, form.sleCurrency)}
                                  title="Risk Assessment: Unit Cost × Frequency Heat Map"
                                  iterations={form.monteCarloIterations || 10000}
                                  valueAtRisk={varValue || null}
                                  expectedAnnualLoss={ealValue || null}
                                  valueAtRiskStdDev={varStdDev || null}
                                  expectedAnnualLossStdDev={ealStdDev || null}
                                  showVaR={showVaR}
                                  showEAL={showEAL}
                                  showPercentiles={showPercentiles}
                                />
                              );
                            })()}
                          </td>
                        </tr>                        

                          <tr title="Risk level based on the assessment type" className="rar-tab-specific-content">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">Risk Level:</label>
                            </td>
                            <td className="rar-form-input-cell">
                              <select
                                name="manualRiskLevel"
                                value={form.manualRiskLevel}
                                onChange={handleChange}
                                className="rar-select rar-select-risk-level"
                                style={{
                                  border: `2px solid ${getRiskColor(form.manualRiskLevel.charAt(0).toUpperCase() + form.manualRiskLevel.slice(1))}`,
                                  backgroundColor: getRiskColor(
                                    form.manualRiskLevel.charAt(0).toUpperCase() +
                                      form.manualRiskLevel.slice(1),
                                  ),
                                  color: form.manualRiskLevel ? "#fff" : "#333",
                                }}
                              >
                                <option value="">Select Risk Level</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="extreme">Extreme</option>
                              </select>
                              <small className="rar-help-text">
                                Automatically calculated based on Expected Loss and threshold values
                              </small>
                            </td>
                          </tr>
                        </>
                     )}

                     {/* Residual Risk Tab Content */}
                     {activeAdvancedQuantitativeTab === "residualRisk" && (
                       <>
                         <tr className="rar-tab-specific-content">
                           <td colSpan="2" className="rar-form-input-cell">
                             <div className="rar-simulation-header">
                               <div className="rar-simulation-header-content">
                                 <div>
                                   <h4 className="rar-simulation-title">
                                     Residual Risk - Monte Carlo Simulation
                                   </h4>
                                   <p className="rar-simulation-description">
                                     Configure residual risk parameters after implementing risk treatment measures.
                                   </p>
                                 </div>
                               </div>
                             </div>
                           </td>
                         </tr>

                         {/* Current Risk Level Reference */}
                         <tr title="Current risk level from the main Risk tab for reference comparison" className="rar-tab-specific-content">
                           <td className="rar-form-label-cell">
                             <label className="rar-form-label">Current Risk Level (Reference):</label>
                           </td>
                           <td className="rar-form-input-cell">
                             <div className="rar-current-risk-reference">
                               <span 
                                 className="rar-risk-level-badge"
                                 style={{
                                   backgroundColor: getAdvancedQuantitativeRiskLevel(getMonteCarloExpectedLossNumeric(form)) ? 
                                     getRiskColor(getAdvancedQuantitativeRiskLevel(getMonteCarloExpectedLossNumeric(form)).charAt(0).toUpperCase() + getAdvancedQuantitativeRiskLevel(getMonteCarloExpectedLossNumeric(form)).slice(1)) : 
                                     '#cccccc',
                                   color: '#fff',
                                   padding: '8px 16px',
                                   borderRadius: '4px',
                                   fontWeight: 'bold',
                                   fontSize: '14px',
                                   textTransform: 'uppercase',
                                   display: 'inline-block'
                                 }}
                               >
                                 {getAdvancedQuantitativeRiskLevel(getMonteCarloExpectedLossNumeric(form)) || 'Not Calculated'}
                               </span>
                               <small className="rar-help-text" style={{ marginLeft: '12px' }}>
                                 From main Risk tab - Expected Annual Loss: {calculateMonteCarloExpectedLoss(form)}
                               </small>
                             </div>
                           </td>
                         </tr>

                         {/* Treatment Strategy */}
                         <tr title="Overall strategy for treating this risk" className="rar-tab-specific-content">
                           <td className="rar-form-label-cell">
                             <label className="rar-form-label">Treatment Strategy:</label>
                           </td>
                           <td className="rar-form-input-cell">
                             <select
                               name="treatmentStrategy"
                               value={form.treatmentStrategy}
                               onChange={handleChange}
                               className="rar-select"
                             >
                               <option value="">Select Treatment Strategy</option>
                               <option value="mitigate">Mitigate (Reduce probability/impact)</option>
                               <option value="transfer">Transfer (Insurance, outsourcing)</option>
                               <option value="avoid">Avoid (Eliminate the risk source)</option>
                               <option value="accept">Accept (Monitor and contingency plan)</option>
                               <option value="hybrid">Hybrid (Multiple strategies)</option>
                             </select>
                             <small className="rar-help-text">
                               Select the primary risk treatment approach being implemented
                             </small>
                           </td>
                         </tr>

                         {/* Recommended Actions */}
                         <tr title="Specific actions recommended to treat this risk" className="rar-tab-specific-content">
                           <td className="rar-form-label-cell">
                             <label className="rar-form-label">Recommended Actions:</label>
                           </td>
                           <td className="rar-form-input-cell">
                             <textarea
                               name="recommendedActions"
                               value={form.recommendedActions}
                               onChange={handleChange}
                               placeholder="Describe specific actions, controls, or measures to be implemented..."
                               rows="4"
                               className="rar-textarea"
                             />
                             <small className="rar-help-text">
                               Detail the specific actions, controls, or measures to reduce risk to the target residual level
                             </small>
                           </td>
                         </tr>

                         {/* Action Owner */}
                         <tr title="Person responsible for implementing the recommended actions" className="rar-tab-specific-content">
                           <td className="rar-form-label-cell">
                             <label className="rar-form-label">Action Owner:</label>
                           </td>
                           <td className="rar-form-input-cell">
                             <input
                               type="text"
                               name="actionOwner"
                               value={form.actionOwner}
                               onChange={handleChange}
                               placeholder="Name or role of person responsible for implementation"
                               className="rar-input"
                             />
                             <small className="rar-help-text">
                               Identify the person or role responsible for implementing the risk treatment actions
                             </small>
                           </td>
                         </tr>

                         {/* Target Date */}
                         <tr title="Target completion date for implementing risk treatment actions" className="rar-tab-specific-content">
                           <td className="rar-form-label-cell">
                             <label className="rar-form-label">Target Date:</label>
                           </td>
                           <td className="rar-form-input-cell">
                             <input
                               type="date"
                               name="targetDate"
                               value={form.targetDate}
                               onChange={handleChange}
                               className="rar-input rar-input-date"
                             />
                             <small className="rar-help-text">
                               Expected date for completing risk treatment implementation
                             </small>
                           </td>
                         </tr>

                         <tr title="Number of simulation iterations for residual risk (typically 10,000 or more)" className="rar-tab-specific-content">
                           <td className="rar-form-label-cell">
                             <label className="rar-form-label">Residual Simulation Iterations:</label>
                           </td>
                           <td className="rar-form-input-cell">
                             <input
                               type="number"
                               placeholder="Number of iterations (e.g., 10000)"
                               name="residualMonteCarloIterations"
                               value={form.residualMonteCarloIterations || form.monteCarloIterations}
                               onChange={handleChange}
                               min="1000"
                               max="100000"
                               className="rar-input"
                             />
                             {!form.residualMonteCarloIterations && form.monteCarloIterations && (
                               <small className="rar-help-text">
                                 Defaulting to main risk iterations: {form.monteCarloIterations}
                               </small>
                             )}
                           </td>
                         </tr>

                         <tr title="Loss distribution type for residual Monte Carlo simulation" className="rar-tab-specific-content">
                           <td className="rar-form-label-cell">
                             <label className="rar-form-label">Residual Loss Distribution:</label>
                           </td>
                           <td className="rar-form-input-cell">
                             <select
                               name="residualLossDistribution"
                               value={form.residualLossDistribution || form.lossDistribution}
                               onChange={handleChange}
                               className="rar-select"
                             >
                               <option value="">Select Distribution</option>
                               <option value="triangular">Triangular</option>
                               <option value="normal">Normal</option>
                               <option value="lognormal">Log-Normal</option>
                               <option value="uniform">Uniform</option>
                               <option value="beta">Beta</option>
                             </select>
                             <small className="rar-help-text">
                               <strong>Residual Risk Distribution:</strong>{" "}
                               {(form.residualLossDistribution || form.lossDistribution) === "triangular" && 
                                 "Three-point estimates for post-control residual losses."}
                               {(form.residualLossDistribution || form.lossDistribution) === "normal" && 
                                 "Bell-curve pattern for residual losses after controls."}
                               {(form.residualLossDistribution || form.lossDistribution) === "lognormal" && 
                                 "Right-skewed residual losses using natural logarithm (ln, base e). Parameters: μ = 1-6, σ = 0.3-1.2. Fields represent underlying normal distribution parameters."}
                               {(form.residualLossDistribution || form.lossDistribution) === "uniform" && 
                                 "Equally likely residual loss values within range."}
                               {(form.residualLossDistribution || form.lossDistribution) === "beta" && 
                                 "Flexible bounded residual loss distribution."}
                               {!form.residualLossDistribution && form.lossDistribution && (
                                 <>
                                   <br />
                                   <em>Defaulting to main risk distribution: {form.lossDistribution}</em>
                                 </>
                               )}
                             </small>
                           </td>
                         </tr>

                         {/* Distribution-specific Residual Loss Parameters */}
                         {((form.residualLossDistribution || form.lossDistribution) === "triangular") && (
                           <>
                             <tr title="Minimum residual loss value for the distribution" className="rar-tab-specific-content">
                               <td className="rar-form-label-cell">
                                 <label className="rar-form-label">Residual Minimum Loss:</label>
                               </td>
                               <td className="rar-form-input-cell">
                                 <div className="rar-currency-input">
                                   <select
                                     name="residualSleCurrency"
                                     value={form.residualSleCurrency || form.sleCurrency}
                                     onChange={handleChange}
                                     className="rar-select rar-select-currency"
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
                                     placeholder="Minimum residual loss value"
                                     name="residualMinLoss"
                                     value={form.residualMinLoss}
                                     onChange={handleChange}
                                     className="rar-input rar-input-currency"
                                   />
                                 </div>
                               </td>
                             </tr>
                   
                             <tr title="Most likely residual loss value for the distribution" className="rar-tab-specific-content">
                               <td className="rar-form-label-cell">
                                 <label className="rar-form-label">Residual Most Likely Loss:</label>
                               </td>
                               <td className="rar-form-input-cell">
                                 <div className="rar-currency-input">
                                   <select
                                     name="residualSleCurrency"
                                     value={form.residualSleCurrency || form.sleCurrency}
                                     onChange={handleChange}
                                     className="rar-select rar-select-currency"
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
                                     placeholder="Most likely residual loss value"
                                     name="residualMostLikelyLoss"
                                     value={form.residualMostLikelyLoss}
                                     onChange={handleChange}
                                     className="rar-input rar-input-currency"
                                   />
                                 </div>
                               </td>
                             </tr>
                   
                             <tr title="Maximum residual loss value for the distribution" className="rar-tab-specific-content">
                               <td className="rar-form-label-cell">
                                 <label className="rar-form-label">Residual Maximum Loss:</label>
                               </td>
                               <td className="rar-form-input-cell">
                                 <div className="rar-currency-input">
                                   <select
                                     name="residualSleCurrency"
                                     value={form.residualSleCurrency || form.sleCurrency}
                                     onChange={handleChange}
                                     className="rar-select rar-select-currency"
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
                                     placeholder="Maximum residual loss value"
                                     name="residualMaxLoss"
                                     value={form.residualMaxLoss}
                                     onChange={handleChange}
                                     className="rar-input rar-input-currency"
                                   />
                                 </div>
                               </td>
                             </tr>
                             <tr className="rar-tab-specific-content">
                               <td colSpan="2" className="rar-form-input-cell">
                                 <DistributionChart
                                   distributionType="triangular"
                                   parameters={{
                                     min: parseFloat(form.residualMinLoss) || 0,
                                     mode: parseFloat(form.residualMostLikelyLoss) || 0,
                                     max: parseFloat(form.residualMaxLoss) || 0
                                   }}
                                   title="Residual Loss Distribution - Triangular"
                                   formatCurrency={(value) => formatCurrency(value, form.residualSleCurrency || form.sleCurrency)}
                                 />
                               </td>
                             </tr>
                             <tr className="rar-tab-specific-content">
                               <td colSpan="2" className="rar-form-input-cell">
                                 <CumulativeDistributionChart
                                   distributionType="triangular"
                                   parameters={{
                                     min: parseFloat(form.residualMinLoss) || 0,
                                     mode: parseFloat(form.residualMostLikelyLoss) || 0,
                                     max: parseFloat(form.residualMaxLoss) || 0
                                   }}
                                   title="Residual Loss Distribution - Triangular"
                                   formatCurrency={(value) => formatCurrency(value, form.residualSleCurrency || form.sleCurrency)}
                                 />
                               </td>
                             </tr>
                           </>
                         )}

                         {((form.residualLossDistribution || form.lossDistribution) === "normal" || (form.residualLossDistribution || form.lossDistribution) === "lognormal") && (
                           <>
                             <tr title="Mean (average) residual loss value for the distribution" className="rar-tab-specific-content">
                               <td className="rar-form-label-cell">
                                 <label className="rar-form-label">
                                   {(form.residualLossDistribution || form.lossDistribution) === "lognormal" ? "Residual μ (Mu - Underlying Normal Mean):" : "Residual Mean Loss:"}
                                 </label>
                               </td>
                               <td className="rar-form-input-cell">
                                 <div className="rar-currency-input">
                                   <select
                                     name="residualSleCurrency"
                                     value={form.residualSleCurrency || form.sleCurrency}
                                     onChange={handleChange}
                                     className="rar-select rar-select-currency"
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
                                     placeholder={(form.residualLossDistribution || form.lossDistribution) === "lognormal" ? "Residual μ (mu) value (e.g., 2-5)" : "Mean residual loss value"}
                                     name="residualLossMean"
                                     value={form.residualLossMean}
                                     onChange={handleChange}
                                     className="rar-input rar-input-currency"
                                   />
                                 </div>
                               </td>
                             </tr>

                             <tr title="Standard deviation of residual loss values" className="rar-tab-specific-content">
                               <td className="rar-form-label-cell">
                                 <label className="rar-form-label">
                                   {(form.residualLossDistribution || form.lossDistribution) === "lognormal" ? "Residual σ (Sigma - Underlying Normal Std Dev):" : "Residual Loss Standard Deviation:"}
                                 </label>
                               </td>
                               <td className="rar-form-input-cell">
                                 <div className="rar-currency-input">
                                   <select
                                     name="residualSleCurrency"
                                     value={form.residualSleCurrency || form.sleCurrency}
                                     onChange={handleChange}
                                     className="rar-select rar-select-currency"
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
                                     placeholder={(form.residualLossDistribution || form.lossDistribution) === "lognormal" ? "Residual σ (sigma) value (e.g., 0.3-1.2)" : "Standard deviation"}
                                     name="residualLossStdDev"
                                     value={form.residualLossStdDev}
                                     onChange={handleChange}
                                     className="rar-input rar-input-currency"
                                   />
                                 </div>
                               </td>
                             </tr>
                             
                             {/* Residual Log-Normal Distribution Statistics Display */}
                             {(form.residualLossDistribution || form.lossDistribution) === "lognormal" && 
                              (form.residualLossMean || form.lossMean) && (form.residualLossStdDev || form.lossStdDev) && (
                               <tr className="rar-tab-specific-content">
                                 <td colSpan="2" className="rar-form-input-cell">
                                   <div className="rar-lognormal-stats">
                                     <h5 style={{ margin: '10px 0 5px 0', color: '#0099cc' }}>
                                       📊 Resulting Residual Log-Normal Distribution:
                                     </h5>
                                     <div style={{ 
                                       display: 'grid', 
                                       gridTemplateColumns: '1fr 1fr', 
                                       gap: '10px',
                                       padding: '10px',
                                       backgroundColor: '#f8f9fa',
                                       border: '1px solid #dee2e6',
                                       borderRadius: '5px',
                                       fontSize: '14px'
                                     }}>
                                       <div>
                                         <strong>Actual Mean:</strong><br/>
                                         {(() => {
                                           const mu = parseFloat(form.residualLossMean || form.lossMean) || 0;
                                           const sigma = parseFloat(form.residualLossStdDev || form.lossStdDev) || 1;
                                           const actualMean = Math.exp(mu + (sigma * sigma) / 2);
                                           return formatCurrency(actualMean, form.residualSleCurrency || form.sleCurrency);
                                         })()}
                                       </div>
                                       <div>
                                         <strong>Actual Std Dev:</strong><br/>
                                         {(() => {
                                           const mu = parseFloat(form.residualLossMean || form.lossMean) || 0;
                                           const sigma = parseFloat(form.residualLossStdDev || form.lossStdDev) || 1;
                                           const actualVariance = (Math.exp(sigma * sigma) - 1) * Math.exp(2 * mu + sigma * sigma);
                                           const actualStdDev = Math.sqrt(actualVariance);
                                           return formatCurrency(actualStdDev, form.residualSleCurrency || form.sleCurrency);
                                         })()}
                                       </div>
                                       <div>
                                         <strong>Median:</strong><br/>
                                         {(() => {
                                           const mu = parseFloat(form.residualLossMean || form.lossMean) || 0;
                                           const median = Math.exp(mu);
                                           return formatCurrency(median, form.residualSleCurrency || form.sleCurrency);
                                         })()}
                                       </div>
                                       <div>
                                         <strong>Mode:</strong><br/>
                                         {(() => {
                                           const mu = parseFloat(form.residualLossMean || form.lossMean) || 0;
                                           const sigma = parseFloat(form.residualLossStdDev || form.lossStdDev) || 1;
                                           const mode = Math.exp(mu - sigma * sigma);
                                           return formatCurrency(mode, form.residualSleCurrency || form.sleCurrency);
                                         })()}
                                       </div>
                                     </div>
                                     <small style={{ color: '#6c757d', fontStyle: 'italic' }}>
                                       These are the actual statistics of the residual log-normal distribution created from your μ and σ parameters.
                                     </small>
                                   </div>
                                 </td>
                               </tr>
                             )}
                               <tr className="rar-tab-specific-content">
                               <td colSpan="2" className="rar-form-input-cell">
                                 {(form.residualLossDistribution || form.lossDistribution) === 'lognormal' && (
                                   <div style={{ 
                                     backgroundColor: '#f0f8ff', 
                                     padding: '8px', 
                                     borderRadius: '4px', 
                                     marginBottom: '10px',
                                     fontSize: '12px',
                                     color: '#0066cc'
                                   }}>
                                     <strong>Graph Range Info:</strong> The chart shows the 1st to 99th percentile range of your residual log-normal distribution. With μ={parseFloat(form.residualLossMean || form.lossMean) || 0} and σ={parseFloat(form.residualLossStdDev || form.lossStdDev) || 1}, this covers roughly {formatCurrency(Math.exp((parseFloat(form.residualLossMean || form.lossMean) || 0) + (parseFloat(form.residualLossStdDev || form.lossStdDev) || 1) * (-2.326)), form.residualSleCurrency || form.sleCurrency)} to {formatCurrency(Math.exp((parseFloat(form.residualLossMean || form.lossMean) || 0) + (parseFloat(form.residualLossStdDev || form.lossStdDev) || 1) * 2.326), form.residualSleCurrency || form.sleCurrency)}.
                                   </div>
                                 )}
                                 <DistributionChart
                                   distributionType={form.residualLossDistribution || form.lossDistribution}
                                   parameters={{
                                     mean: parseFloat(form.residualLossMean) || 0,
                                     stdDev: parseFloat(form.residualLossStdDev) || 1
                                   }}
                                   title={`Residual Loss Distribution - ${(form.residualLossDistribution || form.lossDistribution) === 'lognormal' ? 'Log-Normal (1st-99th percentile)' : 'Normal'}`}
                                   formatCurrency={(value) => formatCurrency(value, form.residualSleCurrency || form.sleCurrency)}
                                 />
                               </td>
                             </tr>
                             <tr className="rar-tab-specific-content">
                               <td colSpan="2" className="rar-form-input-cell">
                                 <CumulativeDistributionChart
                                   distributionType={form.residualLossDistribution || form.lossDistribution}
                                   parameters={{
                                     mean: parseFloat(form.residualLossMean) || 0,
                                     stdDev: parseFloat(form.residualLossStdDev) || 1
                                   }}
                                   title={`Cumulative Residual Loss Distribution - ${(form.residualLossDistribution || form.lossDistribution) === 'lognormal' ? 'Log-Normal (1st-99th percentile)' : 'Normal'}`}
                                   formatCurrency={(value) => formatCurrency(value, form.residualSleCurrency || form.sleCurrency)}
                                 />
                               </td>
                             </tr>
                           </>
                         )}

                         {((form.residualLossDistribution || form.lossDistribution) === "uniform") && (
                           <>
                             <tr title="Minimum residual loss value for uniform distribution" className="rar-tab-specific-content">
                               <td className="rar-form-label-cell">
                                 <label className="rar-form-label">Residual Minimum Loss:</label>
                               </td>
                               <td className="rar-form-input-cell">
                                 <div className="rar-currency-input">
                                   <select
                                     name="residualSleCurrency"
                                     value={form.residualSleCurrency || form.sleCurrency}
                                     onChange={handleChange}
                                     className="rar-select rar-select-currency"
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
                                     placeholder="Minimum residual loss value"
                                     name="residualUniformMinLoss"
                                     value={form.residualUniformMinLoss}
                                     onChange={handleChange}
                                     className="rar-input rar-input-currency"
                                   />
                                 </div>
                               </td>
                             </tr>

                             <tr title="Maximum residual loss value for uniform distribution" className="rar-tab-specific-content">
                               <td className="rar-form-label-cell">
                                 <label className="rar-form-label">Residual Maximum Loss:</label>
                               </td>
                               <td className="rar-form-input-cell">
                                 <div className="rar-currency-input">
                                   <select
                                     name="residualSleCurrency"
                                     value={form.residualSleCurrency || form.sleCurrency}
                                     onChange={handleChange}
                                     className="rar-select rar-select-currency"
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
                                     placeholder="Maximum residual loss value"
                                     name="residualUniformMaxLoss"
                                     value={form.residualUniformMaxLoss}
                                     onChange={handleChange}
                                     className="rar-input rar-input-currency"
                                   />
                                 </div>
                               </td>
                             </tr>
                             <tr className="rar-tab-specific-content">
                               <td colSpan="2" className="rar-form-input-cell">
                                 <DistributionChart
                                   distributionType="uniform"
                                   parameters={{
                                     minVal: parseFloat(form.residualUniformMinLoss) || 0,
                                     maxVal: parseFloat(form.residualUniformMaxLoss) || 0
                                   }}
                                   title="Residual Loss Distribution - Uniform"
                                   formatCurrency={(value) => formatCurrency(value, form.residualSleCurrency || form.sleCurrency)}
                                 />
                               </td>
                             </tr>
                             <tr className="rar-tab-specific-content">
                               <td colSpan="2" className="rar-form-input-cell">
                                 <CumulativeDistributionChart
                                   distributionType="uniform"
                                   parameters={{
                                     minVal: parseFloat(form.residualUniformMinLoss) || 0,
                                     maxVal: parseFloat(form.residualUniformMaxLoss) || 0
                                   }}
                                   title="Cumulative Residual Loss Distribution - Uniform"
                                   formatCurrency={(value) => formatCurrency(value, form.residualSleCurrency || form.sleCurrency)}
                                 />
                               </td>
                             </tr>
                           </>
                         )}

                         {((form.residualLossDistribution || form.lossDistribution) === "beta") && (
                           <>
                             <tr title="Alpha parameter for beta distribution" className="rar-tab-specific-content">
                               <td className="rar-form-label-cell">
                                 <label className="rar-form-label">Residual Alpha (α):</label>
                               </td>
                               <td className="rar-form-input-cell">
                                 <input
                                   type="number"
                                   placeholder="Alpha parameter (shape)"
                                   name="residualBetaAlpha"
                                   value={form.residualBetaAlpha}
                                   onChange={handleChange}
                                   step="0.1"
                                   min="0.1"
                                   className="rar-input"
                                 />
                               </td>
                             </tr>

                             <tr title="Beta parameter for beta distribution" className="rar-tab-specific-content">
                               <td className="rar-form-label-cell">
                                 <label className="rar-form-label">Residual Beta (β):</label>
                               </td>
                               <td className="rar-form-input-cell">
                                 <input
                                   type="number"
                                   placeholder="Beta parameter (shape)"
                                   name="residualBetaBeta"
                                   value={form.residualBetaBeta}
                                   onChange={handleChange}
                                   step="0.1"
                                   min="0.1"
                                   className="rar-input"
                                 />
                               </td>
                             </tr>

                             <tr title="Minimum value for beta distribution scaling" className="rar-tab-specific-content">
                               <td className="rar-form-label-cell">
                                 <label className="rar-form-label">Residual Minimum Loss:</label>
                               </td>
                               <td className="rar-form-input-cell">
                                 <div className="rar-currency-input">
                                   <select
                                     name="residualSleCurrency"
                                     value={form.residualSleCurrency || form.sleCurrency}
                                     onChange={handleChange}
                                     className="rar-select rar-select-currency"
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
                                     placeholder="Minimum residual loss value"
                                     name="residualBetaMinLoss"
                                     value={form.residualBetaMinLoss}
                                     onChange={handleChange}
                                     className="rar-input rar-input-currency"
                                   />
                                 </div>
                               </td>
                             </tr>

                             <tr title="Maximum value for beta distribution scaling" className="rar-tab-specific-content">
                               <td className="rar-form-label-cell">
                                 <label className="rar-form-label">Residual Maximum Loss:</label>
                               </td>
                               <td className="rar-form-input-cell">
                                 <div className="rar-currency-input">
                                   <select
                                     name="residualSleCurrency"
                                     value={form.residualSleCurrency || form.sleCurrency}
                                     onChange={handleChange}
                                     className="rar-select rar-select-currency"
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
                                     placeholder="Maximum residual loss value"
                                     name="residualBetaMaxLoss"
                                     value={form.residualBetaMaxLoss}
                                     onChange={handleChange}
                                     className="rar-input rar-input-currency"
                                   />
                                 </div>
                               </td>
                             </tr>
                             <tr className="rar-tab-specific-content">
                               <td colSpan="2" className="rar-form-input-cell">
                                 <DistributionChart
                                   distributionType="beta"
                                   parameters={{
                                     alpha: parseFloat(form.residualBetaAlpha) || 2,
                                     beta: parseFloat(form.residualBetaBeta) || 2,
                                     minBeta: parseFloat(form.residualBetaMinLoss) || 0,
                                     maxBeta: parseFloat(form.residualBetaMaxLoss) || 100000
                                   }}
                                   title="Residual Loss Distribution - Beta"
                                   formatCurrency={(value) => formatCurrency(value, form.residualSleCurrency || form.sleCurrency)}
                                 />
                               </td>
                             </tr>
                             <tr className="rar-tab-specific-content">
                               <td colSpan="2" className="rar-form-input-cell">
                                 <CumulativeDistributionChart
                                   distributionType="beta"
                                   parameters={{
                                     alpha: parseFloat(form.residualBetaAlpha) || 2,
                                     beta: parseFloat(form.residualBetaBeta) || 2,
                                     minBeta: parseFloat(form.residualBetaMinLoss) || 0,
                                     maxBeta: parseFloat(form.residualBetaMaxLoss) || 100000
                                   }}
                                   title="Cumulative Residual Loss Distribution - Beta"
                                   formatCurrency={(value) => formatCurrency(value, form.residualSleCurrency || form.sleCurrency)}
                                 />
                               </td>
                             </tr>
                           </>
                         )}

                         <tr title="Residual frequency distribution type for Monte Carlo simulation" className="rar-tab-specific-content">
                           <td className="rar-form-label-cell">
                             <label className="rar-form-label">Residual Frequency Distribution:</label>
                           </td>
                           <td className="rar-form-input-cell">
                             <select
                               name="residualFrequencyDistribution"
                               value={form.residualFrequencyDistribution || form.frequencyDistribution}
                               onChange={handleChange}
                               className="rar-select"
                             >
                               <option value="">Select Distribution</option>
                               <option value="triangular">Triangular</option>
                               <option value="poisson">Poisson</option>
                               <option value="normal">Normal</option>
                               <option value="uniform">Uniform</option>
                               <option value="exponential">Exponential</option>
                             </select>
                             {(form.residualFrequencyDistribution || form.frequencyDistribution) && (
                               <small className="rar-help-text rar-distribution-info">
                                 <strong>Use case:</strong>{" "}
                                 {(form.residualFrequencyDistribution || form.frequencyDistribution) === "triangular" && 
                                   "Used when you can estimate minimum, most likely, and maximum residual frequencies based on expert judgment or limited historical data."}
                                 {(form.residualFrequencyDistribution || form.frequencyDistribution) === "poisson" && 
                                   "Ideal for modeling discrete residual event counts (e.g., number of incidents per year) when events occur independently at a constant average rate."}
                                 {(form.residualFrequencyDistribution || form.frequencyDistribution) === "normal" && 
                                   "Suitable for residual frequencies that vary symmetrically around a mean value. Often used for well-established processes with stable historical patterns."}
                                 {(form.residualFrequencyDistribution || form.frequencyDistribution) === "uniform" && 
                                   "Used when any residual frequency within a range is equally likely. Appropriate when there's complete uncertainty about event frequency within known bounds."}
                                 {(form.residualFrequencyDistribution || form.frequencyDistribution) === "exponential" && 
                                   "Models time between residual events or frequency of rare events. Common for reliability analysis and modeling time to failure scenarios."}
                                 {!form.residualFrequencyDistribution && form.frequencyDistribution && (
                                   <>
                                     <br />
                                     <em>Defaulting to main risk distribution: {form.frequencyDistribution}</em>
                                   </>
                                 )}
                               </small>
                             )}
                           </td>
                         </tr>

                         {/* Distribution-specific Residual Frequency Parameters */}
                         {(form.residualFrequencyDistribution || form.frequencyDistribution) === "triangular" && (
                           <>
                             <tr title="Minimum residual frequency of occurrence per year" className="rar-tab-specific-content">
                               <td className="rar-form-label-cell">
                                 <label className="rar-form-label">Residual Minimum Frequency:</label>
                               </td>
                               <td className="rar-form-input-cell">
                                 <input
                                   type="number"
                                   step="0.01"
                                   placeholder="Minimum residual frequency per year (e.g., 0.05)"
                                   name="residualMinFrequency"
                                   value={form.residualMinFrequency}
                                   onChange={handleChange}
                                   className="rar-input"
                                 />
                               </td>
                             </tr>

                             <tr title="Most likely residual frequency of occurrence per year" className="rar-tab-specific-content">
                               <td className="rar-form-label-cell">
                                 <label className="rar-form-label">Residual Most Likely Frequency (mode):</label>
                               </td>
                               <td className="rar-form-input-cell">
                                 <input
                                   type="number"
                                   step="0.01"
                                   placeholder="Most likely residual frequency per year (e.g., 0.2)"
                                   name="residualMostLikelyFrequency"
                                   value={form.residualMostLikelyFrequency}
                                   onChange={handleChange}
                                   className="rar-input"
                                 />
                               </td>
                             </tr>

                             <tr title="Maximum residual frequency of occurrence per year" className="rar-tab-specific-content">
                               <td className="rar-form-label-cell">
                                 <label className="rar-form-label">Residual Maximum Frequency:</label>
                               </td>
                               <td className="rar-form-input-cell">
                                 <input
                                   type="number"
                                   step="0.01"
                                   placeholder="Maximum residual frequency per year (e.g., 1.0)"
                                   name="residualMaxFrequency"
                                   value={form.residualMaxFrequency}
                                   onChange={handleChange}
                                   className="rar-input"
                                 />
                               </td>
                             </tr>
                             <tr className="rar-tab-specific-content">
                               <td colSpan="2" className="rar-form-input-cell">
                                 <DistributionChart
                                   distributionType="triangular"
                                   parameters={{
                                     min: parseFloat(form.residualMinFrequency) || 0,
                                     mode: parseFloat(form.residualMostLikelyFrequency) || 0,
                                     max: parseFloat(form.residualMaxFrequency) || 1
                                   }}
                                   title="Residual Frequency Distribution - Triangular"
                                 />
                                 <CumulativeDistributionChart
                                   distributionType="triangular"
                                   parameters={{
                                     min: parseFloat(form.residualMinFrequency) || 0,
                                     mode: parseFloat(form.residualMostLikelyFrequency) || 0,
                                     max: parseFloat(form.residualMaxFrequency) || 1
                                   }}
                                   title="Residual Frequency Distribution - Triangular"
                                   formatCurrency={null}
                                 />
                               </td>
                             </tr>
                           </>
                         )}

                         {(form.residualFrequencyDistribution || form.frequencyDistribution) === "normal" && (
                           <>
                             <tr title="Mean residual frequency of occurrence per year" className="rar-tab-specific-content">
                               <td className="rar-form-label-cell">
                                 <label className="rar-form-label">Residual Mean Frequency:</label>
                               </td>
                               <td className="rar-form-input-cell">
                                 <input
                                   type="number"
                                   step="0.01"
                                   placeholder="Mean residual frequency per year (e.g., 0.5)"
                                   name="residualFrequencyMean"
                                   value={form.residualFrequencyMean}
                                   onChange={handleChange}
                                   className="rar-input"
                                 />
                               </td>
                             </tr>

                             <tr title="Standard deviation of residual frequency" className="rar-tab-specific-content">
                               <td className="rar-form-label-cell">
                                 <label className="rar-form-label">Residual Frequency Standard Deviation:</label>
                               </td>
                               <td className="rar-form-input-cell">
                                 <input
                                   type="number"
                                   step="0.01"
                                   placeholder="Standard deviation (e.g., 0.1)"
                                   name="residualFrequencyStdDev"
                                   value={form.residualFrequencyStdDev}
                                   onChange={handleChange}
                                   className="rar-input" 
                                 />
                               </td>
                             </tr>
                             <tr className="rar-tab-specific-content">
                               <td colSpan="2" className="rar-form-input-cell">
                                 <DistributionChart
                                   distributionType="normal"
                                   parameters={{
                                     mean: parseFloat(form.residualFrequencyMean) || 0,
                                     stdDev: parseFloat(form.residualFrequencyStdDev) || 0
                                   }}
                                   title="Residual Frequency Distribution - Normal"
                                 />
                                 <CumulativeDistributionChart
                                   distributionType="normal"
                                   parameters={{
                                     mean: parseFloat(form.residualFrequencyMean) || 0,
                                     stdDev: parseFloat(form.residualFrequencyStdDev) || 0
                                   }}
                                   title="Residual Frequency Distribution - Normal"
                                   formatCurrency={null}
                                 />
                               </td>
                             </tr>
                           </>
                         )}

                         {(form.residualFrequencyDistribution || form.frequencyDistribution) === "uniform" && (
                           <>
                             <tr title="Minimum residual frequency of occurrence per year" className="rar-tab-specific-content">
                               <td className="rar-form-label-cell">
                                 <label className="rar-form-label">Residual Minimum Frequency:</label>
                               </td>
                               <td className="rar-form-input-cell">
                                 <input
                                   type="number"
                                   step="0.01"
                                   placeholder="Minimum residual frequency per year (e.g., 0.05)"
                                   name="residualMinFrequency"
                                   value={form.residualMinFrequency}
                                   onChange={handleChange}
                                   className="rar-input"
                                 />
                               </td>
                             </tr>

                             <tr title="Maximum residual frequency of occurrence per year" className="rar-tab-specific-content">
                               <td className="rar-form-label-cell">
                                 <label className="rar-form-label">Residual Maximum Frequency:</label>
                               </td>
                               <td className="rar-form-input-cell">
                                 <input
                                   type="number"
                                   step="0.01"
                                   placeholder="Maximum residual frequency per year (e.g., 1.0)"
                                   name="residualMaxFrequency"
                                   value={form.residualMaxFrequency}
                                   onChange={handleChange}
                                   className="rar-input"
                                 />
                               </td>
                             </tr>
                             <tr className="rar-tab-specific-content">
                               <td colSpan="2" className="rar-form-input-cell">
                                 <DistributionChart
                                   distributionType="uniform"
                                   parameters={{
                                     minVal: parseFloat(form.residualMinFrequency) || 0,
                                     maxVal: parseFloat(form.residualMaxFrequency) || 1
                                   }}
                                   title="Residual Frequency Distribution - Uniform"
                                 />
                                 <CumulativeDistributionChart
                                   distributionType="uniform"
                                   parameters={{
                                     minVal: parseFloat(form.residualMinFrequency) || 0,
                                     maxVal: parseFloat(form.residualMaxFrequency) || 1
                                   }}
                                   title="Residual Frequency Distribution - Uniform"
                                   formatCurrency={null}
                                 />
                               </td>
                             </tr>
                           </>
                         )}

                         {(form.residualFrequencyDistribution || form.frequencyDistribution) === "poisson" && (
                           <>
                           <tr title="Lambda parameter for residual Poisson distribution (average event rate)" className="rar-tab-specific-content">
                             <td className="rar-form-label-cell">
                               <label className="rar-form-label">Residual Lambda (Average Event Rate):</label>
                             </td>
                             <td className="rar-form-input-cell">
                               <input
                                 type="number"
                                 step="0.01"
                                 placeholder="Average residual events per year (e.g., 0.5)"
                                 name="residualFrequencyLambda"
                                 value={form.residualFrequencyLambda}
                                 onChange={handleChange}
                                 className="rar-input"
                               />
                             </td>
                           </tr>
                           <tr className="rar-tab-specific-content">
                             <td colSpan="2" className="rar-form-input-cell">
                               <DistributionChart
                                 distributionType="poisson"
                                 parameters={{
                                   frequencyLambda: parseFloat(form.residualFrequencyLambda) || 0
                                 }}
                                 title="Residual Frequency Distribution - Poisson"
                               />
                               <CumulativeDistributionChart
                                 distributionType="poisson"
                                 parameters={{
                                   frequencyLambda: parseFloat(form.residualFrequencyLambda) || 0
                                 }}
                                 title="Residual Frequency Distribution - Poisson"
                                 formatCurrency={null}
                               />
                             </td>
                           </tr>
                           </>
                         )}

                         {(form.residualFrequencyDistribution || form.frequencyDistribution) === "exponential" && (
                           <>
                           <tr title="Lambda parameter for exponential distribution (rate parameter - number of events per year)" className="rar-tab-specific-content">
                             <td className="rar-form-label-cell">
                               <label className="rar-form-label">Residual Lambda (Rate Parameter):</label>
                             </td>
                             <td className="rar-form-input-cell">
                               <input
                                 type="number"
                                 step="0.01"
                                 placeholder="Rate parameter (e.g., 0.2)"
                                 name="residualFrequencyLambdaExp"
                                 value={form.residualFrequencyLambdaExp}
                                 onChange={handleChange}
                                 className="rar-input"
                               />
                             </td>
                           </tr>
                           <tr className="rar-tab-specific-content">
                             <td colSpan="2" className="rar-form-input-cell">
                               <DistributionChart
                                 distributionType="exponential"
                                 parameters={{
                                   frequencyLambdaExp: parseFloat(form.residualFrequencyLambdaExp) || 0
                                 }}
                                 title="Residual Frequency Distribution - Exponential"
                               />
                               <CumulativeDistributionChart
                                 distributionType="exponential"
                                 parameters={{
                                   frequencyLambdaExp: parseFloat(form.residualFrequencyLambdaExp) || 0
                                 }}
                                 title="Residual Frequency Distribution - Exponential"
                                 formatCurrency={null}
                               />
                             </td>
                           </tr>
                           </>
                         )}

                         <tr title="Confidence level for residual Value at Risk calculation" className="rar-tab-specific-content">
                           <td className="rar-form-label-cell">
                             <label className="rar-form-label">Residual Confidence Level:</label>
                           </td>
                           <td className="rar-form-input-cell">
                             <select
                               name="residualConfidenceLevel"
                               value={form.residualConfidenceLevel || form.confidenceLevel}
                               onChange={handleChange}
                               className="rar-select"
                             >
                               <option value="">Select Confidence Level</option>
                               <option value="90">90%</option>
                               <option value="95">95%</option>
                               <option value="99">99%</option>
                               <option value="99.5">99.5%</option>
                             </select>
                             {!form.residualConfidenceLevel && form.confidenceLevel && (
                               <small className="rar-help-text">
                                 Defaulting to main risk confidence level: {form.confidenceLevel}%
                               </small>
                             )}
                           </td>
                         </tr>

                         <tr title="Expected annual residual loss from Monte Carlo simulation" className="rar-tab-specific-content">
                           <td className="rar-form-label-cell">
                             <label className="rar-form-label">Residual Expected Annual Loss (EAL):</label>
                           </td>
                           <td className="rar-form-input-cell">
                             <input
                               type="text"
                               name="residualExpectedLoss"
                               value={calculateResidualMonteCarloExpectedLoss(form)}
                               readOnly
                               className="rar-input rar-input-readonly"
                             />
                             <small className="rar-help-text">
                               Calculated as: Mean(Residual Loss) × Mean(Residual Frequency) = {calculateResidualMonteCarloExpectedLoss(form)}
                             </small>
                           </td>
                         </tr>

                         <tr title="Residual Value at Risk at the selected confidence level" className="rar-tab-specific-content">
                           <td className="rar-form-label-cell">
                             <label className="rar-form-label">Residual Value at Risk (VaR):</label>
                           </td>
                           <td className="rar-form-input-cell">
                             <input
                               type="text"
                               name="residualValueAtRisk"
                               value={calculateResidualMonteCarloVaR(form)}
                               readOnly
                               className="rar-input rar-input-readonly"
                             />
                             <small className="rar-help-text">
                               {form.residualConfidenceLevel || form.confidenceLevel}% VaR based on distribution approximation
                             </small>
                           </td>
                         </tr>

                         <tr title="Summary of residual Monte Carlo simulation results" className="rar-tab-specific-content">
                           <td className="rar-form-label-cell">
                             <label className="rar-form-label">Residual Simulation Results:</label>
                           </td>
                           <td className="rar-form-input-cell">
                             <textarea
                               name="residualMonteCarloResults"
                               value={calculateResidualMonteCarloResults(form)}
                               readOnly
                               rows="12"
                               className="rar-textarea rar-input-readonly rar-textarea-monospace"
                             />
                             <small className="rar-help-text">
                               Automatically generated summary based on residual distribution approximation
                             </small>
                           </td>
                         </tr>

                         <tr title="Residual heat map display options" className="rar-tab-specific-content">
                           <td className="rar-form-label-cell">
                             <label className="rar-form-label">Residual Heat Map Display Options:</label>
                           </td>
                           <td className="rar-form-input-cell">
                             <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                               <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
                                 <input
                                   type="checkbox"
                                   checked={showVaR}
                                   onChange={(e) => setShowVaR(e.target.checked)}
                                 />
                                 <span style={{ color: '#0066ff', fontWeight: 'bold' }}>VaR Line</span>
                               </label>
                               <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
                                 <input
                                   type="checkbox"
                                   checked={showEAL}
                                   onChange={(e) => setShowEAL(e.target.checked)}
                                 />
                                 <span style={{ color: '#00cc66', fontWeight: 'bold' }}>EAL Line</span>
                               </label>
                               <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
                                 <input
                                   type="checkbox"
                                   checked={showPercentiles}
                                   onChange={(e) => setShowPercentiles(e.target.checked)}
                                 />
                                 <span>Percentile Lines</span>
                               </label>
                             </div>
                             <small className="rar-help-text">
                               Toggle visibility of different contour lines on the residual heat map
                             </small>
                           </td>
                         </tr>

                         <tr title="Joint residual unit cost and frequency heat map with probability density" className="rar-tab-specific-content">
                           <td colSpan="2" className="rar-form-input-cell">
                             {(() => {
                               const residualVarRaw = calculateResidualMonteCarloVaR(form);
                               const residualEalRaw = calculateResidualMonteCarloExpectedLoss(form);
                               
                               // Extract numeric values from potentially formatted strings
                               const extractNumericValue = (value) => {
                                 if (typeof value === 'number') return value;
                                 if (typeof value === 'string') {
                                   // Remove all currency symbols, commas, spaces, and extract number
                                   // This regex removes common currency symbols: $, €, £, ¥, ₩, ₹, ₽, ₪, ₣, ₱, ₺, ¤, etc.
                                   const cleaned = value.replace(/[$€£¥₩₹₽₪₣₱₺¤,\s]/g, '');
                                   const num = parseFloat(cleaned);
                                   return isNaN(num) ? 0 : num;
                                 }
                                 return 0;
                               };
                               
                               const residualVarValue = extractNumericValue(residualVarRaw);
                               const residualEalValue = extractNumericValue(residualEalRaw);
                               const residualVarStdDev = (residualVarValue * 0.15); // Default to 15% since no stddev function available
                               const residualEalStdDev = (residualEalValue * 0.15); // Default to 15% since no stddev function available
                               
                               console.log('Residual VaR & EAL Debug:', {
                                 residualVarRaw,
                                 residualEalRaw,
                                 residualVarValue,
                                 residualEalValue,
                                 residualVarStdDev,
                                 residualEalStdDev,
                                 showVaR,
                                 showEAL,
                                 formValues: {
                                   residualMinFrequency: form.residualMinFrequency,
                                   residualMaxFrequency: form.residualMaxFrequency,
                                   residualMinLoss: form.residualMinLoss,
                                   residualMaxLoss: form.residualMaxLoss
                                 }
                               });
                               
                               return (
                                 <RiskHeatMap
                                   frequencyDistribution={form.residualFrequencyDistribution || form.frequencyDistribution || 'triangular'}
                                   frequencyParams={{
                                     min: parseFloat(form.residualMinFrequency) || parseFloat(form.minFrequency) || parseFloat(form.residualFrequencyMean) - parseFloat(form.residualFrequencyStdDev) || parseFloat(form.frequencyMean) - parseFloat(form.frequencyStdDev) || 0.1,
                                     mode: parseFloat(form.residualMostLikelyFrequency) || parseFloat(form.mostLikelyFrequency) || parseFloat(form.residualFrequencyMean) || parseFloat(form.frequencyMean) || 1,
                                     max: parseFloat(form.residualMaxFrequency) || parseFloat(form.maxFrequency) || parseFloat(form.residualFrequencyMean) + parseFloat(form.residualFrequencyStdDev) || parseFloat(form.frequencyMean) + parseFloat(form.frequencyStdDev) || 10,
                                     mean: parseFloat(form.residualFrequencyMean) || parseFloat(form.frequencyMean) || parseFloat(form.residualFrequencyLambda) || parseFloat(form.frequencyLambda) || undefined,
                                     std: parseFloat(form.residualFrequencyStdDev) || parseFloat(form.frequencyStdDev) || undefined,
                                     lambda: parseFloat(form.residualFrequencyLambda) || parseFloat(form.frequencyLambda) || parseFloat(form.residualFrequencyLambdaExp) || parseFloat(form.frequencyLambdaExp) || undefined
                                   }}
                                   lossDistribution={form.residualLossDistribution || form.lossDistribution || 'triangular'}
                                   lossParams={{
                                     min: parseFloat(form.residualMinLoss) || parseFloat(form.minLoss) || parseFloat(form.residualLossMean) - parseFloat(form.residualLossStdDev) || parseFloat(form.lossMean) - parseFloat(form.lossStdDev) || 1000,
                                     mode: parseFloat(form.residualMostLikelyLoss) || parseFloat(form.mostLikelyLoss) || parseFloat(form.residualLossMean) || parseFloat(form.lossMean) || 50000,
                                     max: parseFloat(form.residualMaxLoss) || parseFloat(form.maxLoss) || parseFloat(form.residualLossMean) + parseFloat(form.residualLossStdDev) || parseFloat(form.lossMean) + parseFloat(form.lossStdDev) || 500000,
                                     mean: parseFloat(form.residualLossMean) || parseFloat(form.lossMean) || undefined,
                                     std: parseFloat(form.residualLossStdDev) || parseFloat(form.lossStdDev) || undefined,
                                     mu: parseFloat(form.residualLognormalMuLoss) || parseFloat(form.lognormalMuLoss) || undefined,
                                     sigma: parseFloat(form.residualLognormalSigmaLoss) || parseFloat(form.lognormalSigmaLoss) || undefined,
                                     alpha: parseFloat(form.residualBetaAlpha) || parseFloat(form.betaAlpha) || undefined,
                                     beta: parseFloat(form.residualBetaBeta) || parseFloat(form.betaBeta) || undefined
                                   }}
                                   formatCurrency={(value) => formatCurrency(value, form.residualSleCurrency || form.sleCurrency)}
                                   title="Residual Risk Assessment: Unit Cost × Frequency Heat Map"
                                   isResidual={true}
                                   iterations={form.residualMonteCarloIterations || form.monteCarloIterations || 10000}
                                   valueAtRisk={residualVarValue || residualVarRaw || null}
                                   expectedAnnualLoss={residualEalValue || residualEalRaw || null}
                                   valueAtRiskStdDev={residualVarStdDev || null}
                                   expectedAnnualLossStdDev={residualEalStdDev || null}
                                   showVaR={showVaR}
                                   showEAL={showEAL}
                                   showPercentiles={showPercentiles}
                                 />
                               );
                             })()}
                           </td>
                         </tr>

                         <tr title="Residual risk level based on Monte Carlo analysis" className="rar-tab-specific-content">
                           <td className="rar-form-label-cell">
                             <label className="rar-form-label">Residual Risk Level:</label>
                           </td>
                           <td className="rar-form-input-cell">
                             <input
                               type="text"
                               name="residualCalculatedRiskLevel"
                               value={getAdvancedQuantitativeRiskLevel(getResidualMonteCarloExpectedLossNumeric(form)) || 'Not Calculated'}
                               readOnly
                               className="rar-input rar-input-readonly"
                               style={{
                                 border: getAdvancedQuantitativeRiskLevel(getResidualMonteCarloExpectedLossNumeric(form)) ? 
                                   `2px solid ${getRiskColor(getAdvancedQuantitativeRiskLevel(getResidualMonteCarloExpectedLossNumeric(form)).charAt(0).toUpperCase() + getAdvancedQuantitativeRiskLevel(getResidualMonteCarloExpectedLossNumeric(form)).slice(1))}` : 
                                   '2px solid #ccc',
                                 backgroundColor: getAdvancedQuantitativeRiskLevel(getResidualMonteCarloExpectedLossNumeric(form)) ? 
                                   getRiskColor(getAdvancedQuantitativeRiskLevel(getResidualMonteCarloExpectedLossNumeric(form)).charAt(0).toUpperCase() + getAdvancedQuantitativeRiskLevel(getResidualMonteCarloExpectedLossNumeric(form)).slice(1)) : 
                                   '#f5f5f5',
                                 color: getAdvancedQuantitativeRiskLevel(getResidualMonteCarloExpectedLossNumeric(form)) ? "#fff" : "#333",
                               }}
                             />
                             <small className="rar-help-text">
                               Automatically calculated based on Residual Expected Loss: {calculateResidualMonteCarloExpectedLoss(form)}
                             </small>
                           </td>
                         </tr>
                       </>
                     )}
                     </>
                  )}
                  {/* General assessment fields - shown below both tabs */}
                  <tr title="Date for reviewing the risk assessment">
                    <td className="rar-form-label-cell">
                      <label className="rar-form-label">Review Date:</label>
                    </td>
                    <td className="rar-form-action-input-cell">
                      <input
                        type="date"
                        className="rar-input rar-input-date"
                        name="reviewDate"
                        value={form.reviewDate || ''}
                        onChange={handleChange}
                      />
                    </td>
                  </tr>

                  <tr title="Status of the risk assessment">
                    <td className="rar-form-label-cell">
                      <label className="rar-form-label">Status:</label>
                    </td>
                    <td className="rar-form-action-input-cell">
                      <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className="rar-select rar-select-status"
                        style={{
                          border: `2px solid ${form.status ? getStatusColor(form.status) : SC3_SECONDARY}`,
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
                        <td className="rar-form-label-cell">
                          <label className="rar-form-label">
                            Closed Date:
                          </label>
                        </td>
                        <td className="rar-form-action-input-cell">
                          <input
                            type="date"
                            defaultValue={getToday()}
                            name="closedDate"
                            value={form.closedDate}
                            onChange={handleChange}
                            className="rar-input rar-input-date"
                          />
                        </td>
                      </tr>

                      <tr title="Name of the person who closed the risk">
                        <td className="rar-form-label-cell">
                          <label className="rar-form-label">
                            Closed By:
                          </label>
                        </td>
                        <td className="rar-form-action-input-cell">
                          <input
                            type="text"
                            name="closedBy"
                            value={form.closedBy}
                            onChange={handleChange}
                            placeholder="Name of the person who closed the risk"
                            className="rar-input-action"
                          />
                        </td>
                      </tr>
                    </>
                  )}

                  {/* Approver field for all assessment types */}
                  <tr title="Name of the person who approves this risk assessment based on the risk level">
                    <td className="rar-form-label-cell">
                      <label className="rar-form-label">
                        Approver:
                      </label>
                    </td>
                    <td className="rar-form-action-input-cell">
                      <input
                        type="text"
                        name="approver"
                        value={form.approver}
                        onChange={handleChange}
                        placeholder={getApproverPlaceholder(
                          form.assessmentType === "qualitative" ? riskLevel : 
                          form.assessmentType === "quantitative" ? getQuantitativeRiskLevel(calculateALE(form)) : 
                          getAdvancedQuantitativeRiskLevel(getMonteCarloExpectedLossNumeric(form))
                        )}
                        className="rar-input-action"
                      />
                      <small className="rar-help-text">
                        {form.assessmentType === "qualitative" && riskLevel && (
                          <>Based on {riskLevel} risk level: {getApproverPlaceholder(riskLevel)}</>
                        )}
                        {form.assessmentType === "quantitative" && (
                          <>Based on quantitative assessment ({getQuantitativeRiskLevel(calculateALE(form))} risk level): {getApproverPlaceholder(getQuantitativeRiskLevel(calculateALE(form)))}</>
                        )}
                        {form.assessmentType === "advancedQuantitative" && (
                          <>Based on advanced quantitative assessment ({getAdvancedQuantitativeRiskLevel(getMonteCarloExpectedLossNumeric(form))} risk level): {getApproverPlaceholder(getAdvancedQuantitativeRiskLevel(getMonteCarloExpectedLossNumeric(form)))}</>
                        )}
                      </small>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Risk Matrix Visualization */}
              {form.assessmentType === "qualitative" && (riskLevel ||
                calculatedResidualRiskLevel ||
                form.residualRisk) && (
                <div className="rar-risk-matrix-container">
                  <h4 className="rar-risk-matrix-title">
                    Risk Assessment Matrix - Current Risk Position
                  </h4>
                  <div className="rar-risk-matrix-wrapper">
                    <table className="rar-risk-matrix-table">
                      <thead>
                        <tr>
                          <th className="rar-matrix-header">
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
                              className="rar-matrix-header-likelihood"
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
                            <td className="rar-matrix-severity-header">
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
                                  ((form.residualLikelihood &&
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
                                   (form.residualRisk &&
                                    cellRiskLevel?.toLowerCase() ===
                                      form.residualRisk.toLowerCase())));

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
                                  className="rar-matrix-cell"
                                  style={{
                                    background: getRiskColor(cellRiskLevel),
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
                  <div className="rar-matrix-legend">
                    <div className="rar-matrix-legend-item">
                      <span>🔴</span>
                      <span>Current Risk Level</span>
                    </div>
                    <div className="rar-matrix-legend-item">
                      <span>🟢</span>
                      <span>Residual Risk Level</span>
                    </div>
                  </div>

                  <div className="rar-matrix-color-legend">
                    <div className="rar-matrix-color-item">
                      <div
                        className="rar-risk-color-box"
                        style={{
                          background: getRiskColor("Low"),
                        }}
                      ></div>
                      <span>Low Risk</span>
                    </div>
                    <div className="rar-matrix-color-item">
                      <div
                        className="rar-risk-color-box"
                        style={{
                          background: getRiskColor("Medium"),
                        }}
                      ></div>
                      <span>Medium Risk</span>
                    </div>
                    <div className="rar-matrix-color-item">
                      <div
                        className="rar-risk-color-box"
                        style={{
                          background: getRiskColor("High"),
                        }}
                      ></div>
                      <span>High Risk</span>
                    </div>
                    <div className="rar-matrix-color-item">
                      <div
                        className="rar-risk-color-box"
                        style={{
                          background: getRiskColor("Extreme"),
                        }}
                      ></div>
                      <span>Extreme Risk</span>
                    </div>
                  </div>
                </div>
              )}
            </fieldset>

            <p className="rar-form-note">
              <strong>Note:</strong> RAR fields should be customized based on
              organisational risk management frameworks, industry requirements,
              and regulatory obligations. Consider adding custom fields for
              specific business contexts.
            </p>

            {/* Submit/Update Button */}
            <div className="rar-button-container">
              {isEditingRisk ? (
                <div className="rar-button-group">
                  <button
                    type="button"
                    onClick={handleUpdateRisk}
                    className="rar-btn rar-btn-warning"
                  >
                    Update Risk
                  </button>
                  <button
                    type="button"
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
                    className="rar-btn rar-btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="rar-button-group">
                  <button
                    type="button"
                    onClick={handleSubmitRisk}
                    className="rar-btn rar-btn-primary"
                  >
                    Submit Risk Details
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Discard changes and clear the form?",
                        )
                      ) {
                        clearRarFields();
                        setSelectedRiskIndex(null);
                        setIsEditingRisk(false);
                        setRarFieldsOpen(false);
                        setRisksOpen(true);
                      }
                    }}
                    className="rar-btn rar-btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </details>
    </form>
  );
};

export default InputForm;