# Risk Assessment Report (RAR) - Single Page Application

This project provides a Risk Assessment Report (BRAR) in a simple Single Page Application (SPA) built using React.

## Available Scripts

- A Risk Assessment Report form that calculates risks to assets
- Exports results to an Excel spreadsheet for ongoing development

## Project Structure

```
sc3-rar
├── dist
│   ├── assets
│   │   ├── index-xxxx.css             # Compiled CSS styles
│   │   ├── index-xxxx.js              # Main application bundle
│   │   ├── vendor-xxxx.js             # Core vendor libraries bundle
│   │   ├── ExcelExport-xxxx.js        # Lazy-loaded Excel export bundle
│   │   └── rolldown-runtime-xxxx.js   # Module runtime helper
│   └── index.html                     # Compiled root HTML file
│ 
├── node-modules           # supporting JavaScript libraries
│ 
├── public
│   └── robots.txt         # Web crawler directives
├── src
│   ├── index.jsx          # Entry point for the React application, mounts App
│   ├── index.css          # CSS styles for the React application
│   ├── App.jsx            # Main App component, imports RARForm
│   ├── App.css            # CSS styles for the application
│   └── util
│   │   └── DistributionChart.jsx   # Logic for creating charts for the Monte Carlo algorithms
│   │   └── distribution.js         # logic for the different Monte Carlo distribution algorithms
│   │   └── montecarlo.js           # Monte Carlo simulations
│   │   └── RiskHeatMap.jsx         # Creates the heatmaps used by this SPA
│   │   └── TornadoGraphCustom.jsx  # Creates the Sensitivity Analysis Tornado Graph
│   │   └── ExcelExport.js          # ExcelJS workbook generator, lazy-loaded on export
│   └── components
│       └── RAR.css                 # CSS for the components
│       └── RARForm.jsx             # RAR SPA form
│       └── RARInputForm.jsx        # Captures the Risk details
│       └── RARIntro.jsx            # Provides guidance on the use of the Risk Assessment Report
│       └── RARReport.jsx           # Provides a summary of the Risk Assessments
│       └── RARTable.jsx            # Lists the Risks, and their more relevant attributes
│   ├── App.test.jsx                # App-level rendering tests
│   └── setupTests.js               # Vitest and Testing Library test configuration
├── index.html                      # Vite root entry HTML template
├── vite.config.mjs                 # Vite and Vitest configuration
├── eslint.config.mjs               # ESLint flat configuration
├── .stylelintrc.json               # Stylelint configuration
├── package.json           # npm configuration file
└── README.md              # Project documentation
```

## Getting Started

To get started with this project, follow these steps:

### Clone the repository:
 
### `git clone https://github.com/AndyArch11/sc3-RAR.git`

change to the project directory
### `cd sc3-rar`

### Install dependencies

In the project folder

### `npm install`
### `npm install recharts`
### `npm install chart.js react-chartjs-2`
### `npm install react-router-dom`

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the Vitest test runner.

### `npm run test:watch`

Runs Vitest in interactive watch mode for active development.

### `npm run lint`

Performs a lint parse across the project.

### `npm run lint:css`

Performs a lint parse across the project's CSS files.

### `npm run build`

Builds the app for production to the `dist` folder using Vite.\
It correctly bundles React in production mode and optimises the build for the best performance.
The build process bundles the deployment package into separate chunks for faster downloads. The Excel bundle is lazy loaded at the time of requesting an Excel extract.

When making updates to the code, ensure that you update the `Version` number in `RARForm.jsx`.

The build is minified and the filenames include hashes for cache busting.\
Your app is ready to be deployed!

If launching as an embedded SPA, configure the following entry points in the host HTML page:

``` html
<!-- 1. Include CSS -->
<link rel="stylesheet" href="./assets/index-Dw_vEnho.css">

<!-- 2. Target container -->
<div id="root"></div>

<!-- 3. Entrypoint script (loads all other modules automatically) -->
<script type="module" src="./assets/index-tBs8NxRc.js"></script>
```

Or embedded as an `<iframe>` for CSS/JS isolation

``` html
<iframe 
  src="/path-to-app/index.html" 
  width="100%" 
  height="900px" 
  style="border: none;">
</iframe>
```

N.B. Current vite build generates a new hash with each build

``` pwsh
npm run build   

> sc3-rar@0.1.0 build
> vite build

vite v8.3.0 building client environment for production...
✓ 611 modules transformed.
computing gzip size...
dist/index.html                             0.78 kB │ gzip:   0.40 kB
dist/assets/index-CzEHMEI4.css             95.11 kB │ gzip:  14.90 kB
dist/assets/rolldown-runtime-Dd_uD5pT.js    1.10 kB │ gzip:   0.62 kB
dist/assets/vendor-B-PrPiPH.js            221.94 kB │ gzip:  69.40 kB
dist/assets/index-Sou71wr6.js             822.39 kB │ gzip: 182.03 kB
dist/assets/ExcelExport-BHAeik8_.js       936.93 kB │ gzip: 259.37 kB
```

To not have the file names being regenerated with each build, update `vite.config.mjs` with:

``` js
build: {
  chunkSizeWarningLimit: 1200,
  rollupOptions: {
    output: {
      entryFileNames: 'assets/sc3-app.js',
      chunkFileNames: 'assets/[name].js',
      assetFileNames: 'assets/[name].[ext]',
    },
  },
}
```