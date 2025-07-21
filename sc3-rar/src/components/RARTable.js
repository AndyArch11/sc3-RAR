import React from 'react';
import ExcelExport from './ExcelExport';
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
  isEditingRisk,
  
  // Calculation functions
  calculateALE,
  formatCurrency,
  getRiskColor,
  getStatusColor,
  
  // Constants
  SC3_PRIMARY,
  SC3_SECONDARY,
  SC3_GREEN,
  SC3_ACCENT,
  SC3_TABLE_BG,
  SC3_TABLE_HEADER_BG,
  SC3_TABLE_BORDER_RADIUS,
  SC3_BORDER_RADIUS,
  SC3_BTN_PADDING,
  SC3_BTN_RADIUS,
  SC3_BTN_FONT_WEIGHT,
  SC3_BTN_FONT_SIZE,
  SC3_BTN_BOX_SHADOW,
  
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

  return (
    <div className="rar-table-container">
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
                  <div className="rar-table-stat-value">{risks.length}</div>
                </div>
                {risks.filter((r) => r.assessmentType === "qualitative").length > 0 && (
                  <div className="rar-table-stat-item">
                    <div className="rar-table-stat-label">Qualitative</div>
                    <div className="rar-table-stat-value" style={{ color: SC3_SECONDARY }}>
                      {risks.filter((r) => r.assessmentType === "qualitative").length}
                    </div>
                  </div>
                )}
                {risks.filter((r) => r.assessmentType === "quantitative").length > 0 && (
                  <div className="rar-table-stat-item">
                    <div className="rar-table-stat-label">Quantitative</div>
                    <div className="rar-table-stat-value" style={{ color: SC3_ACCENT }}>
                      {risks.filter((r) => r.assessmentType === "quantitative").length}
                    </div>
                  </div>
                )}
                {risks.filter((r) => r.assessmentType === "advancedQuantitative").length > 0 && (
                  <div className="rar-table-stat-item">
                    <div className="rar-table-stat-label">Advanced Quantitative</div>
                    <div className="rar-table-stat-value" style={{ color: "#8B4513" }}>
                      {risks.filter((r) => r.assessmentType === "advancedQuantitative").length}
                    </div>
                  </div>
                )}
                {risks.filter((r) => r.status === "open").length > 0 && (
                  <div className="rar-table-stat-item">
                    <div className="rar-table-stat-label">Open</div>
                    <div className="rar-table-stat-value" style={{ color: "#dc3545" }}>
                      {risks.filter((r) => r.status === "open").length}
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
            <div
              style={{
                width: "100%",
                overflowX: "auto",
                padding: "0 0.05rem",
                boxSizing: "border-box"
              }}
            >
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
                    <th colspan={12} className="rar-table-header-primary rar-table-header-group">Risk Assessment</th>
                    <th colspan={16} className="rar-table-header-green rar-table-header-group">Risk Details</th>
                  </tr>
                  <tr>
                    <th className="rar-table-header-primary">Risk ID</th>
                    <th className="rar-table-header-primary">Risk Title</th>
                    <th className="rar-table-header-primary">Framework</th>
                    <th className="rar-table-header-primary rar-table-header-center">Category</th>
                    <th className="rar-table-header-primary rar-table-header-center">Description</th>
                    <th className="rar-table-header-primary rar-table-header-center">Assessor</th>
                    <th className="rar-table-header-primary rar-table-header-center">Assessed Date</th>
                    <th className="rar-table-header-primary rar-table-header-center">Owner</th>
                    <th className="rar-table-header-primary rar-table-header-center">Threat Source</th>
                    <th className="rar-table-header-primary rar-table-header-center">Vulnerability</th>
                    <th className="rar-table-header-primary rar-table-header-center">Current Controls</th>
                    <th className="rar-table-header-primary rar-table-header-center">Control Effectiveness</th>
                    <th className="rar-table-header-green rar-table-header-center">Assessment Type</th>
                    <th className="rar-table-header-green rar-table-header-center">Likelihood</th>
                    <th className="rar-table-header-green rar-table-header-center">Impact</th>
                    <th className="rar-table-header-green rar-table-header-center">Risk Level</th>
                    <th className="rar-table-header-green rar-table-header-center">Treatment Strategy</th>
                    <th className="rar-table-header-green rar-table-header-center">Recommended Actions</th>
                    <th className="rar-table-header-green rar-table-header-center">Action Owner</th>
                    <th className="rar-table-header-green rar-table-header-center">Target Date</th>
                    <th className="rar-table-header-green rar-table-header-center">Residual Likelihood</th>
                    <th className="rar-table-header-green rar-table-header-center">Residual Impact</th>
                    <th className="rar-table-header-green rar-table-header-center rar-table-header-wide">Residual Risk</th>
                    <th className="rar-table-header-green rar-table-header-center rar-table-header-extra-wide">Review Date</th>
                    <th className="rar-table-header-green rar-table-header-center">Status</th>
                    <th className="rar-table-header-green rar-table-header-center">Closed Date</th>
                    <th className="rar-table-header-green rar-table-header-center rar-table-header-extra-wide">Closed By</th>
                    <th className="rar-table-header-green rar-table-header-center">Approver</th>
                    <th className="rar-table-header-primary rar-table-header-center rar-table-header-narrow">Actions</th>
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
                      onClick={() => setSelectedRiskIndex(selectedRiskIndex === index ? null : index)}
                      className={`rar-table-row 
                        ${selectedRiskIndex === index ? 'rar-table-row-selected' : ''} 
                        ${dropTargetIndex === index ? 'rar-table-row-drop-target' : ''} 
                        ${draggedRiskIndex === index ? 'rar-table-row-dragged' : ''} 
                        ${index % 2 === 0 ? 'rar-table-row-even' : 'rar-table-row-odd'}`}
                    >
                      {/* Risk ID */}
                      <td className="rar-table-cell-primary rar-table-cell-bold">{risk.riskId || 'N/A'}</td>

                      {/* Risk Title */}
                      <td className="rar-table-cell-primary rar-table-cell-wrap">{risk.riskTitle || 'N/A'}</td>

                      {/* Framework */}
                      <td className="rar-table-cell-primary rar-table-cell-center">{risk.framework || 'N/A'}</td>

                      {/* Category */}
                      <td className="rar-table-cell-primary rar-table-cell-center">{risk.category || 'N/A'}</td>

                      {/* Description */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_PRIMARY}`,
                          maxWidth: "200px",
                          wordBreak: "break-word",
                        }}
                      >
                        {risk.description || 'N/A'}
                      </td>

                      {/* Assessor */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_PRIMARY}`,
                          textAlign: "center",
                        }}
                      >
                        {risk.assessor || 'N/A'}
                      </td>

                      {/* Assessed Date */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_PRIMARY}`,
                          textAlign: "center",
                        }}
                      >
                        {risk.assessedDate || 'N/A'}
                      </td>

                      {/* Owner */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_PRIMARY}`,
                          textAlign: "center",
                        }}
                      >
                        {risk.owner || 'N/A'}
                      </td>

                      {/* Threat Source */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_PRIMARY}`,
                          textAlign: "center",
                        }}
                      >
                        {risk.threatSource || 'N/A'}
                      </td>

                      {/* Vulnerability */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_PRIMARY}`,
                          maxWidth: "150px",
                          wordBreak: "break-word",
                        }}
                      >
                        {risk.vulnerability || 'N/A'}
                      </td>

                      {/* Current Controls */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_PRIMARY}`,
                          maxWidth: "150px",
                          wordBreak: "break-word",
                        }}
                      >
                        {risk.currentControls || 'N/A'}
                      </td>

                      {/* Control Effectiveness */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_PRIMARY}`,
                          textAlign: "center",
                        }}
                      >
                        {risk.controlEffectiveness || 'N/A'}
                      </td>

                      {/* Assessment Type */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_GREEN}`,
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            background: 
                              risk.assessmentType === 'qualitative' ? SC3_SECONDARY :
                              risk.assessmentType === 'quantitative' ? SC3_ACCENT :
                              risk.assessmentType === 'advancedQuantitative' ? '#8B4513' : '#ccc',
                            color: "#fff",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            fontSize: "0.8em",
                          }}
                        >
                          {risk.assessmentType === 'qualitative' ? 'Qualitative' :
                           risk.assessmentType === 'quantitative' ? 'Quantitative' :
                           risk.assessmentType === 'advancedQuantitative' ? 'Advanced' : 'N/A'}
                        </div>
                      </td>

                      {/* Likelihood */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_GREEN}`,
                          textAlign: "center",
                        }}
                      >
                        {risk.assessmentType === 'qualitative' 
                          ? (likelihoodMap[risk.likelihood] || risk.likelihood || 'N/A')
                          : risk.assessmentType === 'quantitative'
                          ? (risk.aro || 'N/A')
                          : risk.assessmentType === 'advancedQuantitative'
                          ? 'Monte Carlo'
                          : 'N/A'}
                      </td>

                      {/* Impact */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_GREEN}`,
                          textAlign: "center",
                        }}
                      >
                        {risk.assessmentType === 'qualitative' 
                          ? (impactMap[risk.impact] || risk.impact || 'N/A')
                          : risk.assessmentType === 'quantitative'
                          ? (risk.sle ? formatCurrency(parseFloat(risk.sle), risk.sleCurrency) : 'N/A')
                          : risk.assessmentType === 'advancedQuantitative'
                          ? 'Simulation'
                          : 'N/A'}
                      </td>

                      {/* Risk Level */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_GREEN}`,
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            background: risk.riskLevel ? getRiskColor(risk.riskLevel.charAt(0).toUpperCase() + risk.riskLevel.slice(1)) : '#ccc',
                            color: "#fff",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            fontSize: "0.8em",
                          }}
                        >
                          {risk.riskLevel?.toUpperCase() || 'Not Set'}
                        </div>
                      </td>

                      {/* Treatment Strategy */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_GREEN}`,
                          textAlign: "center",
                        }}
                      >
                        {risk.treatmentStrategy || 'N/A'}
                      </td>

                      {/* Recommended Actions */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_GREEN}`,
                          maxWidth: "150px",
                          wordBreak: "break-word",
                        }}
                      >
                        {risk.recommendedActions || 'N/A'}
                      </td>

                      {/* Action Owner */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_GREEN}`,
                          textAlign: "center",
                        }}
                      >
                        {risk.actionOwner || 'N/A'}
                      </td>

                      {/* Target Date */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_GREEN}`,
                          textAlign: "center",
                        }}
                      >
                        {risk.targetDate || 'N/A'}
                      </td>

                      {/* Residual Likelihood */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_GREEN}`,
                          textAlign: "center",
                        }}
                      >
                        {risk.residualLikelihood ? (likelihoodMap[risk.residualLikelihood] || risk.residualLikelihood) : 'N/A'}
                      </td>

                      {/* Residual Impact */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_GREEN}`,
                          textAlign: "center",
                        }}
                      >
                        {risk.residualImpact ? (impactMap[risk.residualImpact] || risk.residualImpact) : 'N/A'}
                      </td>

                      {/* Residual Risk */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_GREEN}`,
                          textAlign: "center",
                        }}
                      >
                        {risk.residualRiskLevel ? (
                          <div
                            style={{
                              background: getRiskColor(risk.residualRiskLevel.charAt(0).toUpperCase() + risk.residualRiskLevel.slice(1)),
                              color: "#fff",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontWeight: "bold",
                              fontSize: "0.8em",
                            }}
                          >
                            {risk.residualRiskLevel.toUpperCase()}
                          </div>
                        ) : 'N/A'}
                      </td>

                      {/* Review Date */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_GREEN}`,
                          textAlign: "center",
                        }}
                      >
                        {risk.reviewDate || 'N/A'}
                      </td>

                      {/* Status */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_GREEN}`,
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            background: getStatusColor(risk.status),
                            color: "#fff",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            fontSize: "0.8em",
                          }}
                        >
                          {risk.status?.charAt(0).toUpperCase() + risk.status?.slice(1) || 'N/A'}
                        </div>
                      </td>

                      {/* Closed Date */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_GREEN}`,
                          textAlign: "center",
                        }}
                      >
                        {risk.closedDate || 'N/A'}
                      </td>

                      {/* Closed By */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_GREEN}`,
                          textAlign: "center",
                        }}
                      >
                        {risk.closedBy || 'N/A'}
                      </td>

                      {/* Approver */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_GREEN}`,
                          textAlign: "center",
                        }}
                      >
                        {risk.approver || 'N/A'}
                      </td>

                      {/* Actions */}
                      <td
                        style={{
                          padding: "8px",
                          border: `1px solid ${SC3_PRIMARY}`,
                          textAlign: "center",
                        }}
                      >
                        <div className="rar-table-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditRisk(index);
                            }}
                            className="rar-btn secondary small"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRisk(index);
                            }}
                            className="rar-btn danger small"
                          >
                            Delete
                          </button>
                          <div className="rar-table-move-buttons">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveRisk(index, index - 1);
                              }}
                              disabled={index === 0}
                              className={`rar-btn move ${index === 0 ? 'disabled' : ''}`}
                            >
                              ▲
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveRisk(index, index + 1);
                              }}
                              disabled={index === risks.length - 1}
                              className={`rar-btn move ${index === risks.length - 1 ? 'disabled' : ''}`}
                            >
                              ▼
                            </button>
                          </div>
                        </div>
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
            onClick={rarFieldsOpen ? undefined : handleNewRisk}
            disabled={rarFieldsOpen}
            className={`rar-btn success ${rarFieldsOpen ? 'disabled' : ''}`}
          >
            + Add New Risk
          </button>
          
          <button
            onClick={handleStartNew}
            className="rar-btn danger"
          >
            🗑️ Start New
          </button>
          
          <ExcelExport 
            risks={risks} 
            onExport={(filename) => {
              console.log(`Excel export completed: ${filename}`);
            }}
            buttonStyle={{
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
            hoverColor="#007bb5"
          />
        </div>
      </div>
    </div>
  );
};

export default RARTable;
