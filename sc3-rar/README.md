# Risk Assessment Report (RAR) - Single Page Application

This project provides a Risk Assessment Report (BRAR) in a simple Single Page Application (SPA) built using React.

## Available Scripts

- A Risk Assessment Report form that calculates risks to assets
- Exports results to an Excel spreadsheet for ongoing development

## Project Structure

```
sc3-rar
├── build
│   ├── static        
│   │   ├── css  
│   │   │    ├── main.xxxx.css         # CSS styles for the application
│   │   │    └── main.xxxx.css.map     # CSS minifier map file
│   │   └── js 
│   │        ├── main.xxxx.js          # React compiled Javascript file
│   │        └── main.xxxx.LICENSE.txt # React MIT licensing
│   │        └── main.xxxx.js.map      # JavaScript minifier map file
│   ├── asset-manifest.json            # Manifest of files in build
│   └── index.html.json                # Main HTML file
│   └── robots.txt                     # web crawler directives
│ 
├── node-modules           # supporting JavaScript libraries
│ 
├── public
│   ├── index.html         # Main HTML file
│   └── robots.txt         # web crawler directives
├── src
│   ├── index.js           # Entry point for the React application, imports App.js
│   ├── index.css          # CSS styles for the React application
│   ├── App.js             # Main App component, imports BIAForm
│   ├── App.css            # CSS styles for the application
│   └── components
│       └── RARForm.js     # RAR SPA form
            distribution.js # logic for the different Monte Carlo distribution algorithms
            montecarlo.js  # Monte Carlo simulations
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
### `npm install xlsx --save`

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.
