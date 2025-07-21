import React from "react";
import "./RAR.css";

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
    handleRefreshMonteCarloSimulation,
    getMonteCarloExpectedLossNumeric,
    
    // Risk level functions
    getQuantitativeRiskLevel,
    getAdvancedQuantitativeRiskLevel,
    
    // Risk matrix
    riskMatrix
}) => {
  return (
    <form>
        {/* RAR Fields Section*/}
        <details open={rarFieldsOpen} className="rar-form-section">
          <summary
            className="rar-form-summary"
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
                        className="rar-input"
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
                      <tr title="Likelihood rating of the risk occurring (1-5 scale)">
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

                      <tr title="Impact rating of the risk if it occurs (1-5 scale)">
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

                      <tr title="Overall risk score calculated from likelihood and impact ratings">
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
                    </>
                  )}

                  {form.assessmentType === "quantitative" && (
                    <>
                      <tr title="Single Loss Expectancy (SLE) - expected loss from a single incident">
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
                              placeholder="Expected loss from a single incident (e.g., 10000)"
                              name="sle"
                              value={form.sle}
                              onChange={handleChange}
                              className="rar-input rar-input-currency"
                            />
                          </div>
                        </td>
                      </tr>

                      <tr title="Annual Rate of Occurrence (ARO) - expected frequency of incidents per year">
                        <td className="rar-form-label-cell">
                          <label className="rar-form-label">
                            Annual Rate of Occurrence (ARO):
                          </label>
                        </td>
                        <td className="rar-form-input-cell">
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Expected frequency per year (e.g., 0.5, 2.0)"
                            name="aro"
                            value={form.aro}
                            onChange={handleChange}
                            className="rar-input"
                          />
                        </td>
                      </tr>

                      <tr title="Annual Loss Expectancy (ALE) - expected loss per year">
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

                      <tr title="Number of simulation iterations (typically 10,000 or more)">
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

                      <tr title="Loss distribution type for Monte Carlo simulation">
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
                        </td>
                      </tr>

                      {/* Distribution-specific Loss Parameters */}
                      {(form.lossDistribution === "triangular") && (
                        <>
                          <tr title="Minimum loss value for the distribution">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">Minimum Loss:</label>
                            </td>
                            <td className="rar-form-input-cell">
                              <div className="rar-currency-input">
                                <select
                                  name="sleCurrency"
                                  value={form.sleCurrency}
                                  onChange={handleChange}
                                  className="rar-select-currency"
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
                                  className="rar-input-currency"
                                />
                              </div>
                            </td>
                          </tr>

                          <tr title="Most likely loss value for the distribution">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">Most Likely Loss (mode):</label>
                            </td>
                            <td className="rar-form-input-cell">
                              <div className="rar-currency-input">
                                <select
                                  name="sleCurrency"
                                  value={form.sleCurrency}
                                  onChange={handleChange}
                                  className="rar-select-currency"
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
                                  className="rar-input-currency"
                                />
                              </div>
                            </td>
                          </tr>

                          <tr title="Maximum loss value for the distribution">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">Maximum Loss:</label>
                            </td>
                            <td className="rar-form-input-cell">
                              <div className="rar-currency-input">
                                <select
                                  name="sleCurrency"
                                  value={form.sleCurrency}
                                  onChange={handleChange}
                                  className="rar-select-currency"
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
                                  className="rar-input-currency"
                                />
                              </div>
                            </td>
                          </tr>
                        </>
                      )}

                      {(form.lossDistribution === "normal" || form.lossDistribution === "lognormal") && (
                        <>
                          <tr title="Mean (average) loss value for the distribution">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">Mean Loss:</label>
                            </td>
                            <td className="rar-form-input-cell">
                              <div className="rar-currency-input">
                                <select
                                  name="sleCurrency"
                                  value={form.sleCurrency}
                                  onChange={handleChange}
                                  className="rar-select-currency"
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
                                  placeholder="Mean loss value"
                                  name="lossMean"
                                  value={form.lossMean}
                                  onChange={handleChange}
                                  className="rar-input-currency"
                                />
                              </div>
                            </td>
                          </tr>

                          <tr title="Standard deviation of loss values">
                            <td className="rar-form-label-cell">
                              <label className="rar-form-label">Loss Standard Deviation:</label>
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
                                  placeholder="Standard deviation"
                                  name="lossStdDev"
                                  value={form.lossStdDev}
                                  onChange={handleChange}
                                  className="rar-input rar-input-currency"
                                />
                              </div>
                            </td>
                          </tr>
                        </>
                      )}

                      {form.lossDistribution === "uniform" && (
                        <>
                          <tr title="Minimum loss value for uniform distribution">
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

                          <tr title="Maximum loss value for uniform distribution">
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
                                />
                              </div>
                            </td>
                          </tr>
                        </>
                      )}

                      {form.lossDistribution === "beta" && (
                        <>
                          <tr title="Minimum loss value for beta distribution">
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

                          <tr title="Maximum loss value for beta distribution">
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
                                />
                              </div>
                            </td>
                          </tr>

                          <tr title="Alpha parameter for beta distribution">
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

                          <tr title="Beta parameter for beta distribution">
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
                        </>
                      )}

                      <tr title="Frequency distribution type for Monte Carlo simulation">
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
                        </td>
                      </tr>

                      {/* Distribution-specific Frequency Parameters */}
                      {form.frequencyDistribution === "triangular" && (
                        <>
                          <tr title="Minimum frequency of occurrence per year">
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

                          <tr title="Most likely frequency of occurrence per year">
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

                          <tr title="Maximum frequency of occurrence per year">
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
                        </>
                      )}

                      {form.frequencyDistribution === "normal" && (
                        <>
                          <tr title="Mean frequency of occurrence per year">
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

                          <tr title="Standard deviation of frequency">
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
                        </>
                      )}

                      {form.frequencyDistribution === "uniform" && (
                        <>
                          <tr title="Minimum frequency of occurrence per year">
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

                          <tr title="Maximum frequency of occurrence per year">
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
                        </>
                      )}

                      {form.frequencyDistribution === "poisson" && (
                        <tr title="Lambda parameter for Poisson distribution (average event rate)">
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
                      )}

                      {form.frequencyDistribution === "exponential" && (
                        <tr title="Lambda parameter for exponential distribution (rate parameter)">
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
                      )}

                      <tr title="Confidence level for Value at Risk calculation">
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

                      <tr title="Expected annual loss from Monte Carlo simulation">
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

                      <tr title="Value at Risk at the selected confidence level">
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

                      <tr title="Summary of Monte Carlo simulation results">
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
                    </>
                  )}

                  <tr title="Risk level based on the assessment type">
                    <td className="rar-form-label-cell">
                      <label className="rar-form-label">Risk Level:</label>
                    </td>
                    <td className="rar-form-input-cell">
                      {form.assessmentType === "qualitative" ? (
                        <>
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
                            }}
                          />
                          <small className="rar-help-text">
                            Automatically determined based on Risk Assessment
                            Matrix
                          </small>
                        </>
                      ) : form.assessmentType === "advancedQuantitative" ? (
                        <>
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
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                    </td>
                  </tr>

                  <tr title="Strategy for treating the identified risk">
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

                  <tr title="Recommended actions to mitigate the risk">
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

                  <tr title="Person responsible for implementing the recommended actions">
                    <td className="rar-form-action-label-cell">
                      <label className="rar-form-action-label">Action Owner:</label>
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

                  <tr title="Target date for implementing the recommended actions">
                    <td className="rar-form-action-label-cell">
                      <label className="rar-form-action-label">Target Date:</label>
                    </td>
                    <td className="rar-form-action-input-cell">
                      <input
                        type="date"
                        name="targetDate"
                        value={form.targetDate}
                        onChange={handleChange}
                        className="rar-input-action"
                      />
                    </td>
                  </tr>

                  {form.assessmentType === "qualitative" && (
                    <>
                      <tr title="Likelihood of the risk occurring after implementing controls">
                        <td className="rar-form-action-label-cell">
                          <label className="rar-form-action-label">
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

                      <tr title="Risk impact after implementing controls">
                        <td className="rar-form-action-label-cell">
                          <label className="rar-form-action-label">
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
                    </>
                  )}

                  <tr title="Residual risk level after implementing controls">
                    <td className="rar-form-action-label-cell">
                      <label className="rar-form-action-label">
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

                  <tr title="Date for reviewing the risk assessment">
                    <td className="rar-form-action-label-cell">
                      <label className="rar-form-action-label">Review Date:</label>
                    </td>
                    <td className="rar-form-action-input-cell">
                      <input
                        type="date"
                        className="rar-input-action"
                      />
                    </td>
                  </tr>

                  <tr title="Status of the risk assessment">
                    <td className="rar-form-action-label-cell">
                      <label className="rar-form-action-label">Status:</label>
                    </td>
                    <td className="rar-form-action-input-cell">
                      <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                        className="rar-select-status"
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
                        <td className="rar-form-action-label-cell">
                          <label className="rar-form-action-label">
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
                            className="rar-input-action"
                          />
                        </td>
                      </tr>

                      <tr title="Name of the person who closed the risk">
                        <td className="rar-form-action-label-cell">
                          <label className="rar-form-action-label">
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
                    <td className="rar-form-action-label-cell">
                      <label className="rar-form-action-label">
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
              organizational risk management frameworks, industry requirements,
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