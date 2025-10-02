
import * as XLSX from 'xlsx';

// Utility function to export risks to Excel
export const exportRisksToExcel = (risks) => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Add a worksheet with guidance content
    const guidanceContent = createGuidanceContent();
    const additionalContent = createAdditionalConsiderationsContent();
    const riskTableData = createRiskTableData(risks);
    
    // Create worksheets
    const guidanceWS = XLSX.utils.aoa_to_sheet(guidanceContent);
    const additionalWS = XLSX.utils.aoa_to_sheet(additionalContent);
    const riskTableWS = XLSX.utils.aoa_to_sheet(riskTableData);

    // Set column widths for better readability
    guidanceWS['!cols'] = [{ wch: 100 }];
    additionalWS['!cols'] = [{ wch: 100 }];

    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(workbook, guidanceWS, "RAR Guidance");
    XLSX.utils.book_append_sheet(workbook, additionalWS, "Additional Considerations");
    XLSX.utils.book_append_sheet(workbook, riskTableWS, "Current Risk Assessment");

    // Generate timestamp for filename
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // Format: YYYY-MM-DDTHH-MM-SS
    const filename = `SC3_Risk_Assessment_Report_Export_${timestamp}.xlsx`;
    
    // Export the workbook
    XLSX.writeFile(workbook, filename);
        
    console.log(`Excel file "${filename}" has been generated and downloaded successfully.`);

  } catch (error) {
    console.error('Error creating Excel export:', error);
        alert('An error occurred while creating the Excel file. Please try again.');
  }
};

    // Get RAR Guidance and Preparation content
const createGuidanceContent = () => {
  return [
    ['RAR Guidance and Preparation'],
    [''],
    ['Purpose'],
    ['This Risk Assessment Report (RAR) template is designed to facilitate comprehensive risk identification, analysis, and treatment planning for organisations of all sizes. The template supports both qualitative and quantitative risk assessment methodologies and provides structured guidance for documenting risk management activities.'],
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
    ['• Align risk treatment with organisational risk appetite'],[""],
    [
      `Risk Assessment Form - Generated on ${new Date().toLocaleDateString()}`
    ]
  ];
};

  // Get Additional Considerations content
const createAdditionalConsiderationsContent = () => {
  return [
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
    ['• Risk Evaluation: Risk level determinations and prioritisation'],
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
    ['Note: The RAR structure should be tailored to organisational needs and regulatory requirements. Consider industry-specific risk factors and compliance obligations when developing the assessment framework.']
  ];
};

// Get Current Risk Assessment table data
const createRiskTableData = (risks) => {

  const sectionHeaders = [
    'Risk Details',
    '', '', '', '', '', '', '', '', '', '', '',  //{12}
    'Risk Assessment',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '' //{30}
  ];

  const riskTableHeaders = [
      'Risk ID', 'Risk Title', 'Framework', 'Category', 'Description', 'Assessor', 
      'Assessed Date', 'Risk Owner', 'Threat Source', 'Vulnerability', 'Current Controls',
      'Control Effectiveness', 'Assessment Type', 'Likelihood', 'Impact', 'Risk Level',
      'SLE', 'ARO', 'ALE', 'Monte Carlo Iterations', 'Loss Distribution', 'Min Loss',
      'Most Likely Loss', 'Max Loss', 'Frequency Distribution', 'Min Frequency',
      'Most Likely Frequency', 'Max Frequency', 'Confidence Level', 'Expected Loss',
      'Value at Risk', 'Monte Carlo Results', 'Treatment Strategy', 'Recommended Actions', 'Action Owner',
      'Target Date', 'Review Date', 'Status', 'Residual Likelihood', 'Residual Impact',
      'Residual Risk Level', 'Closed Date', 'Closed By', 'Approver'
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
      risk.monteCarloIterations || '',
      risk.lossDistribution || '',
      risk.minLoss || '',
      risk.mostLikelyLoss || '',
      risk.maxLoss || '',
      risk.frequencyDistribution || '',
      risk.minFrequency || '',
      risk.mostLikelyFrequency || '',
      risk.maxFrequency || '',
      risk.confidenceLevel || '',
      risk.expectedLoss || '',
      risk.valueAtRisk || '',
      risk.monteCarloResults || '',
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
      risk.closedBy || '',
      risk.approver || ''
    ];
    riskTableData.push(row);
  });

  return [sectionHeaders, ...riskTableData];
};


