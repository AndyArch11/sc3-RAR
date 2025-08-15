import React, { useState } from "react";
import "./RAR.css";

// SC3.com.au theme colours and style constants
const SC3_PRIMARY = "#003366";      // Deep blue
const SC3_SECONDARY = "#0099cc";    // Bright blue
const SC3_GREEN = "#388e3c";        // Green
const SC3_TABLE_HEADER_BG = "#e5eef5";

const RARIntro = ({ 
    riskMatrix, 
    setRiskMatrix, 
    resetRiskMatrix, 
    handleMatrixChange, 
    getRiskColor,
    thresholds,
    setThresholds,
    thresholdCurrency,
    setThresholdCurrency,
    updateThreshold,
    restoreDefaultThresholds,
    formatCurrency
}) => {
    // State for guidance section
    const [showQualitativeGuidance, setShowQualitativeGuidance] = useState(false);

    // Function to scroll to top
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // Back to Top Button Component
    const BackToTopButton = ({ className = "" }) => (
        <div className={`rar-back-to-top-container ${className}`}>
            <button 
                onClick={scrollToTop}
                className="rar-back-to-top-btn"
                title="Back to Top"
            >
                ↑ Back to Top
            </button>
        </div>
    );

    return (        
        <details className="rar-intro-details">
          <summary className="rar-intro-summary">
            RAR Guidance and Preparation
          </summary>

          <p>A <i>Risk Assessment Report (RAR)</i> is a comprehensive document that outlines the findings of a risk assessment process, evaluating the risks to an organization's information assets and providing recommendations for mitigating those risks.</p>
          
          <div>
            <p>Also see:</p>
            <ul>
              <li>
                <em>
                  <a
                    href="https://www.iso.org/standard/27001"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rar-link"
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
                    className="rar-link"
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
                    className="rar-link"
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
                    className="rar-intro-link"
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
                    className="rar-intro-link"
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
                    className="rar-intro-link"
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
                    className="rar-intro-link"
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
                  <dt className="rar-intro-term">RAR Leader</dt>
                  <dd>
                    Responsible for overseeing the RAR process and ensuring its
                    alignment with business objectives and obtaining approval of
                    the RAR outcomes from management.
                  </dd>
                  <dt className="rar-intro-term">Asset Owner</dt>
                  <dd>
                    Responsible for providing detailed information about the
                    assets and their vulnerabilities. These can include tangible
                    and intangible assets, people, processes, technologies, and
                    their criticality as determined by the Business Impact Assessment
                    (BIA).
                  </dd>
                  <dt className="rar-intro-term">
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
            <div className="rar-guidance-container">
              <div className="rar-matrix-reset-container">
                <h3 className="rar-guidance-title">
                  Risk Assessment Matrix
                </h3>
                <button
                  onClick={resetRiskMatrix}
                  className="rar-matrix-reset-btn"
                >
                  Reset to Default
                </button>
              </div>
              <div className="rar-matrix-guidance-container">
                <table className="rar-matrix-guidance-table">
                  <thead>
                    <tr>
                      <th className="rar-matrix-guidance-header">
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
                          className="rar-matrix-guidance-header"
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
                          <td className="rar-matrix-guidance-severity">
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
                                className="rar-matrix-guidance-cell"
                                style={{
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
                                  className={`rar-matrix-guidance-select ${value === "Medium" ? "rar-matrix-guidance-select-light" : "rar-matrix-guidance-select-dark"}`}
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
              <div className="rar-risk-legend-container">
                <div className="rar-risk-legend-item">
                  <div
                    className="rar-risk-color-indicator"
                    style={{
                      background: getRiskColor("Low"),
                    }}
                  ></div>
                  <span>Low Risk</span>
                </div>
                <div className="rar-risk-legend-item">
                  <div
                    className="rar-risk-color-indicator"
                    style={{
                      background: getRiskColor("Medium"),
                    }}
                  ></div>
                  <span>Medium Risk</span>
                </div>
                <div className="rar-risk-legend-item">
                  <div
                    className="rar-risk-color-indicator"
                    style={{
                      background: getRiskColor("High"),
                    }}
                  ></div>
                  <span>High Risk</span>
                </div>
                <div className="rar-risk-legend-item">
                  <div
                    className="rar-risk-color-indicator"
                    style={{
                      background: getRiskColor("Extreme"),
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
            
            <BackToTopButton />
            
            {/* Severity Guidance Table */}
            <div className="rar-severity-section">
              <h3 className="rar-severity-title">
                Severity Guidance
              </h3>
              <div className="rar-severity-table-wrapper">
                {/* Outer wrapper for horizontal scroll so that scroll bar does not hide the last row - works for Chrome and Edge, not for Firefox */}
                <div className="rar-severity-table-scroll">
                  <table className="rar-severity-table">
                    <thead>
                      <tr>
                        <th className="rar-severity-table-header">
                          Severity Level
                        </th>
                        <th className="rar-severity-table-header-wide">
                          People
                        </th>
                        <th className="rar-severity-table-header-detailed-wide">
                          Assets & Technology/Systems
                        </th>
                        <th className="rar-severity-table-header-detailed">
                          Environment
                        </th>
                        <th className="rar-severity-table-header-detailed-wide">
                          Reputation & Customer Impact
                        </th>
                        <th className="rar-severity-table-header-detailed">
                          Financial
                        </th>
                        <th className="rar-severity-table-header-detailed">
                          Staff Retention
                        </th>
                        <th className="rar-severity-table-header-detailed-wide">
                          Information Security & Data Privacy
                        </th>
                        <th className="rar-severity-table-header-detailed-extra-wide">
                          Governance, Legal, Compliance & Regulatory
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td
                          className="rar-severity-table-header-cell"
                          style={{
                            background: SC3_TABLE_HEADER_BG,
                            border: `1px solid ${SC3_PRIMARY}`,
                          }}
                        >
                          Severe
                        </td>
                        <td className="rar-severity-table-cell">
                          Multiple fatalities or permanent disabilities
                        </td>
                        <td className="rar-severity-table-cell">
                          Complete loss of critical infrastructure; total system
                          failure
                        </td>
                        <td className="rar-severity-table-cell">
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
                        <td className="rar-severity-table-cell">
                          Threatens organizational survival
                        </td>
                        <td className="rar-severity-table-cell">
                          Mass exodus of key personnel
                        </td>
                        <td className="rar-severity-table-cell">
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
                        <td className="rar-severity-table-header-cell"
                          style={{
                            background: SC3_TABLE_HEADER_BG,
                          }}
                        >
                          Major
                        </td>
                        <td className="rar-severity-table-cell">
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
                        <td className="rar-severity-table-cell">
                          Serious environmental impact requiring remediation
                        </td>
                        <td className="rar-severity-table-cell">
                          National publicity; significant customer loss
                        </td>
                        <td className="rar-severity-table-cell">
                          Significant financial impact on operations
                        </td>
                        <td className="rar-severity-table-cell">
                          Loss of critical staff or leadership
                        </td>
                        <td className="rar-severity-table-cell">
                          Significant data breach; widespread privacy violations
                        </td>
                        <td className="rar-severity-table-cell">
                          Regulatory action; significant fines; political
                          intervention
                        </td>
                      </tr>
                      <tr>
                        <td className="rar-severity-table-header-cell"
                          style={{
                            background: SC3_TABLE_HEADER_BG,
                          }}
                        >
                          Moderate
                        </td>
                        <td className="rar-severity-table-cell">
                          Injury requiring medical treatment
                        </td>
                        <td className="rar-severity-table-cell">
                          Damage to non-critical assets; system performance
                          degradation
                        </td>
                        <td className="rar-severity-table-cell">
                          Limited environmental impact
                        </td>
                        <td className="rar-severity-table-cell">
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
                        <td className="rar-severity-table-cell">
                          Temporary loss of some staff
                        </td>
                        <td className="rar-severity-table-cell">
                          Limited data exposure; security incident
                        </td>
                        <td className="rar-severity-table-cell">
                          Regulatory notice; compliance breach; policy changes
                        </td>
                      </tr>
                      <tr>
                        <td className="rar-severity-table-header-cell"
                          style={{
                            background: SC3_TABLE_HEADER_BG,
                          }}
                        >
                          Minor
                        </td>
                        <td className="rar-severity-table-cell">
                          Minor injury requiring first aid
                        </td>
                        <td className="rar-severity-table-cell">
                          Minor damage, easily repaired; temporary system issues
                        </td>
                        <td className="rar-severity-table-cell">
                          Minimal environmental impact
                        </td>
                        <td className="rar-severity-table-cell">
                          Internal criticism; minor customer dissatisfaction
                        </td>
                        <td className="rar-severity-table-cell">
                          Minor financial impact
                        </td>
                        <td className="rar-severity-table-cell">
                          Minimal staff turnover
                        </td>
                        <td className="rar-severity-table-cell">
                          Minor security weakness; limited access exposure
                        </td>
                        <td className="rar-severity-table-cell">
                          Minor compliance issue; administrative requirements
                        </td>
                      </tr>
                      <tr>
                        <td className="rar-severity-table-header-cell"
                          style={{
                            background: SC3_TABLE_HEADER_BG,
                          }}
                        >
                          Negligible
                        </td>
                        <td className="rar-severity-table-cell">
                          No injury or very minor discomfort
                        </td>
                        <td className="rar-severity-table-cell">
                          No damage or insignificant damage; minor performance
                          impact
                        </td>
                        <td className="rar-severity-table-cell">
                          No environmental impact
                        </td>
                        <td className="rar-severity-table-cell">
                          No impact on reputation or customers
                        </td>
                        <td className="rar-severity-table-cell">
                          Negligible financial impact
                        </td>
                        <td className="rar-severity-table-cell">
                          No impact on staff retention
                        </td>
                        <td className="rar-severity-table-cell">
                          No security or privacy impact
                        </td>
                        <td className="rar-severity-table-cell">
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
            
            <BackToTopButton />
            
            {/* Severity Level Sign-off Table */}
            <div className="rar-threshold-section">
              <h3 className="rar-threshold-title">
                Severity Risk Level Sign-off Authority
              </h3>
              <div className="rar-threshold-header">
                <div className="rar-threshold-controls">
                  <label className="rar-threshold-label">
                    Threshold Currency:
                  </label>
                  <select
                    value={thresholdCurrency}
                    onChange={(e) => setThresholdCurrency(e.target.value)}
                    className="rar-threshold-select"
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
                </div>
                <button
                  type="button"
                  onClick={restoreDefaultThresholds}
                  className="rar-threshold-reset-btn"
                >
                  Restore Default Thresholds
                </button>
              </div>
              <div className="rar-threshold-table-container">
                <table className="rar-threshold-table">
                  <thead>
                    <tr>
                      <th className="rar-threshold-table-header">
                        Severity Risk Level
                      </th>
                      <th className="rar-threshold-table-header">
                        Quantitative ALE Threshold
                      </th>
                      <th className="rar-threshold-table-header">
                        Advanced Quantitative Expected Loss Threshold
                      </th>
                      <th className="rar-threshold-table-header">
                        Typical Corporate Roles Required for Sign-off
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="rar-table-row-transition">
                      <td className="rar-risk-cell"
                        style={{
                          background: getRiskColor("Extreme"),
                        }}
                      >
                        Extreme
                      </td>
                      <td className="rar-threshold-table-cell-center">
                        ≥ <input
                          type="number"
                          value={thresholds.quantitative.extreme}
                          onChange={(e) => updateThreshold('quantitative', 'extreme', null, e.target.value)}
                          className="rar-threshold-input-wide"
                        />
                        <div className="rar-threshold-currency-display">
                          {formatCurrency(thresholds.quantitative.extreme, thresholdCurrency)}
                        </div>
                      </td>
                      <td className="rar-threshold-table-cell-center">
                        ≥ <input
                          type="number"
                          value={thresholds.advancedQuantitative.extreme}
                          onChange={(e) => updateThreshold('advancedQuantitative', 'extreme', null, e.target.value)}
                          className="rar-threshold-input-wide"
                        />
                        <div className="rar-threshold-currency-display">
                          {formatCurrency(thresholds.advancedQuantitative.extreme, thresholdCurrency)}
                        </div>
                      </td>
                      <td className="rar-threshold-table-cell-left">
                        CEO, Board of Directors, Chief Risk Officer (CRO), Chief Executive Officer
                      </td>
                    </tr>
                    <tr className="rar-table-row-transition">
                      <td className="rar-risk-cell"
                        style={{
                          background: getRiskColor("High"),
                        }}
                      >
                        High
                      </td>
                      <td className="rar-threshold-table-cell-center">
                        <input
                          type="number"
                          value={thresholds.quantitative.high.min}
                          onChange={(e) => updateThreshold('quantitative', 'high', 'min', e.target.value)}
                          className="rar-threshold-input-small"
                        />
                        {" - "}
                        <input
                          type="number"
                          value={thresholds.quantitative.high.max}
                          onChange={(e) => updateThreshold('quantitative', 'high', 'max', e.target.value)}
                          className="rar-threshold-input-small"
                        />
                        <div className="rar-threshold-currency-display">
                          {formatCurrency(thresholds.quantitative.high.min, thresholdCurrency)} - {formatCurrency(thresholds.quantitative.high.max, thresholdCurrency)}
                        </div>
                      </td>
                      <td className="rar-threshold-table-cell-center">
                        <input
                          type="number"
                          value={thresholds.advancedQuantitative.high.min}
                          onChange={(e) => updateThreshold('advancedQuantitative', 'high', 'min', e.target.value)}
                          className="rar-threshold-input-small"
                        />
                        {" - "}
                        <input
                          type="number"
                          value={thresholds.advancedQuantitative.high.max}
                          onChange={(e) => updateThreshold('advancedQuantitative', 'high', 'max', e.target.value)}
                          className="rar-threshold-input-small"
                        />
                        <div className="rar-threshold-currency-display">
                          {formatCurrency(thresholds.advancedQuantitative.high.min, thresholdCurrency)} - {formatCurrency(thresholds.advancedQuantitative.high.max, thresholdCurrency)}
                        </div>
                      </td>
                      <td className="rar-threshold-table-cell-left">
                        Chief Risk Officer (CRO), Chief Financial Officer (CFO), Chief Operating Officer (COO), Executive Management Team
                      </td>
                    </tr>
                    <tr className="rar-table-row-transition">
                      <td className="rar-risk-cell"
                        style={{
                          background: getRiskColor("Medium"),
                          color: "#000",
                        }}
                      >
                        Medium
                      </td>
                      <td className="rar-threshold-table-cell-center">
                        <input
                          type="number"
                          value={thresholds.quantitative.medium.min}
                          onChange={(e) => updateThreshold('quantitative', 'medium', 'min', e.target.value)}
                          className="rar-threshold-input-small"
                        />
                        {" - "}
                        <input
                          type="number"
                          value={thresholds.quantitative.medium.max}
                          onChange={(e) => updateThreshold('quantitative', 'medium', 'max', e.target.value)}
                          className="rar-threshold-input-small"
                        />
                        <div className="rar-threshold-currency-display">
                          {formatCurrency(thresholds.quantitative.medium.min, thresholdCurrency)} - {formatCurrency(thresholds.quantitative.medium.max, thresholdCurrency)}
                        </div>
                      </td>
                      <td className="rar-threshold-table-cell-center">
                        <input
                          type="number"
                          value={thresholds.advancedQuantitative.medium.min}
                          onChange={(e) => updateThreshold('advancedQuantitative', 'medium', 'min', e.target.value)}
                          className="rar-threshold-input-small"
                        />
                        {" - "}
                        <input
                          type="number"
                          value={thresholds.advancedQuantitative.medium.max}
                          onChange={(e) => updateThreshold('advancedQuantitative', 'medium', 'max', e.target.value)}
                          className="rar-threshold-input-small"
                        />
                        <div className="rar-threshold-currency-display">
                          {formatCurrency(thresholds.advancedQuantitative.medium.min, thresholdCurrency)} - {formatCurrency(thresholds.advancedQuantitative.medium.max, thresholdCurrency)}
                        </div>
                      </td>
                      <td className="rar-threshold-table-cell-left">
                        Senior Management, Division/Department Heads, Risk Management Committee, General Manager
                      </td>
                    </tr>
                    <tr className="rar-table-row-transition">
                      <td className="rar-risk-cell"
                        style={{
                          background: getRiskColor("Low"),
                        }}
                      >
                        Low
                      </td>
                      <td className="rar-threshold-table-cell-center">
                        &lt; <input
                          type="number"
                          value={thresholds.quantitative.low}
                          onChange={(e) => updateThreshold('quantitative', 'low', null, e.target.value)}
                          className="rar-threshold-input-wide"
                        />
                        <div className="rar-threshold-currency-display">
                          &lt; {formatCurrency(thresholds.quantitative.low, thresholdCurrency)}
                        </div>
                      </td>
                      <td className="rar-threshold-table-cell-center">
                        &lt; <input
                          type="number"
                          value={thresholds.advancedQuantitative.low}
                          onChange={(e) => updateThreshold('advancedQuantitative', 'low', null, e.target.value)}
                          className="rar-threshold-input-wide"
                        />
                        <div className="rar-threshold-currency-display">
                          &lt; {formatCurrency(thresholds.advancedQuantitative.low, thresholdCurrency)}
                        </div>
                      </td>
                      <td className="rar-threshold-table-cell-left">
                        Line Managers, Team Leaders, Risk Coordinators, Operational Management
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="rar-threshold-note">
                <strong>Note:</strong> Sign-off requirements may vary based on organisational structure and risk appetite. 
                Adjust these roles to reflect your organisation's governance framework and delegation authorities.
                <br /><br />
                <strong>Threshold Guidance:</strong>
                <br />• <strong>Quantitative ALE Threshold:</strong> Annual Loss Expectancy calculated as SLE × ARO
                <br />• <strong>Advanced Quantitative Expected Loss Threshold:</strong> Expected Loss from Monte Carlo simulation
                <br />• These thresholds can be adjusted based on your organisation's risk appetite and financial capacity
                <br /><br />
                <strong>Monte Carlo Assessments:</strong> Monte Carlo based assessments will also often have action thresholds against 
                Value at Risk (VaR) and Single Loss Exposure values. These additional thresholds help organisations set decision 
                criteria for risk treatment based on statistical risk measures and maximum potential losses from individual events.
              </p>
            </div>
            
            {/* Qualitative Assessment Options Section */}
            <div className="rar-guidance-container">
              
              <BackToTopButton />
              
              <div
                className="rar-guidance-toggle"
                onClick={() => setShowQualitativeGuidance(!showQualitativeGuidance)}
              >
                <h3 className="rar-guidance-title">
                  Assessment Options & Usage Guidelines
                </h3>
                <span className="rar-guidance-toggle-icon">
                  {showQualitativeGuidance ? "−" : "+"}
                </span>
              </div>              {showQualitativeGuidance && (
                <div className="rar-guidance-content">
                  <div className="rar-assessment-overview">
                    <h4 className="rar-assessment-overview-title">
                      Assessment Types Overview
                    </h4>
                    <div className="rar-assessment-grid">
                      
                      {/* Qualitative Assessment */}
                      <div className="rar-assessment-card rar-assessment-card-qualitative">
                        <h5 className="rar-assessment-card-title rar-assessment-card-title-qualitative">
                          📊 Qualitative Assessment
                        </h5>
                        <p className="rar-assessment-card-text">
                          <strong>Best for:</strong> Initial risk assessments, routine operational risks, or when quantitative data is limited
                        </p>
                        <p className="rar-assessment-card-text">
                          <strong>Method:</strong> Uses likelihood and impact scales (1-5) with predefined risk matrix
                        </p>
                        <p className="rar-assessment-card-text">
                          <strong>Common Use Cases:</strong>
                        </p>
                        <ul className="rar-assessment-card-list">
                          <li>Operational risk assessments</li>
                          <li>Compliance and regulatory risks</li>
                          <li>Human resource risks</li>
                          <li>Reputational risks</li>
                          <li>Strategic planning risks</li>
                        </ul>
                      </div>
                      
                      {/* Quantitative Assessment */}
                      <div className="rar-assessment-card rar-assessment-card-quantitative">
                        <h5 className="rar-assessment-card-title rar-assessment-card-title-quantitative">
                          💰 Quantitative Assessment
                        </h5>
                        <p className="rar-assessment-card-text">
                          <strong>Best for:</strong> Financial risks where loss values can be estimated with reasonable accuracy
                        </p>
                        <p className="rar-assessment-card-text">
                          <strong>Method:</strong> Uses Single Loss Expectancy (SLE) and Annual Rate of Occurrence (ARO) to calculate Annual Loss Expectancy (ALE)
                        </p>
                        <p className="rar-assessment-card-text">
                          <strong>Common Use Cases:</strong>
                        </p>
                        <ul className="rar-assessment-card-list">
                          <li>IT security incidents with measurable business impact</li>
                          <li>Equipment failure risks</li>
                          <li>Business interruption scenarios</li>
                          <li>Fraud and financial crime risks</li>
                          <li>Supply chain disruption risks</li>
                        </ul>
                      </div>
                      
                      {/* Advanced Quantitative Assessment */}
                      <div className="rar-assessment-card rar-assessment-card-advanced">
                        <h5 className="rar-assessment-card-title rar-assessment-card-title-advanced">
                          🎯 Advanced Quantitative Assessment (Monte Carlo)
                        </h5>
                        <p className="rar-assessment-card-text">
                          <strong>Best for:</strong> Complex risks requiring statistical modeling and uncertainty analysis
                        </p>
                        <p className="rar-assessment-card-text">
                          <strong>Method:</strong> Uses Monte Carlo simulation with probability distributions for loss severity and frequency
                        </p>
                        <p className="rar-assessment-card-text">
                          <strong>Common Use Cases:</strong>
                        </p>
                        <ul className="rar-assessment-card-list">
                          <li>High-value cyber security risks</li>
                          <li>Market and credit risk modeling</li>
                          <li>Natural disaster and catastrophic risks</li>
                          <li>Complex operational risks with variable impacts</li>
                          <li>Regulatory capital calculations</li>
                          <li>Investment and project risk analysis</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rar-selection-guidelines">
                    <h4 className="rar-selection-guidelines-title">
                      Selection Guidelines
                    </h4>
                    <div className="rar-selection-guidelines-container">
                      <div className="rar-selection-section">
                        <strong className="rar-selection-title-qualitative">Start with Qualitative</strong> for:
                        <ul className="rar-selection-list">
                          <li>New risk identification exercises</li>
                          <li>Risks where financial impact is difficult to quantify</li>
                          <li>Regulatory or compliance-focused assessments</li>
                          <li>Quick initial risk screening</li>
                        </ul>
                      </div>
                      
                      <div className="rar-selection-section">
                        <strong className="rar-selection-title-quantitative">Progress to Quantitative</strong> when:
                        <ul className="rar-selection-list">
                          <li>Financial impact can be reasonably estimated</li>
                          <li>Historical data is available for loss calculations</li>
                          <li>Business case development requires cost-benefit analysis</li>
                          <li>Risk appetite is defined in financial terms</li>
                        </ul>
                      </div>
                      
                      <div className="rar-selection-section">
                        <strong className="rar-selection-title-advanced">Use Advanced Quantitative</strong> for:
                        <ul className="rar-selection-list">
                          <li>High-impact, low-probability events</li>
                          <li>Risks with significant uncertainty in impact or frequency</li>
                          <li>Regulatory reporting requiring statistical measures</li>
                          <li>Complex scenarios requiring confidence intervals</li>
                          <li>Portfolio-level risk aggregation</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rar-distribution-section-container">
                    <h4 className="rar-distribution-main-header">
                      Distribution Types for Advanced Quantitative Assessments
                    </h4>
                    <p className="rar-distribution-intro">
                      When using Advanced Quantitative assessments, you'll need to select probability distributions 
                      for both loss severity and frequency. Each distribution type is suited for different scenarios:
                    </p>
                    
                    <div className="rar-distribution-grid">
                      <div className="rar-distribution-section">
                        <h5 className="rar-distribution-title">
                          📊 Loss Severity Distributions
                        </h5>
                        
                        <div className="rar-distribution-content">
                          <div className="rar-distribution-item">
                            <strong className="rar-distribution-name">Triangular Loss Distribution</strong>
                            <p className="rar-distribution-detail">
                              <strong>Best for:</strong> When you have minimum, most likely, and maximum loss estimates
                            </p>
                            <p className="rar-distribution-detail">
                              <strong>Use when:</strong> Expert judgment provides three-point estimates, common in business impact assessments
                            </p>
                          </div>
                          
                          <div className="rar-distribution-item">
                            <strong className="rar-distribution-name">Modified PERT Loss Distribution</strong>
                            <p className="rar-distribution-detail">
                              <strong>Best for:</strong> Enhanced triangular analysis with adjustable confidence levels and tail behavior
                            </p>
                            <p className="rar-distribution-detail">
                              <strong>Use when:</strong> Expert estimates require fine-tuning between optimistic and pessimistic scenarios, complex project risks with variable confidence
                            </p>
                          </div>
                          
                          <div className="rar-distribution-item">
                            <strong className="rar-distribution-name-normal">Normal Loss Distribution</strong>
                            <p className="rar-distribution-detail">
                              <strong>Best for:</strong> Symmetric losses around a mean with known standard deviation
                            </p>
                            <p className="rar-distribution-detail">
                              <strong>Use when:</strong> Historical data shows symmetric loss patterns, operational losses
                            </p>
                          </div>
                          
                          <div className="rar-distribution-item">
                            <strong className="rar-distribution-name-lognormal">Log-normal Loss Distribution</strong>
                            <p className="rar-distribution-detail">
                              <strong>Best for:</strong> Right-skewed losses with potential for extreme values
                            </p>
                            <p className="rar-distribution-detail">
                              <strong>Use when:</strong> Financial losses, cyber incidents, natural disasters
                            </p>
                          </div>
                          
                          <div className="rar-distribution-item">
                            <strong className="rar-distribution-name-uniform">Uniform Loss Distribution</strong>
                            <p className="rar-distribution-detail">
                              <strong>Best for:</strong> Equal probability across a range of loss values
                            </p>
                            <p className="rar-distribution-detail">
                              <strong>Use when:</strong> Limited information, worst-case scenario analysis
                            </p>
                          </div>
                          
                          <div className="rar-distribution-item">
                            <strong className="rar-distribution-name-beta">Beta Distribution</strong>
                            <p className="rar-distribution-detail">
                              <strong>Best for:</strong> Bounded losses with flexible shape parameters
                            </p>
                            <p className="rar-distribution-detail">
                              <strong>Use when:</strong> Project risks, performance metrics, bounded scenarios
                            </p>
                          </div>
                          
                          <div className="rar-distribution-item">
                            <strong className="rar-distribution-name-gamma">Gamma Distribution</strong>
                            <p className="rar-distribution-detail">
                              <strong>Best for:</strong> Right-skewed losses with waiting time characteristics and flexible shape control
                            </p>
                            <p className="rar-distribution-detail">
                              <strong>Use when:</strong> Modeling aggregate losses, insurance claims, time-to-event scenarios, reliability analysis
                            </p>
                          </div>
                          
                          <div className="rar-distribution-item">
                            <strong className="rar-distribution-name-pareto">Pareto Distribution</strong>
                            <p className="rar-distribution-detail">
                              <strong>Best for:</strong> Heavy-tailed losses following the 80/20 principle with extreme value potential
                            </p>
                            <p className="rar-distribution-detail">
                              <strong>Use when:</strong> Catastrophic losses, cyber security breaches, operational risk events, wealth distribution modeling
                            </p>
                          </div>
                          
                          <div className="rar-distribution-item">
                            <strong className="rar-distribution-name-weibull">Weibull Distribution</strong>
                            <p className="rar-distribution-detail">
                              <strong>Best for:</strong> Failure analysis and reliability modeling with varying hazard rates over time
                            </p>
                            <p className="rar-distribution-detail">
                              <strong>Use when:</strong> Equipment failure costs, product lifecycle losses, survival analysis, maintenance scheduling
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="rar-distribution-section-freq">
                        <h5 className="rar-distribution-title">
                          📈 Frequency Distributions
                        </h5>
                        
                        <div className="rar-distribution-content">
                          <div className="rar-distribution-item">
                            <strong className="rar-distribution-name">Triangular Frequency Distribution</strong>
                            <p className="rar-distribution-detail">
                              <strong>Best for:</strong> Three-point estimates of event frequency per year
                            </p>
                            <p className="rar-distribution-detail">
                              <strong>Use when:</strong> Expert estimates of minimum, most likely, and maximum frequency
                            </p>
                          </div>
                          
                          <div className="rar-distribution-item">
                            <strong className="rar-distribution-name">Modified PERT Frequency Distribution</strong>
                            <p className="rar-distribution-detail">
                              <strong>Best for:</strong> Enhanced three-point frequency estimates with gamma parameter control
                            </p>
                            <p className="rar-distribution-detail">
                              <strong>Use when:</strong> Expert frequency estimates with varying confidence levels, adjustable distribution shape for different risk scenarios
                            </p>
                          </div>
                          
                          <div className="rar-distribution-item">
                            <strong className="rar-distribution-name-normal">Normal Frequency Distribution</strong>
                            <p className="rar-distribution-detail">
                              <strong>Best for:</strong> Symmetric frequency patterns with known variability
                            </p>
                            <p className="rar-distribution-detail">
                              <strong>Use when:</strong> Historical data shows normal distribution, operational events
                            </p>
                          </div>
                          
                          <div className="rar-distribution-item">
                            <strong className="rar-distribution-name-lognormal">Poisson Frequency Distribution</strong>
                            <p className="rar-distribution-detail">
                              <strong>Best for:</strong> Rare events with known average rate
                            </p>
                            <p className="rar-distribution-detail">
                              <strong>Use when:</strong> Security incidents, equipment failures, system outages
                            </p>
                          </div>
                          
                          <div className="rar-distribution-item">
                            <strong className="rar-distribution-name-uniform">Discrete Uniform Frequency Distribution</strong>
                            <p className="rar-distribution-detail">
                              <strong>Best for:</strong> Equal probability for each discrete outcome within a defined range
                            </p>
                            <p className="rar-distribution-detail">
                              <strong>Use when:</strong> Dice-roll scenarios, random sampling, equally likely discrete events
                            </p>
                          </div>
                          
                          <div className="rar-distribution-item-indent">
                            <strong className="rar-distribution-type-header">Uniform Frequency Distribution</strong>
                            <p className="rar-distribution-detail-small">
                              <strong>Best for:</strong> Equal probability across a frequency range
                            </p>
                            <p className="rar-distribution-detail-small">
                              <strong>Use when:</strong> Limited frequency data, conservative assumptions. As it models a continuous range rather than discrete events, it is best for scenarios where any value within a range is equally likely and event counts are not restricted to whole numbers. Not usually appropriate to use in frequency distributions for scenarios with distinct, countable events.
                            </p>
                          </div>
                          
                          <div className="rar-distribution-item">
                            <strong className="rar-distribution-name-beta">Exponential Frequency Distribution</strong>
                            <p className="rar-distribution-detail">
                              <strong>Best for:</strong> Time between events, failure rates
                            </p>
                            <p className="rar-distribution-detail">
                              <strong>Use when:</strong> Modeling time to failure, service intervals
                            </p>
                          </div>
                          
                          <div className="rar-distribution-item">
                            <strong className="rar-distribution-name-gamma">Negative Binomial Frequency Distribution</strong>
                            <p className="rar-distribution-detail">
                              <strong>Best for:</strong> Discrete count events with overdispersion and clustering behavior
                            </p>
                            <p className="rar-distribution-detail">
                              <strong>Use when:</strong> Quality control failures, reliability testing, events that occur in bursts or clusters
                            </p>
                          </div>
                          
                          <div className="rar-distribution-item">
                            <strong className="rar-distribution-name-pareto">Binomial Frequency Distribution</strong>
                            <p className="rar-distribution-detail">
                              <strong>Best for:</strong> Fixed number of independent trials with known success probability
                            </p>
                            <p className="rar-distribution-detail">
                              <strong>Use when:</strong> Pass/fail testing scenarios, compliance audits, binary outcome processes
                            </p>
                          </div>
                          
                          <div className="rar-distribution-item">
                            <strong className="rar-distribution-name-weibull">Geometric Frequency Distribution</strong>
                            <p className="rar-distribution-detail">
                              <strong>Best for:</strong> Number of trials until first success or breakthrough event
                            </p>
                            <p className="rar-distribution-detail">
                              <strong>Use when:</strong> Time-to-first-failure analysis, breakthrough incidents, first occurrence modeling
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rar-distribution-guidelines">
                      <h5 className="rar-distribution-guidelines-title">
                        🎯 Loss Severity Distribution Selection Guidelines
                      </h5>
                      <ul className="rar-distribution-guidelines-list">
                        <li><strong>Start with Triangular</strong> - Most intuitive for business users, requires min/mode/max estimates</li>
                        <li><strong>Choose Modified PERT</strong> - For enhanced triangular analysis with adjustable confidence and tail behavior via gamma parameter (1-10)</li>
                        <li><strong>Use Normal</strong> - When you have historical mean and standard deviation data</li>
                        <li><strong>Choose Log-normal</strong> - For financial losses or when extreme values are possible</li>
                        <li><strong>Consider Uniform</strong> - When making conservative assumptions with limited data</li>
                        <li><strong>Apply Beta</strong> - For bounded scenarios requiring flexible shape control</li>
                        <li><strong>Use Gamma</strong> - For modeling time until an event occurs</li>
                        <li><strong>Chose Pareto</strong> - For modeling distributions with a heavy tail, often used in business contexts to represent the 80/20 rule</li>
                        <li><strong>Select Weibull</strong> - For modeling life data and failure times with varying hazard rates</li>
                      </ul>
                      
                      <h5 className="rar-distribution-guidelines-title">
                        🎯 Frequency Distribution Selection Guidelines
                      </h5>
                      <ul className="rar-distribution-guidelines-list">
                        <li><strong>Start with Poisson</strong> - Most intuitive for business users, requires min/mode/max estimates. For rare events with known average occurrence rates</li>
                        <li><strong>Or begin with Triangular</strong> - For a simple and flexible approach with min/mode/max estimates</li>
                        <li><strong>Choose Modified PERT</strong> - For enhanced three-point frequency estimates with gamma parameter control</li>
                        <li><strong>Use Normal</strong> - For scenarios where data is symmetrically distributed around a mean</li>
                        <li><strong>Consider Discrete Uniform</strong> - For scenarios with equally likely discrete outcomes within a defined range</li>
                        <li><strong>Explore Continuous Uniform</strong> - For scenarios with equally likely continuous outcomes within a defined range</li>
                        <li><strong>Use Exponential</strong> - For modeling time until an event occurs</li>
                        <li><strong>Use Negative Binomial</strong> - For discrete count events with overdispersion and clustering behavior where you have historical mean and standard deviation data</li>
                        <li><strong>Apply Binomial</strong> - For scenarios with a fixed number of trials and two possible outcomes</li>
                        <li><strong>Consider Geometric</strong> - For modelling financial losses or when extreme values are possible, or for modeling the number of trials until the first success in a series of Bernoulli trials</li>
                      </ul>
                    </div>   
                    <p></p>                 
                  
                    <div className="rar-distribution-pairings">
                      <h5 className="rar-distribution-guidelines-title">
                        🔗 Practical Distribution Pairings
                      </h5>
                      <p className="rar-distribution-intro">
                        Effective risk modeling often involves pairing severity and frequency distributions that complement each other's characteristics. Here are proven combinations for common risk scenarios:
                      </p>
                      
                      <div className="rar-distribution-pairings-grid">
                        <div className="rar-distribution-pairing-item">
                          <strong className="rar-pairing-title">🔐 Data Breach Modeling</strong>
                          <p className="rar-pairing-combo"><strong>Log-Normal + Poisson</strong></p>
                          <p className="rar-pairing-detail">
                            Heavy-tailed loss impacts with rare but predictable breach frequency. Log-normal captures extreme financial losses while Poisson models discrete security incidents.
                          </p>
                        </div>
                        
                        <div className="rar-distribution-pairing-item">
                          <strong className="rar-pairing-title">☁️ Cloud Misconfigurations</strong>
                          <p className="rar-pairing-combo"><strong>Gamma + Negative Binomial</strong></p>
                          <p className="rar-pairing-detail">
                            Variable remediation costs with clustered configuration failures. Gamma models aggregate fix costs while Negative Binomial captures overdispersed failure patterns.
                          </p>
                        </div>
                        
                        <div className="rar-distribution-pairing-item">
                          <strong className="rar-pairing-title">🚀 Deployment Failures</strong>
                          <p className="rar-pairing-combo"><strong>Triangular + Binomial</strong></p>
                          <p className="rar-pairing-detail">
                            Three-point cost estimates with fixed deployment cycles. Triangular provides expert-judged loss ranges while Binomial models success/failure rates across deployments.
                          </p>
                        </div>
                        
                        <div className="rar-distribution-pairing-item">
                          <strong className="rar-pairing-title">🦠 Ransomware Attacks</strong>
                          <p className="rar-pairing-combo"><strong>Pareto + Poisson</strong></p>
                          <p className="rar-pairing-detail">
                            Catastrophic financial impacts with rare occurrence patterns. Pareto captures extreme ransom demands while Poisson models independent attack frequency.
                          </p>
                        </div>
                        
                        <div className="rar-distribution-pairing-item">
                          <strong className="rar-pairing-title">📊 Early Project Risk</strong>
                          <p className="rar-pairing-combo"><strong>Triangular + Discrete Uniform</strong></p>
                          <p className="rar-pairing-detail">
                            Conservative cost estimation with equal likelihood scenarios. Triangular provides min/mode/max cost bounds while Discrete Uniform ensures unbiased frequency assumptions.
                          </p>
                        </div>
                        
                        <div className="rar-distribution-pairing-item">
                          <strong className="rar-pairing-title">⚙️ Equipment Reliability</strong>
                          <p className="rar-pairing-combo"><strong>Weibull + Geometric</strong></p>
                          <p className="rar-pairing-detail">
                            Failure cost analysis with time-to-first-failure modeling. Weibull captures lifecycle-dependent repair costs while Geometric models trials until breakthrough failure.
                          </p>
                        </div>
                        
                        <div className="rar-distribution-pairing-item">
                          <strong className="rar-pairing-title">🎯 Compliance Testing</strong>
                          <p className="rar-pairing-combo"><strong>Beta + Binomial</strong></p>
                          <p className="rar-pairing-detail">
                            Bounded penalty structures with audit cycles. Beta provides flexible penalty modeling within regulatory bounds while Binomial captures pass/fail audit outcomes.
                          </p>
                        </div>
                        
                        <div className="rar-distribution-pairing-item">
                          <strong className="rar-pairing-title">🔄 Operational Incidents</strong>
                          <p className="rar-pairing-combo"><strong>Normal + Exponential</strong></p>
                          <p className="rar-pairing-detail">
                            Stable operational costs with memoryless incident timing. Normal models predictable response costs while Exponential captures time-between-events patterns.
                          </p>
                        </div>
                      </div>
                      
                      <div className="rar-pairing-tips">
                        <p className="rar-pairing-guidance">
                          <strong>💡 Selection Tip:</strong> Consider the underlying risk mechanics - are losses bounded or unbounded? Do events cluster or occur independently? Match distribution characteristics to your risk's behavioral patterns.
                        </p>
                      </div>
                    </div>
                    <p></p>                 

                    <div className="rar-pro-tip">
                      <h4 className="rar-pro-tip-title">
                        💡 Pro Tip
                      </h4>
                      <p className="rar-pro-tip-content">
                        Many organizations use a <strong>graduated approach</strong>: Start with qualitative assessments 
                        for risk identification, then advance to quantitative methods for high-priority risks requiring 
                        detailed analysis or business case development. Advanced quantitative methods are typically 
                        reserved for critical risks, regulatory requirements, or strategic decision-making.
                    </p>
                  </div>                  
                  
                  <BackToTopButton />
                  
                  <div className="rar-treatment-strategies-section">
                    <h4 className="rar-treatment-strategies-title">
                      Risk Treatment Strategies
                    </h4>
                    <p className="rar-treatment-strategies-intro">
                      Once risks are identified and assessed, organizations must decide how to respond. There are four primary risk treatment strategies:
                    </p>
                    
                    <div className="rar-treatment-strategy">
                      <h5 className="rar-treatment-strategy-header">
                        <span className="rar-strategy-icon">🚫</span> Avoid
                      </h5>
                      <p className="rar-treatment-strategy-definition">
                        <strong>Definition:</strong> Eliminate the risk by removing the risk source or changing the activity.
                      </p>
                      <p className="rar-treatment-strategy-usage">
                        <strong>When to use:</strong> When the risk is unacceptable and can be eliminated without significant business impact.
                      </p>
                      <p className="rar-treatment-strategy-examples-header"><strong>Examples:</strong></p>
                      <ul className="rar-treatment-strategy-examples">
                        <li>Discontinuing a high-risk product line</li>
                        <li>Exiting from high-risk geographical markets</li>
                        <li>Choosing not to pursue risky business opportunities</li>
                        <li>Implementing technology solutions that eliminate manual processes</li>
                      </ul>
                    </div>

                    <div className="rar-treatment-strategy">
                      <h5 className="rar-treatment-strategy-header">
                        <span className="rar-strategy-icon">🛡️</span> Mitigate
                      </h5>
                      <p className="rar-treatment-strategy-definition">
                        <strong>Definition:</strong> Reduce the likelihood or impact of the risk through controls and preventive measures.
                      </p>
                      <p className="rar-treatment-strategy-usage">
                        <strong>When to use:</strong> When the risk cannot be avoided but can be reduced to acceptable levels.
                      </p>
                      <p className="rar-treatment-strategy-examples-header"><strong>Examples:</strong></p>
                      <ul className="rar-treatment-strategy-examples">
                        <li>Implementing security controls to reduce cyber risk</li>
                        <li>Staff training to reduce human error</li>
                        <li>Regular maintenance to prevent equipment failure</li>
                        <li>Backup systems and redundancy measures</li>
                        <li>Quality assurance processes</li>
                      </ul>
                    </div>

                    <div className="rar-treatment-strategy">
                      <h5 className="rar-treatment-strategy-header">
                        <span className="rar-strategy-icon">🤝</span> Transfer
                      </h5>
                      <p className="rar-treatment-strategy-definition">
                        <strong>Definition:</strong> Shift the risk or its consequences to another party through contracts, insurance, or outsourcing.
                      </p>
                      <p className="rar-treatment-strategy-usage">
                        <strong>When to use:</strong> When another party is better positioned to manage the risk or when cost-effective risk transfer is available.
                      </p>
                      <p className="rar-treatment-strategy-examples-header"><strong>Examples:</strong></p>
                      <ul className="rar-treatment-strategy-examples">
                        <li>Purchasing insurance policies</li>
                        <li>Outsourcing high-risk activities</li>
                        <li>Contractual risk transfer clauses</li>
                        <li>Financial hedging instruments</li>
                        <li>Joint ventures and partnerships</li>
                      </ul>
                    </div>

                    <div className="rar-treatment-strategy">
                      <h5 className="rar-treatment-strategy-header">
                        <span className="rar-strategy-icon">✅</span> Accept
                      </h5>
                      <p className="rar-treatment-strategy-definition">
                        <strong>Definition:</strong> Acknowledge the risk and accept its potential consequences without taking specific action.
                      </p>
                      <p className="rar-treatment-strategy-usage">
                        <strong>When to use:</strong> When the cost of treatment exceeds the potential impact, or when risks are within acceptable tolerance levels.
                      </p>
                      <p className="rar-treatment-strategy-types-header"><strong>Types:</strong></p>
                      <ul className="rar-treatment-strategy-types">
                        <li><strong>Active Acceptance:</strong> Deliberately choose to accept with contingency plans</li>
                        <li><strong>Passive Acceptance:</strong> Accept by default with no specific response</li>
                      </ul>
                      <p className="rar-treatment-strategy-examples-header"><strong>Examples:</strong></p>
                      <ul className="rar-treatment-strategy-examples">
                        <li>Minor operational risks with low impact</li>
                        <li>Market risks that are inherent to business operations</li>
                        <li>Risks where treatment costs exceed potential losses</li>
                      </ul>
                    </div>

                    <div className="rar-treatment-strategy-note">
                      <p>
                        <strong>Important:</strong> Organizations often use a combination of strategies for complex risks. The chosen strategy should align with the organization's risk appetite, available resources, and strategic objectives. Regular review and adjustment of treatment strategies is essential as business conditions change.
                      </p>
                    </div>
                  </div>
                  </div>

                  <div className="rar-quantitative-guidance-section">
                    <h4 className="rar-quantitative-guidance-title">
                      Quantitative Risk Assessment Guidance
                    </h4>
                    <p className="rar-quantitative-guidance-intro">
                      Quantitative risk assessment uses numerical values to calculate potential financial losses. Understanding the relationship between Single Loss Expectancy (SLE), Annual Rate of Occurrence (ARO), and Annual Loss Expectancy (ALE) is crucial for effective quantitative risk management.
                    </p>
                    
                    <div className="rar-quantitative-formulas">
                      <div className="rar-formula-card">
                        <h5 className="rar-formula-title">Core Formula</h5>
                        <div className="rar-formula-equation">
                          <span className="rar-formula-term">ALE</span>
                          <span className="rar-formula-operator">=</span>
                          <span className="rar-formula-term">SLE</span>
                          <span className="rar-formula-operator">×</span>
                          <span className="rar-formula-term">ARO</span>
                        </div>
                        <p className="rar-formula-description">
                          Annual Loss Expectancy = Single Loss Expectancy × Annual Rate of Occurrence
                        </p>
                      </div>
                    </div>

                    <div className="rar-quantitative-definitions">
                      <div className="rar-definition-grid">
                        <div className="rar-definition-card rar-definition-sle">
                          <h5 className="rar-definition-title">
                            <span className="rar-definition-icon">💰</span>
                            Single Loss Expectancy (SLE)
                          </h5>
                          <p className="rar-definition-text">
                            <strong>Definition:</strong> The expected financial loss from a single occurrence of a risk event.
                          </p>
                          <p className="rar-definition-calculation">
                            <strong>Calculation:</strong> Asset Value × Exposure Factor
                          </p>
                          <div className="rar-definition-examples">
                            <strong>Examples:</strong>
                            <ul>
                              <li>Server failure: $50,000 (replacement + downtime)</li>
                              <li>Data breach: $2,000,000 (fines + recovery costs)</li>
                              <li>Ransomware attack: $500,000 (ransom + restoration)</li>
                            </ul>
                          </div>
                        </div>

                        <div className="rar-definition-card rar-definition-aro">
                          <h5 className="rar-definition-title">
                            <span className="rar-definition-icon">📅</span>
                            Annual Rate of Occurrence (ARO)
                          </h5>
                          <p className="rar-definition-text">
                            <strong>Definition:</strong> The expected frequency of a risk event occurring within a one-year period.
                          </p>
                          <p className="rar-definition-calculation">
                            <strong>Calculation:</strong> Based on historical data, industry statistics, or expert judgment
                          </p>
                          <div className="rar-definition-examples">
                            <strong>Examples:</strong>
                            <ul>
                              <li>Hardware failure: 0.1 (once every 10 years)</li>
                              <li>Phishing attempts: 12 (monthly occurrences)</li>
                              <li>Natural disaster: 0.02 (once every 50 years)</li>
                            </ul>
                          </div>
                        </div>

                        <div className="rar-definition-card rar-definition-ale">
                          <h5 className="rar-definition-title">
                            <span className="rar-definition-icon">📊</span>
                            Annual Loss Expectancy (ALE)
                          </h5>
                          <p className="rar-definition-text">
                            <strong>Definition:</strong> The expected annual financial loss from a specific risk, used for risk prioritization and cost-benefit analysis.
                          </p>
                          <p className="rar-definition-calculation">
                            <strong>Usage:</strong> Compare against cost of controls to determine cost-effectiveness
                          </p>
                          <div className="rar-definition-examples">
                            <strong>Decision Rule:</strong>
                            <ul>
                              <li>If control cost &lt; ALE → Implement control</li>
                              <li>If control cost &gt; ALE → Consider accepting risk</li>
                              <li>Consider residual risk after control implementation</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rar-quantitative-examples-section">
                      <h5 className="rar-quantitative-examples-title">
                        📈 Quantitative Assessment Examples
                      </h5>
                      
                      <div className="rar-examples-grid">
                        <div className="rar-example-card rar-example-low">
                          <h6 className="rar-example-card-title">Low Risk Example</h6>
                          <div className="rar-example-scenario">
                            <strong>Scenario:</strong> Laptop theft in office environment
                          </div>
                          <div className="rar-example-calculations">
                            <div className="rar-calc-row">
                              <span className="rar-calc-label">Asset Value:</span>
                              <span className="rar-calc-value">$2,000</span>
                            </div>
                            <div className="rar-calc-row">
                              <span className="rar-calc-label">Exposure Factor:</span>
                              <span className="rar-calc-value">100%</span>
                            </div>
                            <div className="rar-calc-row rar-calc-result">
                              <span className="rar-calc-label">SLE:</span>
                              <span className="rar-calc-value">$2,000</span>
                            </div>
                            <div className="rar-calc-row">
                              <span className="rar-calc-label">ARO:</span>
                              <span className="rar-calc-value">0.1 (once per 10 years)</span>
                            </div>
                            <div className="rar-calc-row rar-calc-final">
                              <span className="rar-calc-label">ALE:</span>
                              <span className="rar-calc-value">$200</span>
                            </div>
                          </div>
                        </div>

                        <div className="rar-example-card rar-example-medium">
                          <h6 className="rar-example-card-title">Medium Risk Example</h6>
                          <div className="rar-example-scenario">
                            <strong>Scenario:</strong> Email server outage
                          </div>
                          <div className="rar-example-calculations">
                            <div className="rar-calc-row">
                              <span className="rar-calc-label">Business Impact:</span>
                              <span className="rar-calc-value">$25,000</span>
                            </div>
                            <div className="rar-calc-row">
                              <span className="rar-calc-label">Recovery Cost:</span>
                              <span className="rar-calc-value">$5,000</span>
                            </div>
                            <div className="rar-calc-row rar-calc-result">
                              <span className="rar-calc-label">SLE:</span>
                              <span className="rar-calc-value">$30,000</span>
                            </div>
                            <div className="rar-calc-row">
                              <span className="rar-calc-label">ARO:</span>
                              <span className="rar-calc-value">0.5 (once per 2 years)</span>
                            </div>
                            <div className="rar-calc-row rar-calc-final">
                              <span className="rar-calc-label">ALE:</span>
                              <span className="rar-calc-value">$15,000</span>
                            </div>
                          </div>
                        </div>

                        <div className="rar-example-card rar-example-high">
                          <h6 className="rar-example-card-title">High Risk Example</h6>
                          <div className="rar-example-scenario">
                            <strong>Scenario:</strong> Customer data breach
                          </div>
                          <div className="rar-example-calculations">
                            <div className="rar-calc-row">
                              <span className="rar-calc-label">Regulatory Fines:</span>
                              <span className="rar-calc-value">$1,500,000</span>
                            </div>
                            <div className="rar-calc-row">
                              <span className="rar-calc-label">Business Loss:</span>
                              <span className="rar-calc-value">$800,000</span>
                            </div>
                            <div className="rar-calc-row rar-calc-result">
                              <span className="rar-calc-label">SLE:</span>
                              <span className="rar-calc-value">$2,300,000</span>
                            </div>
                            <div className="rar-calc-row">
                              <span className="rar-calc-label">ARO:</span>
                              <span className="rar-calc-value">0.05 (once per 20 years)</span>
                            </div>
                            <div className="rar-calc-row rar-calc-final">
                              <span className="rar-calc-label">ALE:</span>
                              <span className="rar-calc-value">$115,000</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rar-quantitative-best-practices">
                      <h5 className="rar-quantitative-best-practices-title">
                        🎯 Quantitative Assessment Best Practices
                      </h5>
                      <div className="rar-best-practices-grid">
                        <div className="rar-best-practice-item">
                          <h6 className="rar-best-practice-title">📋 Data Collection</h6>
                          <ul className="rar-best-practice-list">
                            <li>Use historical incident data when available</li>
                            <li>Leverage industry benchmarks and statistics</li>
                            <li>Conduct structured interviews with SMEs</li>
                            <li>Document assumptions and data sources</li>
                          </ul>
                        </div>
                        
                        <div className="rar-best-practice-item">
                          <h6 className="rar-best-practice-title">🔄 Validation & Review</h6>
                          <ul className="rar-best-practice-list">
                            <li>Regular review and update of estimates</li>
                            <li>Sensitivity analysis for key parameters</li>
                            <li>Peer review of calculations</li>
                            <li>Comparison with actual incident costs</li>
                          </ul>
                        </div>
                        
                        <div className="rar-best-practice-item">
                          <h6 className="rar-best-practice-title">💡 Decision Making</h6>
                          <ul className="rar-best-practice-list">
                            <li>Consider control effectiveness in calculations</li>
                            <li>Factor in implementation and maintenance costs</li>
                            <li>Account for risk interdependencies</li>
                            <li>Include uncertainty ranges in reporting</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Additional Recommended Fields Section */}
            <details className="rar-additional-fields-details">
              <summary className="rar-additional-fields-summary">
                💡 Recommended Additional Assessment Criteria for Enhanced Risk Assessment
              </summary>
              <div className="rar-additional-fields-content">
                <p className="rar-additional-fields-intro">
                  A Risk Assessment contains a mix of values that either assist in assessing the risk or drive process and decision-making. 
                  There is a temptation to be as thorough as possible, including every detail. However, less is more and it is usually better to keep the assessment fast, simple and focused on the most critical aspects only.
                </p>
                <p className="rar-distribution-intro-text">
                  The following fields could enhance your risk assessment process. Consider adding these based on your organization's specific needs and maturity level but avoid overcomplicating the assessment:
                </p>
                
                <div className="rar-distribution-grid">
                  <div>
                    <h4 className="rar-distribution-section-header" style={{ color: SC3_PRIMARY }}>🎯 Risk Context & Environment</h4>
                    <ul className="rar-distribution-list">
                      <li><strong>Business Process/System Affected:</strong> Specific processes or systems impacted</li>
                      <li><strong>Risk Location/Geography:</strong> Physical or logical location of risk</li>
                      <li><strong>Data Classification:</strong> Sensitivity level of data involved (Public, Internal, Confidential, Restricted)</li>
                      <li><strong>Application Criticality:</strong> Business importance of affected applications (Critical, High, Medium, Low)</li>
                      <li><strong>Regulatory/Compliance Framework:</strong> Applicable regulations (GDPR, SOX, HIPAA, etc.)</li>
                      <li><strong>Risk Interdependencies:</strong> Related risks or cascade effects</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="rar-distribution-section-header" style={{ color: SC3_PRIMARY }}>🔬 Risk Assessment Methodology</h4>
                    <ul className="rar-distribution-list">
                      <li><strong>Data Sources:</strong> Where risk information was gathered</li>
                      <li><strong>Assumptions Made:</strong> Key assumptions underlying assessment</li>
                      <li><strong>Confidence Level:</strong> Assessor's confidence in rating (High/Medium/Low)</li>
                    </ul>
                  </div>
                </div>

                <div className="rar-distribution-grid">
                  <div>
                    <h4 className="rar-distribution-section-header" style={{ color: SC3_GREEN }}>📊 Quantitative Enhancement</h4>
                    <ul className="rar-distribution-list">
                      <li><strong>Cost of Controls:</strong> Budget for implementing mitigating controls</li>
                      <li><strong>Risk Appetite Threshold:</strong> Organizational tolerance level</li>
                      <li><strong>Time to Impact:</strong> How quickly risk could materialize</li>
                      <li><strong>Detection Probability:</strong> Likelihood of detecting before impact</li>
                      <li><strong>Risk Reduction Value:</strong> Quantified benefit of implemented controls</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="rar-distribution-section-header" style={{ color: SC3_GREEN }}>👥 Stakeholder & Communication</h4>
                    <ul className="rar-distribution-list">
                      <li><strong>Risk Committee/Board Approval:</strong> Governance oversight details</li>
                      <li><strong>Stakeholder Notifications:</strong> Who needs to be informed</li>
                      <li><strong>Escalation Triggers:</strong> Conditions requiring escalation</li>
                    </ul>
                  </div>
                </div>

                <div className="rar-distribution-grid-single">
                  <div>
                    <h4 className="rar-distribution-section-header" style={{ color: SC3_SECONDARY }}>📈 Monitoring & Metrics</h4>
                    <ul className="rar-distribution-list">
                      <li><strong>Key Risk Indicators (KRIs):</strong> Metrics to monitor risk levels</li>
                      <li><strong>Monitoring Frequency:</strong> How often risk is reviewed</li>
                      <li><strong>Last Incident Date:</strong> When this risk type last materialized</li>
                      <li><strong>Trend Analysis:</strong> Risk direction (increasing/stable/decreasing)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="rar-distribution-section-header" style={{ color: SC3_SECONDARY }}>🛠️ Risk Treatment Details</h4>
                    <ul className="rar-distribution-list">
                      <li><strong>Cost-Benefit Analysis:</strong> Justification for chosen treatment</li>
                      <li><strong>Alternative Options:</strong> Other strategies considered</li>
                      <li><strong>Resource Requirements:</strong> Personnel, technology, budget needed</li>
                      <li><strong>Implementation Timeline:</strong> Detailed schedule for treatment</li>
                    </ul>
                  </div>
                </div>

                <div className="rar-priority-recommendations-container">
                  <h4 className="rar-distribution-section-header" style={{ color: SC3_PRIMARY }}>⭐ Priority Recommendations</h4>
                  <p className="rar-priority-text">
                    If you were to add any additional fields to the risk assessment, consider implementing these high-value fields first:
                  </p>
                  <ol className="rar-priority-recommendations-list">
                    <li><strong>Business Process/System Affected</strong> - Critical for impact assessment</li>
                    <li><strong>Confidence Level</strong> - Important for risk management decisions</li>
                    <li><strong>Key Risk Indicators (KRIs)</strong> - Essential for ongoing monitoring</li>
                    <li><strong>Cost of Controls</strong> - Needed for business case justification</li>
                    <li><strong>Regulatory/Compliance Framework</strong> - Important for compliance requirements</li>
                  </ol>
                </div>
              </div>
            </details>

            <BackToTopButton />

            <p>
              <b>Disclaimer:</b> The information provided here is for general
              informational purposes only and will require adaptation for
              specific businesses and maturity capabilities and is not intended
              as legal advice. Please consult with a qualified legal
              professional for specific legal advice tailored to your situation.
            </p>

          </div>
        </details>
        );
    };

export default RARIntro;