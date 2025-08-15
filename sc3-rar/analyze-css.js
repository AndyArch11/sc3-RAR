const { PurgeCSS } = require('purgecss')

async function analyzeCss() {
  const purgeCSSResult = await new PurgeCSS().purge({
    content: [
      './src/**/*.html',
      './src/**/*.js',
      './src/**/*.jsx',
      './public/index.html'
    ],
    css: [
      './src/**/*.css'
    ],
    // Don't remove these classes even if not found
    safelist: [
      /^rar-/,  // Keep all classes starting with rar-
      /^sc3-/,  // Keep all classes starting with sc3-
      'active',
      'disabled',
      'hidden',
      'show',
      'fade',
      'in'
    ]
  })

  console.log('=== UNUSED CSS ANALYSIS ===')
  console.log('\nCSS files analyzed:')
  purgeCSSResult.forEach((file, index) => {
    console.log(`${index + 1}. ${file.file || 'inline'}`)
    console.log(`   After purge: ${file.css.length} characters`)
    console.log('---')
  })

  // Write purged CSS to see what would remain
  const fs = require('fs')
  purgeCSSResult.forEach((file, index) => {
    if (file.file) {
      const outputFile = file.file.replace('.css', '.purged.css')
      fs.writeFileSync(outputFile, file.css)
      console.log(`Purged CSS written to: ${outputFile}`)
    }
  })
}

analyzeCss().catch(console.error)
