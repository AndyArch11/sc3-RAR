import React from 'react';
import { exportRisksToExcel } from './ExcelExport';
import './RAR.css';


const RARTable = ({
  // Risk data
  risks,
  risksOpen,
  setRisksOpen,

  // Risk management functions
  handleNewRisk,
  handleStartNew,
  handleEditRisk,
  handleDeleteRisk,
  handleMoveRisk,

  // UI state
  rarFieldsOpen,
  selectedRiskIndex,
  setSelectedRiskIndex,
  draggedRiskIndex,
  setDraggedRiskIndex,
  dropTargetIndex,
  setDropTargetIndex,
  editIndex,
  setEditIndex,
  hoveredRowIndex,
  setHoveredRowIndex,
  setRarFieldsOpen,
  setIsEditingRisk,
  setForm,

  // Calculation functions
  calculateALE,
  calculateResidualALE,
  getQuantitativeRiskLevel,
  getAdvancedQuantitativeRiskLevel,
  getResidualMonteCarloExpectedLossNumeric,
  formatCurrency,
  getRiskColor,
  getStatusColor,

  // Mapping objects
  likelihoodMap,
  impactMap
}) => {
  
  const handleDragStart = (e, index) => {
    setDraggedRiskIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetIndex(index);
  };

  const handleDragLeave = () => {
    setDropTargetIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedRiskIndex !== null && draggedRiskIndex !== dropIndex) {
      handleMoveRisk(draggedRiskIndex, dropIndex);
    }
    setDraggedRiskIndex(null);
    setDropTargetIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedRiskIndex(null);
    setDropTargetIndex(null);
  };

  const getTableStatColourClass = (statType) => {
    switch (statType) {
      case "Totalrisks":
        return "rar-table-stat-colour-Totalrisks";
      case "Qualitative":
        return "rar-table-stat-colour-Qualitative";
      case "Quantitative":
        return "rar-table-stat-colour-Quantitative";
      case "AdvancedQuantitative":
        return "rar-table-stat-colour-AdvancedQuantitative";
      case "Open":
        return "rar-table-stat-colour-Open";
      default:
        return "";
    }
  };

  const handleExport = () => {
    exportRisksToExcel(risks);
  };

  if (risks.length === 0) {
    return null;
  }


  return (
    <div className="rar-table-outer-container">
      <div className="rar-table-inner">
        <details open={risksOpen} className="rar-table-section">
          <summary
            className="rar-table-summary"
            onClick={(e) => {
              e.preventDefault();
              setRisksOpen(!risksOpen);
            }}
          >
            Current Risk Assessment 
            <span className="rar-table-count">{risks.length} risks identified</span>
          </summary>
          <div className="rar-table-content">
            {/* Risk Summary Statistics */}
            {risks.length > 0 && (
              <div className="rar-table-statistics">
                <div className="rar-table-stat-item">
                  <div className="rar-table-stat-label">Total risks</div>
                  <div className={`rar-table-stat-value ${getTableStatColourClass("Totalrisks")}`}>{risks.length}</div>
                </div>
                {risks.filter((r) => (r.status || "").toLowerCase() !== "closed").length > 0 && (
                    <div className="rar-table-stat-item">
                        <div className="rar-table-stat-label">Active Risks</div>
                        <div className={`rar-table-stat-value ${getTableStatColourClass("Open")}`}>
                        {risks.filter((r) => (r.status || "").toLowerCase() !== "closed").length}
                        </div>
                    </div>
                )}
                {risks.filter((r) => r.assessmentType === "qualitative").length > 0 && (
                  <div className="rar-table-stat-item">
                    <div className="rar-table-stat-label">Qualitative</div>
                    <div className={`rar-table-stat-value ${getTableStatColourClass("Qualitative")}`}>
                      {risks.filter((r) => r.assessmentType === "qualitative").length}
                    </div>
                  </div>
                )}
                {risks.filter((r) => r.assessmentType === "quantitative").length > 0 && (
                  <div className="rar-table-stat-item">
                    <div className="rar-table-stat-label">Quantitative</div>
                    <div className={`rar-table-stat-value ${getTableStatColourClass("Quantitative")}`}>
                      {risks.filter((r) => r.assessmentType === "quantitative").length}
                    </div>
                  </div>
                )}
                {risks.filter((r) => r.assessmentType === "advancedQuantitative").length > 0 && (
                  <div className="rar-table-stat-item">
                    <div className="rar-table-stat-label">Advanced Quantitative</div>
                    <div className={`rar-table-stat-value ${getTableStatColourClass("AdvancedQuantitative")}`}>
                      {risks.filter((r) => r.assessmentType === "advancedQuantitative").length}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No Risks Message */}
            {risks.length === 0 && (
              <div className="rar-table-empty">
                <h4>Current Risk Assessment - No Risks Identified</h4>
                <p>
                  No risks have been added to the current assessment yet. Use
                  the "RAR Fields" section above to:
                </p>
                <ul>
                  <li>• Fill in risk details (title, description, category, etc.)</li>
                  <li>• Assess likelihood and impact</li>
                  <li>• Define mitigation strategies</li>
                  <li>• Click "Submit Risk Details" to add to this table</li>
                </ul>
                <button onClick={handleNewRisk} className="rar-btn primary">
                  + Add First Risk
                </button>
              </div>
            )}
          </div>
        </details>

        {/* Risk Table */}
        {risks.length > 0 && (
          <div className="rar-table-container">
            <div className="rar-table-scroll">
              <table className="rar-table">
                <thead>
                  <tr>
                    <th colSpan={12} className="rar-th-group-risk-details">Risk Details</th>
                    <th colSpan={16} className="rar-th-group-risk-assessment">Risk Assessment</th>
                  </tr>
                  <tr>
                    <th className="rar-th-detail">Risk ID</th>
                    <th className="rar-th-detail">Risk Title</th>
                    <th className="rar-th-detail">Framework</th>
                    <th className="rar-th-detail">Category</th>
                    <th className="rar-th-detail">Description</th>
                    <th className="rar-th-detail">Assessor</th>
                    <th className="rar-th-detail">Assessed Date</th>
                    <th className="rar-th-detail">Owner</th>
                    <th className="rar-th-detail">Threat Source</th>
                    <th className="rar-th-detail">Vulnerability</th>
                    <th className="rar-th-detail">Current Controls</th>
                    <th className="rar-th-detail">Control Effectiveness</th>
                    <th className="rar-th-assessment">Assessment Type</th>
                    <th className="rar-th-assessment">Likelihood</th>
                    <th className="rar-th-assessment">Impact</th>
                    <th className="rar-th-assessment">Risk Level</th>
                    <th className="rar-th-assessment">Treatment Strategy</th>
                    <th className="rar-th-assessment">Recommended Actions</th>
                    <th className="rar-th-assessment">Action Owner</th>
                    <th className="rar-th-assessment">Target Date</th>
                    <th className="rar-th-assessment">Residual Likelihood</th>
                    <th className="rar-th-assessment">Residual Impact</th>
                    <th className="rar-th-assessment">Residual Risk</th>
                    <th className="rar-th-assessment">Review Date</th>
                    <th className="rar-th-assessment">Status</th>
                    <th className="rar-th-assessment">Closed Date</th>
                    <th className="rar-th-assessment">Closed By</th>
                    <th className="rar-th-assessment">Approver</th>
                  </tr>
                </thead>
                <tbody>
                  {risks.map((risk, index) => (
                    <tr
                      key={risk.riskId || index}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      onClick={() => {
                        // Prefill RARInputForm with selected risk
                        if (selectedRiskIndex !== index) {
                          if (typeof setSelectedRiskIndex === 'function') setSelectedRiskIndex(index);
                          if (typeof setRarFieldsOpen === 'function') setRarFieldsOpen(true);
                          if (typeof setIsEditingRisk === 'function') setIsEditingRisk(true);
                          if (typeof setForm === 'function') setForm(risks[index]);
                        } else {
                          if (typeof setSelectedRiskIndex === 'function') setSelectedRiskIndex(null);
                          if (typeof setRarFieldsOpen === 'function') setRarFieldsOpen(false);
                          if (typeof setIsEditingRisk === 'function') setIsEditingRisk(false);
                        }
                      }}
                      className={`rar-table-row 
                        ${selectedRiskIndex === index ? 'rar-table-row-selected' : ''} 
                        ${dropTargetIndex === index ? 'rar-table-row-drop-target' : ''} 
                        ${draggedRiskIndex === index ? 'rar-table-row-dragged' : ''} 
                        ${editIndex === index ? 'rar-table-row-editing' : ''}
                        ${index % 2 === 0 ? 'rar-table-row-even' : 'rar-table-row-odd'}`}
                      onMouseEnter={() => setHoveredRowIndex(index)}
                      onMouseLeave={() => setHoveredRowIndex(null)}
                      title={editIndex === index ? 
                        `Currently editing: ${risk.riskId} - ${risk.riskTitle} (click to save changes)` : 
                        `${risk.riskId} - ${risk.riskTitle} (click to edit this entry)`
                      }
                    >
                      <td className="rar-td-detail">{risk.riskId || 'N/A'}</td>
                      <td className="rar-td-detail">{risk.riskTitle || 'N/A'}</td>
                      <td className="rar-td-detail">{risk.framework || 'N/A'}</td>
                      <td className="rar-td-detail">{risk.category || 'N/A'}</td>
                      <td className="rar-td-detail">{risk.description || 'N/A'}</td>
                      <td className="rar-td-detail">{risk.assessor || 'N/A'}</td>
                      <td className="rar-td-detail">{risk.assessedDate || 'N/A'}</td>
                      <td className="rar-td-detail">{risk.owner || 'N/A'}</td>
                      <td className="rar-td-detail">{risk.threatSource || 'N/A'}</td>
                      <td className="rar-td-detail">{risk.vulnerability || 'N/A'}</td>
                      <td className="rar-td-detail">{risk.currentControls || 'N/A'}</td>
                      <td className="rar-td-detail">{risk.controlEffectiveness || 'N/A'}</td>                      
                      

                      {/* Assessment Type */}
                      <td className="rar-td-assessment">
                        <div
                            className={
                            "rar-td-assessment-badge " +
                            (risk.assessmentType === 'qualitative'
                                ? "qualitative"
                                : risk.assessmentType === 'quantitative'
                                ? "quantitative"
                                : risk.assessmentType === 'advancedQuantitative'
                                ? "advanced"
                                : "default")
                            }
                        >
                          {risk.assessmentType === 'qualitative' ? 'Qualitative' :
                           risk.assessmentType === 'quantitative' ? 'Quantitative' :
                           risk.assessmentType === 'advancedQuantitative' ? 'Advanced' : 'N/A'}
                        </div>
                      </td>

                      {/* Likelihood */}
                      <td  className="rar-td-assessment">
                        {risk.assessmentType === 'qualitative' 
                          ? (likelihoodMap[risk.likelihood] || risk.likelihood || 'N/A')
                          : risk.assessmentType === 'quantitative'
                          ? (risk.aro ? `${risk.aro}/year` : 'N/A')
                          : risk.assessmentType === 'advancedQuantitative'
                          ? (() => {
                              // Check for exponential distribution lambda parameters first
                              const lambdaValue = risk.frequencyLambda || risk.frequencyLambdaExp;
                              if (lambdaValue) {
                                return `λ=${parseFloat(lambdaValue).toFixed(2)}/year`;
                              }
                              // Fall back to other frequency parameters
                              const frequency = risk.mostLikelyFrequency || risk.frequencyMean;
                              return frequency ? `${parseFloat(frequency).toFixed(2)}/year` : 'N/A';
                            })()
                          : 'N/A'}
                      </td>

                      {/* Impact */}
                      <td className="rar-td-assessment">
                        {risk.assessmentType === 'qualitative' 
                          ? (impactMap[risk.impact] || risk.impact || 'N/A')
                          : risk.assessmentType === 'quantitative'
                          ? (risk.sle ? formatCurrency(parseFloat(risk.sle), risk.sleCurrency) : 'N/A')
                          : risk.assessmentType === 'advancedQuantitative'
                          ? (() => {
                              const loss = risk.mostLikelyLoss || risk.lossMean;
                              return loss ? formatCurrency(parseFloat(loss), risk.sleCurrency) : 'N/A';
                            })()
                          : 'N/A'}
                      </td>

                      {/* Risk Level */}
                      <td className="rar-td-assessment">
                        {risk.riskLevel ? (
                            <div
                                className={
                                    "rar-td-risk-badge " +
                                    (["low", "medium", "high", "extreme"].includes(risk.riskLevel.toLowerCase())
                                    ? risk.riskLevel.toLowerCase()
                                    : "default")
                                }
                            >
                                {risk.riskLevel.toUpperCase()}
                            </div>
                        ) : 'Not Set'}
                      </td>

                      {/* Treatment Strategy */}
                      <td className="rar-td-assessment">
                        {risk.treatmentStrategy || 'N/A'}
                      </td>

                      {/* Recommended Actions */}
                      <td className="rar-td-assessment">
                        {risk.recommendedActions || 'N/A'}
                      </td>

                      {/* Action Owner */}
                      <td className="rar-td-assessment">
                        {risk.actionOwner || 'N/A'}
                      </td>

                      {/* Target Date */}
                      <td className="rar-td-assessment">
                        {risk.targetDate || 'N/A'}
                      </td>

                      {/* Residual Likelihood */}
                      <td className="rar-td-assessment">
                        {(() => {
                          if (risk.assessmentType === 'quantitative') {
                            // For quantitative risks, show ARO value
                            return risk.residualAro ? `${risk.residualAro}/year` : 'N/A';
                          } else if (risk.assessmentType === 'advancedQuantitative') {
                            // For advanced quantitative risks, check for exponential lambda parameters first
                            const lambdaValue = risk.residualFrequencyLambda || risk.residualFrequencyLambdaExp;
                            if (lambdaValue) {
                              return `λ=${parseFloat(lambdaValue).toFixed(2)}/year`;
                            }
                            // Fall back to other frequency parameters
                            const frequency = risk.residualMostLikelyFrequency || risk.residualFrequencyMean || 
                                            risk.mostLikelyFrequency || risk.frequencyMean;
                            return frequency ? `${parseFloat(frequency).toFixed(2)}/year` : 'N/A';
                          } else {
                            // For qualitative risks, show likelihood description
                            return risk.residualLikelihood ? (likelihoodMap[risk.residualLikelihood] || risk.residualLikelihood) : 'N/A';
                          }
                        })()}
                      </td>

                      {/* Residual Impact */}
                      <td className="rar-td-assessment">
                        {(() => {
                          if (risk.assessmentType === 'quantitative') {
                            // For quantitative risks, show SLE value
                            return risk.residualSle ? formatCurrency(parseFloat(risk.residualSle)) : 'N/A';
                          } else if (risk.assessmentType === 'advancedQuantitative') {
                            // For advanced quantitative risks, show loss from Monte Carlo or fallback to main
                            const loss = risk.residualMostLikelyLoss || risk.residualLossMean || 
                                        risk.mostLikelyLoss || risk.lossMean;
                            return loss ? formatCurrency(parseFloat(loss), risk.residualSleCurrency || risk.sleCurrency) : 'N/A';
                          } else {
                            // For qualitative risks, show impact description
                            return risk.residualImpact ? (impactMap[risk.residualImpact] || risk.residualImpact) : 'N/A';
                          }
                        })()}
                      </td>

                      {/* Residual Risk */}
                      <td className="rar-td-assessment">
                        {(() => {
                          // For qualitative assessments, use the calculated residual risk level
                          if (risk.calculatedResidualRiskLevel) {
                            return (
                              <div
                                className={
                                  "rar-td-residual-badge " +
                                  (["low", "medium", "high", "extreme"].includes(risk.calculatedResidualRiskLevel.toLowerCase())
                                    ? risk.calculatedResidualRiskLevel.toLowerCase()
                                    : "default")
                                }
                              >
                                {risk.calculatedResidualRiskLevel.toUpperCase()}
                              </div>
                            );
                          }
                          
                          // For advanced quantitative assessments, use pre-calculated value or calculate
                          if (risk.assessmentType === 'advancedQuantitative') {
                            try {
                              // First try to use the pre-calculated residual expected loss
                              let residualEAL = 0;
                              if (risk.residualExpectedLoss && typeof risk.residualExpectedLoss === 'string') {
                                // Extract numeric value from formatted string like "$1,234.56"
                                const match = risk.residualExpectedLoss.match(/[\d,]+\.?\d*/);
                                if (match) {
                                  residualEAL = parseFloat(match[0].replace(/,/g, ''));
                                }
                              }
                              
                              // If no pre-calculated value, fall back to calculation
                              if (residualEAL === 0) {
                                residualEAL = getResidualMonteCarloExpectedLossNumeric(risk);
                              }
                              
                              if (residualEAL > 0) {
                                const residualRiskLevel = getAdvancedQuantitativeRiskLevel(residualEAL);
                                return (
                                  <div
                                    className={
                                      "rar-td-residual-badge " +
                                      (["low", "medium", "high", "extreme"].includes(residualRiskLevel.toLowerCase())
                                        ? residualRiskLevel.toLowerCase()
                                        : "default")
                                    }
                                  >
                                    {residualRiskLevel.toUpperCase()}
                                  </div>
                                );
                              }
                            } catch (error) {
                              console.warn('Error calculating residual Monte Carlo EAL for table:', error);
                            }
                          }
                          
                          // For quantitative assessments, calculate from residual ALE
                          if (risk.assessmentType === 'quantitative' && risk.residualSle && risk.residualAro) {
                            const residualALE = calculateResidualALE(risk);
                            if (residualALE > 0) {
                              const residualRiskLevel = getQuantitativeRiskLevel(residualALE);
                              return (
                                <div
                                  className={
                                    "rar-td-residual-badge " +
                                    (["low", "medium", "high", "extreme"].includes(residualRiskLevel.toLowerCase())
                                      ? residualRiskLevel.toLowerCase()
                                      : "default")
                                  }
                                >
                                  {residualRiskLevel.toUpperCase()}
                                </div>
                              );
                            }
                          }
                          
                          return 'Not Set';
                        })()}
                      </td>

                      {/* Review Date */}
                      <td className="rar-td-assessment">
                        {risk.reviewDate || 'N/A'}
                      </td>

                      {/* Status */}
                      <td className="rar-td-assessment">
                        <div
                            className={
                                "rar-td-status-badge " +
                                (["open", "in-progress", "monitoring", "closed"].includes((risk.status || "").toLowerCase())
                                    ? (risk.status || "").toLowerCase()
                                    : "default")
                            }
                        >
                            {risk.status
                                ? risk.status.replace(/(^|\s|-)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase())
                                : 'N/A'}
                        </div>
                      </td>

                      {/* Closed Date */}
                      <td className="rar-td-assessment">
                        {risk.closedDate || 'N/A'}
                      </td>

                      {/* Closed By */}
                      <td className="rar-td-assessment">
                        {risk.closedBy || 'N/A'}
                      </td>

                      {/* Approver */}
                      <td className="rar-td-assessment">
                        {risk.approver || 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="rar-action-cell">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleMoveRisk(index, index - 1);
                              }}
                              disabled={index === 0}
                              className="rar-action-button"
                              title="Move Up"
                            >
                              ▲
                            </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleMoveRisk(index, index + 1);
                              }}
                              disabled={index === risks.length - 1}
                              className="rar-action-button"
                              title="Move Down"
                            >
                              ▼
                            </button>
                        <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRisk(index);
                            }}                            
                            className="rar-action-button rar-action-button-remove"
                            title="Remove Risk"
                          >
                            🗑
                          </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p></p>
            </div>
          </div>
        )}

        {/* No Risks Message when closed */}
        {risks.length === 0 && risksOpen && (
          <div className='rar-table-no-risks'>
            <h4 className='rar-table-empty h4'>
              Current Risk Assessment - No Risks Identified
            </h4>
            <p className='rar-table-empty p'>
              No risks have been added to the current assessment yet. Use
              the "RAR Fields" section above to:
            </p>
            <ul
              className='rar-table-empty ul'
            >
              <li className='rar-table-empty li'>
                • Fill in risk details (title, description, category,
                etc.)
              </li>
              <li className='rar-table-empty li'>
                • Assess likelihood and impact
              </li>
              <li className='rar-table-empty li'>
                • Define mitigation strategies
              </li>
              <li className='rar-table-empty li'>
                • Click "Submit Risk Details" to add to this table
              </li>
            </ul>
            <button
                onClick={handleNewRisk}
                className="rar-btn-add-first-risk"
                >
                + Add First Risk
            </button>
          </div>
        )}

        {/* Risk Assessment Table Legend */}
        <div className='rar-table-legend'>
          <div className='rar-table-legend-content'>
            <span className='rar-table-legend-label'>
              Legend:
            </span>
            <div className='rar-table-legend-item'>
              <div className="rar-legend-square-selected"></div>
              <span>Selected Risk</span>
            </div>
            <div className="rar-legend-flex-row">
              <div className="rar-legend-square-current-edit"></div>
              <span>Currently Editing in RAR Fields</span>
            </div>
            <div className="rar-legend-flex-row">
              <div className="rar-legend-square-drag-drop"></div>
              <span>Drag Drop Target</span>
            </div>
            <div className="rar-legend-flex-row">
              <span className="rar-legend-risk-level">
                Risk Level
              </span>
              <span>Color-coded by severity</span>
            </div>
            <div className="rar-legend-flex-row">
              <span className="rar-action-button">▲▼</span>
              <span>Use arrows or drag rows to reorder</span>
            </div>            
            <div className="rar-legend-flex-row">
              <span className="rar-action-button rar-action-button-remove">🗑</span>
              <span>Remove the risk entry</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='rar-table-button-container'>
          <button
            type="button"
            onClick={rarFieldsOpen ? undefined : handleNewRisk}
            disabled={rarFieldsOpen}
            className={`rar-btn rar-btn-outline-secondary ${rarFieldsOpen ? 'disabled' : ''}`}
          >
            + Add New Risk
          </button>
          
          <button
            type="button"
            onClick={handleStartNew}
            className="rar-btn rar-btn-outline-primary"
          >
            🗑️ Start New
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="rar-btn rar-btn-accent"
          >
            📊 Export to Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default RARTable;
