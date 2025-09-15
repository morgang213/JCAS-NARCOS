# JCAS-NARCOS v1.0.0

Welcome to JCAS-NARCOS - a modern React web application for medication box tracking.

**🎉 Version 1.0.0 Release** - This is the first stable release with GitHub Pages deployment.

## 🌐 Live Demo

The application is automatically deployed to GitHub Pages:
**[https://morgang213.github.io/JCAS-NARCOS](https://morgang213.github.io/JCAS-NARCOS)**

[![Build and Deploy](https://github.com/morgang213/JCAS-NARCOS/workflows/Build%20and%20Deploy%20to%20GitHub%20Pages/badge.svg)](https://github.com/morgang213/JCAS-NARCOS/actions)

## 🚀 Deployment

This project uses GitHub Actions for continuous deployment to GitHub Pages:

- **Automatic Deployment**: Every push to the `main` branch triggers an automated build and deployment
- **Build Process**: Tests are run, then the React app is built for production
- **Deployment Target**: The built application is deployed to the `gh-pages` branch and served at the live demo URL

### Manual Deployment

To deploy manually or test the deployment process locally:

```bash
# Build the project
npm run build

# The build folder contains the static files ready for deployment
# These files are automatically deployed by GitHub Actions
```

## Quick Links
- [Release Notes](./RELEASE_NOTES.md) - What's new in v1.0.0
- [Windows Deployment Guide](./WINDOWS_DEPLOYMENT.md) - Complete Windows setup instructions

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Windows Installation

For detailed Windows setup instructions, see our [Windows Deployment Guide](./WINDOWS_DEPLOYMENT.md).

**Quick Start on Windows:**
```cmd
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

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

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.
