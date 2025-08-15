import React from 'react';
import "./RAR.css";

// SC3 Design System Constants
const SC3_PRIMARY = "#003366";
const SC3_SECONDARY = "#008cba"; 

const RARReport = ({
  risks,
  includeClosedRisks,
  setIncludeClosedRisks,
  showAdditionalConsiderations,
  setShowAdditionalConsiderations,
  createDonutChart,
  getRiskLevelData,
  getFilteredRisksCount,
  getResidualRiskData,
  getStatusData,
  getThreatSourceData,
  getCategoryData,
  getTreatmentData,
  getTop5RisksByLevel,
  likelihoodMap,
  impactMap,
  getRiskColor,
  getRiskMatrixHeatMapData,
  calculateALE,
  calculateResidualALE,
  getQuantitativeRiskLevel,
  getMonteCarloExpectedLossNumeric,
  getMonteCarloVaRNumeric,
  getMonteCarloResults,
  thresholdCurrency,
  formatCurrency
}) => {
  if (risks.length === 0) {
    return null;
  }

  return (
    <div className="rar-report-container">
      {/* Risk Assessment Report Section */}
      <details className="rar-report-details">
        <summary className="rar-report-summary">
          Risk Assessment Report
        </summary>
        <div>
          <h3 className="rar-report-title">
            Risk Assessment Report
          </h3>

          {/* Risk Portfolio Analytics - Embedded within Risk Assessment Results */}
          {risks.length > 0 && (
            <div className="rar-analytics-dashboard">
              <h5 className="rar-analytics-title">
                Risk Portfolio Analytics Dashboard
              </h5>
              
              {/* Analytics Filter Controls */}
              <div className="rar-analytics-filters">
                <label className="rar-analytics-filter-label">
                  <input
                    type="checkbox"
                    checked={includeClosedRisks}
                    onChange={(e) => setIncludeClosedRisks(e.target.checked)}
                    className="rar-analytics-filter-checkbox"
                  />
                  Include closed risks in analytics
                </label>
              </div>
              
              <div className="rar-analytics-grid">
                {/* Risk Levels Distribution */}
                <div className="rar-chart-container">
                  <h6 className="rar-chart-title">Risk Levels Distribution</h6>
                  {createDonutChart(getRiskLevelData(), 160)}
                  <div className="rar-chart-legend">
                    {getRiskLevelData().map(item => (
                      <div key={item.label} className="rar-chart-legend-item">
                        <div className="rar-chart-legend-label">
                          <div 
                            className="rar-chart-legend-color"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span>{item.label}</span>
                        </div>
                        <span className="rar-chart-legend-value">
                          {item.count} ({((item.count / getFilteredRisksCount()) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Residual Risk Levels Distribution */}
                <div className="rar-chart-container">
                  <h6 className="rar-chart-title">Residual Risk Levels</h6>
                  {(() => {
                    const residualData = getResidualRiskData();
                    const chart = createDonutChart(residualData, 160);
                    return chart || (
                      <div className="rar-chart-no-data">
                        No Data
                      </div>
                    );
                  })()}
                  <div className="rar-chart-legend">
                    {(() => {
                      const residualData = getResidualRiskData();
                      return residualData.length > 0 ? residualData.map(item => (
                        <div key={item.label} className="rar-chart-legend-item">
                          <div className="rar-chart-legend-label">
                            <div 
                              className="rar-chart-legend-color"
                              style={{ backgroundColor: item.color }}
                            ></div>
                            <span>{item.label}</span>
                          </div>
                          <span className="rar-chart-legend-value">
                            {item.count} ({((item.count / getFilteredRisksCount()) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      )) : (
                        <div className="rar-no-data-text">
                          No residual risk assessments completed
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Status Distribution */}
                <div className="rar-chart-container">
                  <h6 className="rar-chart-title">Status Distribution</h6>
                  {createDonutChart(getStatusData(), 160)}
                  <div className="rar-chart-legend">
                    {getStatusData().map(item => (
                      <div key={item.label} className="rar-chart-legend-item">
                        <div className="rar-chart-legend-label">
                          <div 
                            className="rar-chart-legend-color"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span>{item.label}</span>
                        </div>
                        <span className="rar-chart-legend-value">
                          {item.count} ({((item.count / getFilteredRisksCount()) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Threat Source Distribution */}
                <div className="rar-chart-container">
                  <h6 className="rar-chart-title">Threat Source Distribution</h6>
                  {createDonutChart(getThreatSourceData(), 160)}
                  <div className="rar-chart-legend">
                    {getThreatSourceData().map(item => (
                      <div key={item.label} className="rar-chart-legend-item">
                        <div className="rar-chart-legend-label">
                          <div 
                            className="rar-chart-legend-color"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span>{item.label}</span>
                        </div>
                        <span className="rar-chart-legend-value">
                          {item.count} ({((item.count / getFilteredRisksCount()) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Categories Distribution */}
                <div className="rar-chart-container">
                  <h6 className="rar-chart-title">Categories Distribution</h6>
                  {createDonutChart(getCategoryData(), 160)}
                  <div className="rar-chart-legend">
                    {getCategoryData().map(item => (
                      <div key={item.label} className="rar-chart-legend-item">
                        <div className="rar-chart-legend-label">
                          <div 
                            className="rar-chart-legend-color"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span>{item.label}</span>
                        </div>
                        <span className="rar-chart-legend-value">
                          {item.count} ({((item.count / getFilteredRisksCount()) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Treatment Strategies Distribution */}
                <div className="rar-chart-container">
                  <h6 className="rar-chart-title">Treatment Strategies</h6>
                  {createDonutChart(getTreatmentData(), 160)}
                  <div className="rar-chart-legend">
                    {getTreatmentData().map(item => (
                      <div key={item.label} className="rar-chart-legend-item">
                        <div className="rar-chart-legend-label">
                          <div 
                            className="rar-chart-legend-color"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span>{item.label}</span>
                        </div>
                        <span className="rar-chart-legend-value">
                          {item.count} ({((item.count / getFilteredRisksCount()) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top 5 Risks by Risk Level */}
              <div className="rar-top5-risks-container">
                <h6 className="rar-top5-risks-title">
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
                      <div className="rar-top5-risks-empty">
                        No risks have been added to the assessment yet.<br/>
                        <span className="rar-top5-risks-empty-hint">
                          Add risks using the form above to see the top risks analysis.
                        </span>
                      </div>
                    );
                  }

                  if (filteredRisks.length === 0) {
                    return (
                      <div className="rar-top5-risks-empty">
                        All {totalRisks} risk{totalRisks !== 1 ? 's are' : ' is'} closed.<br/>
                        <span className="rar-top5-risks-empty-hint">
                          Check "Include closed risks in analytics" to see closed risks.
                        </span>
                      </div>
                    );
                  }

                  if (eligibleRisks.length === 0) {
                    return (
                      <div className="rar-top5-risks-empty">
                        {filteredRisks.length} risk{filteredRisks.length !== 1 ? 's' : ''} found, but none have sufficient data for ranking.<br/>
                        <span className="rar-top5-risks-empty-hint">
                          Risks need at least a title or risk level to be displayed here.
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div className="rar-top5-risks-list">
                      {/* Summary info */}
                      <div className="rar-top5-risks-summary"
                        style={{
                          marginBottom: "1rem",
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
                          className="rar-top5-risk-item"
                        >
                          {/* Rank Number */}
                          <div className="rar-top5-risk-rank"
                            style={{
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
                          <div className="rar-top5-risk-badge"
                            style={{
                              backgroundColor: risk.riskLevel ? getRiskColor(risk.riskLevel.charAt(0).toUpperCase() + risk.riskLevel.slice(1).toLowerCase()) : "#E0E0E0",
                            }}>
                            {risk.riskLevel?.toUpperCase() || 'N/A'}
                          </div>

                          {/* Risk Details */}
                          <div className="rar-top5-risk-details">
                            <div className="rar-top5-risk-title">
                              {risk.riskTitle || 'Untitled Risk'}
                            </div>
                            
                            <div className="rar-top5-risk-metadata">
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
              <div className="rar-heatmap-container">
                <h6 className="rar-heatmap-title">
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
                      <div className="rar-heatmap-info"
                        style={{
                          marginBottom: "1rem",
                          padding: "0.5rem",
                          backgroundColor: "#f8f9fa",
                          borderRadius: "4px"
                        }}>
                        Heat map based on {filteredRisks.length} qualitative risk{filteredRisks.length !== 1 ? 's' : ''}
                        {!includeClosedRisks && allQualitativeRisks.length > filteredRisks.length && 
                          ` (${allQualitativeRisks.length - filteredRisks.length} closed qualitative risk${allQualitativeRisks.length - filteredRisks.length !== 1 ? 's' : ''} excluded)`
                        }
                      </div>

                      {/* Caveat about qualitative risks only */}
                      <div className="rar-heatmap-info"
                        style={{
                          fontSize: "0.8rem",
                          color: "#856404",
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
                      <div className="rar-heatmap-matrix-container" style={{
                        overflowX: 'auto',
                        overflowY: 'visible',
                        maxWidth: '100%',
                        WebkitOverflowScrolling: 'touch'
                      }}>
                        <table className="rar-heatmap-matrix"
                          style={{
                            backgroundColor: "white",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            borderRadius: "6px",
                            overflow: "hidden"
                          }}>
                          <thead>
                            <tr>
                              <th className="rar-heatmap-header"
                                style={{
                                  minWidth: window.innerWidth <= 768 ? "60px" : "80px"
                                }}>
                                Impact ↓<br/>Likelihood →
                              </th>
                              {likelihoodLevels.map(likelihood => (
                                <th key={likelihood} className="rar-heatmap-header"
                                  style={{
                                    minWidth: window.innerWidth <= 768 ? "50px" : "90px",
                                  }}>
                                  {window.innerWidth <= 480 ? likelihood.slice(0, 3) : likelihood}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {impactLevels.slice().reverse().map(impact => (
                              <tr key={impact}>
                                <td style={{
                                  padding: window.innerWidth <= 768 ? "0.5rem 0.3rem" : "0.75rem",
                                  backgroundColor: "#f8f9fa",
                                  border: "1px solid #dee2e6",
                                  fontWeight: "600",
                                  color: SC3_PRIMARY,
                                  textAlign: "center",
                                  fontSize: window.innerWidth <= 768 ? "0.65rem" : "0.75rem"
                                }}>
                                  {window.innerWidth <= 480 ? impact.slice(0, 3) : impact}
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
                                      padding: window.innerWidth <= 768 ? "0.5rem 0.3rem" : "0.75rem",
                                      border: "1px solid #dee2e6",
                                      textAlign: "center",
                                      backgroundColor: getRiskColor(riskLevel),
                                      opacity: opacity,
                                      color: count > 0 ? "white" : "#666",
                                      fontWeight: count > 0 ? "600" : "400",
                                      position: "relative"
                                    }}>
                                      <div style={{
                                        fontSize: count > 0 ? (window.innerWidth <= 768 ? "0.9rem" : "1.1rem") : (window.innerWidth <= 768 ? "0.7rem" : "0.9rem"),
                                        lineHeight: "1"
                                      }}>
                                        {count}
                                      </div>
                                      {count > 0 && (
                                        <div style={{
                                          fontSize: window.innerWidth <= 768 ? "0.5rem" : "0.65rem",
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

          {/* Financial Exposure Summary */}
          {(risks.filter(risk => risk.assessmentType === 'quantitative' || risk.assessmentType === 'advancedQuantitative').length > 0) && (
            <div style={{ marginTop: "2rem", marginBottom: "2rem" }}>
              <h3 style={{ color: SC3_PRIMARY, marginBottom: "1.5rem", textAlign: "center" }}>
                Financial Exposure Summary
              </h3>
              
              {(() => {
                const quantitativeRisks = risks.filter(risk => risk.assessmentType === 'quantitative');
                const advancedQuantitativeRisks = risks.filter(risk => risk.assessmentType === 'advancedQuantitative');
                
                // Calculate totals for quantitative risks (ALE)
                const quantitativeTotal = quantitativeRisks.reduce((total, risk) => {
                  const ale = typeof risk.ale === 'number' ? risk.ale : calculateALE(risk);
                  return total + (ale || 0);
                }, 0);
                
                // Calculate totals for advanced quantitative risks (Expected Loss)
                const advancedQuantitativeTotal = advancedQuantitativeRisks.reduce((total, risk) => {
                  const expectedLoss = getMonteCarloExpectedLossNumeric(risk);
                  return total + (expectedLoss || 0);
                }, 0);
                
                // Calculate Value at Risk total
                const valueAtRiskTotal = advancedQuantitativeRisks.reduce((total, risk) => {
                  const varValue = getMonteCarloVaRNumeric(risk);
                  return total + (varValue || 0);
                }, 0);
                
                const totalFinancialExposure = quantitativeTotal + advancedQuantitativeTotal;
                const currency = thresholdCurrency || 'dollar';
                
                return (
                  <div className="rar-financial-exposure-container">
                    {/* Summary Cards */}
                    <div className="rar-financial-cards-grid">
                      {/* Total Financial Exposure */}
                      <div className="rar-financial-card rar-financial-card-primary">
                        <h4 className="rar-financial-card-title">
                          Total Financial Exposure
                        </h4>
                        <div className={`rar-financial-card-value rar-financial-card-value-large ${
                          totalFinancialExposure > 0 ? 'rar-financial-value-high' : 'rar-financial-value-neutral'
                        }`}>
                          {totalFinancialExposure > 0 ? formatCurrency(totalFinancialExposure, currency) : "No Data"}
                        </div>
                        <p className="rar-financial-card-description">
                          Combined quantitative and advanced quantitative risk exposure
                        </p>
                      </div>
                      
                      {/* Quantitative Risks Total */}
                      <div className="rar-financial-card rar-financial-card-secondary">
                        <h4 className="rar-financial-card-title">
                          Quantitative ALE Total
                        </h4>
                        <div className={`rar-financial-card-value rar-financial-card-value-medium ${
                          quantitativeTotal > 0 ? 'rar-financial-value-medium' : 'rar-financial-value-neutral'
                        }`}>
                          {quantitativeTotal > 0 ? formatCurrency(quantitativeTotal, currency) : "No Data"}
                        </div>
                        <p className="rar-financial-card-description">
                          {quantitativeRisks.length} quantitative risk{quantitativeRisks.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      
                      {/* Advanced Quantitative Total */}
                      <div className="rar-financial-card rar-financial-card-secondary">
                        <h4 className="rar-financial-card-title">
                          Advanced Quantitative Total
                        </h4>
                        <div className={`rar-financial-card-value rar-financial-card-value-medium ${
                          advancedQuantitativeTotal > 0 ? 'rar-financial-value-green' : 'rar-financial-value-neutral'
                        }`}>
                          {advancedQuantitativeTotal > 0 ? formatCurrency(advancedQuantitativeTotal, currency) : "No Data"}
                        </div>
                        <p style={{
                          fontSize: "0.9rem",
                          color: "#666",
                          margin: 0
                        }}>
                          {advancedQuantitativeRisks.length} advanced quantitative risk{advancedQuantitativeRisks.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      
                      {/* Value at Risk Total */}
                      <div className="rar-financial-card rar-financial-card-secondary">
                        <h4 className="rar-financial-card-title">
                          Total Value at Risk
                        </h4>
                        <div className={`rar-financial-card-value rar-financial-card-value-medium ${
                          valueAtRiskTotal > 0 ? 'rar-financial-value-high' : 'rar-financial-value-neutral'
                        }`}>
                          {valueAtRiskTotal > 0 ? formatCurrency(valueAtRiskTotal, currency) : "No Data"}
                        </div>
                        <p className="rar-financial-card-description">
                          Maximum potential loss with confidence intervals
                        </p>
                      </div>
                    </div>
                    
                    {/* Detailed Breakdown Tables */}
                    {quantitativeRisks.length > 0 && (
                      <div className="rar-report-section">
                        <h4 className="rar-report-breakdown-title">
                          Quantitative Risk Assessment Details
                        </h4>
                        <div style={{ overflowX: "auto" }}>
                          <table className="rar-report-table"
                            style={{
                              background: "#fff",
                              borderRadius: "8px",
                              overflow: "hidden",
                              border: `1px solid ${SC3_SECONDARY}`
                            }}>
                            <thead>
                              <tr style={{ backgroundColor: "#f5f5f5" }}>
                                <th className="rar-report-table-header">Risk ID</th>
                                <th className="rar-report-table-header">Risk Title</th>
                                <th className="rar-report-table-header rar-report-table-center">SLE</th>
                                <th className="rar-report-table-header rar-report-table-center">ARO</th>
                                <th className="rar-report-table-header rar-report-table-center">ALE</th>
                                <th className="rar-report-table-header rar-report-table-center">Risk Level</th>
                                <th className="rar-report-table-header rar-report-table-center">Residual SLE</th>
                                <th className="rar-report-table-header rar-report-table-center">Residual ARO</th>
                                <th className="rar-report-table-header rar-report-table-center">Residual ALE</th>
                                <th className="rar-report-table-header rar-report-table-center">Residual Risk Level</th>
                              </tr>
                            </thead>
                            <tbody>
                              {quantitativeRisks.map((risk, index) => {
                                const ale = typeof risk.ale === 'number' ? risk.ale : calculateALE(risk);
                                const residualAle = calculateResidualALE(risk);
                                const residualRiskLevel = residualAle > 0 ? getQuantitativeRiskLevel(residualAle) : '';
                                return (
                                  <tr key={risk.riskId || index}>
                                    <td className="rar-report-table-cell"
                                      style={{ fontWeight: "bold" }}>
                                      {risk.riskId || 'N/A'}
                                    </td>
                                    <td className="rar-report-table-cell"
                                      style={{ maxWidth: "200px", wordBreak: "break-word" }}>
                                      {risk.riskTitle || 'N/A'}
                                    </td>
                                    <td className="rar-report-table-cell rar-report-table-center">
                                      {risk.sle ? formatCurrency(parseFloat(risk.sle), risk.sleCurrency || currency) : 'N/A'}
                                    </td>
                                    <td className="rar-report-table-cell rar-report-table-center">
                                      {risk.aro || 'N/A'}
                                    </td>
                                    <td className="rar-report-table-cell rar-report-table-center"
                                      style={{ fontWeight: "bold" }}>
                                      {ale > 0 ? formatCurrency(ale, risk.sleCurrency || currency) : 'N/A'}
                                    </td>
                                    <td className="rar-report-table-cell rar-report-table-center">
                                      <div style={{
                                        background: risk.riskLevel ? getRiskColor(risk.riskLevel.charAt(0).toUpperCase() + risk.riskLevel.slice(1)) : '#ccc',
                                        color: "#fff",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        fontWeight: "bold",
                                        fontSize: "0.8em"
                                      }}>
                                        {risk.riskLevel || 'Not Set'}
                                      </div>
                                    </td>
                                    <td className="rar-report-table-cell rar-report-table-center">
                                      {risk.residualSle ? formatCurrency(parseFloat(risk.residualSle), risk.residualSleCurrency || currency) : 'N/A'}
                                    </td>
                                    <td className="rar-report-table-cell rar-report-table-center">
                                      {risk.residualAro || 'N/A'}
                                    </td>
                                    <td className="rar-report-table-cell rar-report-table-center"
                                      style={{ fontWeight: "bold" }}>
                                      {residualAle > 0 ? formatCurrency(residualAle, risk.residualSleCurrency || currency) : 'N/A'}
                                    </td>
                                    <td className="rar-report-table-cell rar-report-table-center">
                                      <div style={{
                                        background: residualRiskLevel ? getRiskColor(residualRiskLevel.charAt(0).toUpperCase() + residualRiskLevel.slice(1)) : '#ccc',
                                        color: "#fff",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        fontWeight: "bold",
                                        fontSize: "0.8em"
                                      }}>
                                        {residualRiskLevel || 'Not Set'}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    {advancedQuantitativeRisks.length > 0 && (
                      <div className="rar-report-section">
                        <h4 className="rar-report-breakdown-title">
                          Advanced Quantitative Risk Assessment Details
                        </h4>
                        <div style={{ overflowX: "auto" }}>
                          <table className="rar-report-table"
                            style={{
                              background: "#fff",
                              borderRadius: "8px",
                              overflow: "hidden",
                              border: `1px solid ${SC3_SECONDARY}`
                            }}>
                            <thead>
                              <tr style={{ backgroundColor: "#f5f5f5" }}>
                                <th className="rar-report-table-header">Risk ID</th>
                                <th className="rar-report-table-header">Risk Title</th>
                                <th className="rar-report-table-header rar-report-table-center">Expected Loss</th>
                                <th className="rar-report-table-header rar-report-table-center">Value at Risk</th>
                                <th className="rar-report-table-header rar-report-table-center">Confidence Level</th>
                                <th className="rar-report-table-header rar-report-table-center">Risk Level</th>
                              </tr>
                            </thead>
                            <tbody>
                              {advancedQuantitativeRisks.map((risk, index) => {
                                // Use cached results for consistent display
                                const cachedExpectedLoss = risk.assessmentType === "advancedQuantitative" ? 
                                  (() => {
                                    const results = getMonteCarloResults(risk);
                                    return results.expectedAnnualLoss > 0 ? 
                                      formatCurrency(results.expectedAnnualLoss, risk.sleCurrency) : 'N/A';
                                  })() : 'N/A';
                                
                                const cachedValueAtRisk = risk.assessmentType === "advancedQuantitative" ? 
                                  (() => {
                                    const results = getMonteCarloResults(risk);
                                    return results.valueAtRisk > 0 ? 
                                      formatCurrency(results.valueAtRisk, risk.sleCurrency) : 'N/A';
                                  })() : 'N/A';
                                
                                return (
                                  <tr key={risk.riskId || index}>
                                    <td className="rar-report-table-cell"
                                      style={{ fontWeight: "bold" }}>
                                      {risk.riskId || 'N/A'}
                                    </td>
                                    <td className="rar-report-table-cell"
                                      style={{ maxWidth: "200px", wordBreak: "break-word" }}>
                                      {risk.riskTitle || 'N/A'}
                                    </td>
                                    <td className="rar-report-table-cell rar-report-table-center"
                                      style={{ fontWeight: "bold" }}>
                                      {cachedExpectedLoss}
                                    </td>
                                    <td className="rar-report-table-cell rar-report-table-center"
                                      style={{ fontWeight: "bold" }}>
                                      {cachedValueAtRisk}
                                    </td>
                                    <td className="rar-report-table-cell rar-report-table-center">
                                      {risk.confidenceLevel ? `${risk.confidenceLevel}%` : 'N/A'}
                                    </td>
                                    <td className="rar-report-table-cell rar-report-table-center">
                                      <div style={{
                                        background: risk.riskLevel ? getRiskColor(risk.riskLevel.charAt(0).toUpperCase() + risk.riskLevel.slice(1)) : '#ccc',
                                        color: "#fff",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        fontWeight: "bold",
                                        fontSize: "0.8em"
                                      }}>
                                        {risk.riskLevel || 'Not Set'}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    {/* Executive Summary */}
                    <div className="rar-report-section">
                      <h4 className="rar-report-breakdown-title">
                        Executive Summary
                      </h4>
                      <div className="rar-executive-summary-grid">
                        <div className="rar-executive-summary-item">
                          <strong>Total Risks Assessed:</strong> {quantitativeRisks.length + advancedQuantitativeRisks.length}
                        </div>
                        <div className="rar-executive-summary-item">
                          <strong>Assessment Currency:</strong> {currency.charAt(0).toUpperCase() + currency.slice(1)}
                        </div>
                        <div className="rar-executive-summary-item">
                          <strong>Highest Individual Risk:</strong> {(() => {
                            const allRisks = [...quantitativeRisks, ...advancedQuantitativeRisks];
                            if (allRisks.length === 0) return "No Data";
                            
                            const highestRisk = allRisks.reduce((highest, current) => {
                              const currentValue = current.assessmentType === 'quantitative' 
                                ? (typeof current.ale === 'number' ? current.ale : calculateALE(current))
                                : getMonteCarloExpectedLossNumeric(current);
                              const highestValue = highest.assessmentType === 'quantitative' 
                                ? (typeof highest.ale === 'number' ? highest.ale : calculateALE(highest))
                                : getMonteCarloExpectedLossNumeric(highest);
                              
                              return currentValue > highestValue ? current : highest;
                            });
                            
                            const value = highestRisk.assessmentType === 'quantitative' 
                              ? (typeof highestRisk.ale === 'number' ? highestRisk.ale : calculateALE(highestRisk))
                              : getMonteCarloExpectedLossNumeric(highestRisk);
                            
                            return `${highestRisk.riskId || 'N/A'} (${formatCurrency(value, currency)})`;
                          })()}
                        </div>
                        <div className="rar-executive-summary-item">
                          <strong>Average Risk Value:</strong> {(() => {
                            const totalRisks = quantitativeRisks.length + advancedQuantitativeRisks.length;
                            if (totalRisks === 0) return "No Data";
                            const average = totalFinancialExposure / totalRisks;
                            return formatCurrency(average, currency);
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Additional Considerations Collapsible Section */}
          <div className="rar-additional-considerations-container">
            <div className="rar-additional-considerations-toggle"
              onClick={() => setShowAdditionalConsiderations(!showAdditionalConsiderations)}>
              <h3 className="rar-additional-considerations-title">
                Additional Considerations for Including in a Risk Assessment Report
              </h3>
              <span className={`rar-additional-considerations-arrow ${
                showAdditionalConsiderations ? 'rar-additional-considerations-arrow-open' : ''
              }`}>
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

                <h4 className="rar-additional-considerations-section-title">
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

                <h4 className="rar-additional-considerations-section-title">
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

                <h4 className="rar-additional-considerations-section-title">
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

                <h4 className="rar-additional-considerations-section-title">
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

                <h4 className="rar-additional-considerations-section-title">
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

                <p className="rar-additional-considerations-note">
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
  );
};

export default RARReport;
