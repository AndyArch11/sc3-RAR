const fs = require('fs')
const path = require('path')

// Simple CSS parser to find duplicate rules
function findDuplicates() {
  const cssFiles = [
    './src/index.css',
    './src/App.css',
    './src/components/RAR.css'
  ]

  const allRules = new Map()
  const duplicates = []
  const selectorCount = new Map()

  cssFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      console.log(`\nAnalyzing: ${filePath}`)
      const content = fs.readFileSync(filePath, 'utf8')
      
      // Remove comments
      const cleanContent = content.replace(/\/\*[\s\S]*?\*\//g, '')
      
      // Extract CSS rules (basic regex approach)
      const rulePattern = /([^{}]+)\s*\{([^{}]*)\}/g
      let match
      
      while ((match = rulePattern.exec(cleanContent)) !== null) {
        const selector = match[1].trim()
        const properties = match[2].trim()
        
        if (selector && properties) {
          // Count selector usage
          selectorCount.set(selector, (selectorCount.get(selector) || 0) + 1)
          
          // Check for duplicate rules
          const ruleKey = `${selector}|${properties}`
          if (allRules.has(ruleKey)) {
            duplicates.push({
              selector,
              properties,
              file1: allRules.get(ruleKey),
              file2: filePath
            })
          } else {
            allRules.set(ruleKey, filePath)
          }
        }
      }
    }
  })

  // Report duplicates
  console.log('\n=== DUPLICATE CSS RULES ===')
  if (duplicates.length === 0) {
    console.log('✅ No exact duplicate rules found!')
  } else {
    duplicates.forEach((dup, index) => {
      console.log(`\n${index + 1}. Duplicate rule:`)
      console.log(`   Selector: ${dup.selector}`)
      console.log(`   Properties: ${dup.properties}`)
      console.log(`   Found in: ${dup.file1} and ${dup.file2}`)
    })
  }

  // Report selectors used multiple times
  console.log('\n=== SELECTORS USED MULTIPLE TIMES ===')
  const multipleSelectors = Array.from(selectorCount.entries())
    .filter(([selector, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])

  if (multipleSelectors.length === 0) {
    console.log('✅ No selectors are defined multiple times!')
  } else {
    multipleSelectors.forEach(([selector, count]) => {
      console.log(`   ${selector}: ${count} times`)
    })
  }

  // Analyze CSS size
  console.log('\n=== CSS FILE SIZES ===')
  cssFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath)
      const purgedPath = filePath.replace('.css', '.purged.css')
      let purgedSize = 0
      if (fs.existsSync(purgedPath)) {
        purgedSize = fs.statSync(purgedPath).size
      }
      
      console.log(`${filePath}:`)
      console.log(`   Original: ${stats.size} bytes`)
      if (purgedSize > 0) {
        console.log(`   After purge: ${purgedSize} bytes`)
        console.log(`   Potential savings: ${stats.size - purgedSize} bytes (${((stats.size - purgedSize) / stats.size * 100).toFixed(1)}%)`)
      }
    }
  })
}

findDuplicates()
