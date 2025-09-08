# JCAS-NARCOS Release Notes

## Version 1.0.0 - Initial Windows Release

### What's New
- Initial stable release of JCAS-NARCOS web application
- Optimized React build for production deployment
- Full Windows compatibility for development and deployment

### Features
- Modern React 19.1.1 based web application
- Responsive design compatible with all modern browsers
- Optimized production build with code splitting
- Progressive Web App (PWA) capabilities

### Windows Deployment
This release has been tested and optimized for Windows environments:
- Compatible with Windows 10 and Windows 11
- Works with all major Windows browsers (Chrome, Edge, Firefox)
- Can be served using Node.js on Windows Server
- IIS deployment ready

### System Requirements
- Node.js 14.0.0 or higher
- npm 6.0.0 or higher
- Modern web browser with JavaScript enabled

### Installation on Windows
1. Download and install Node.js from https://nodejs.org/
2. Clone or download this repository
3. Open Command Prompt or PowerShell as Administrator
4. Navigate to the project directory
5. Run `npm install` to install dependencies
6. Run `npm run build` to create production build
7. Serve the build folder using a web server

### Deployment Options
- **Development**: `npm start` (runs on http://localhost:3000)
- **Production**: Serve the `build` folder with any static file server
- **Windows Server**: Use IIS or serve with Node.js
- **Local Testing**: `npx serve -s build`

### Technical Details
- Built with Create React App 5.0.1
- React 19.1.1 with latest features
- ES6+ JavaScript with Babel transpilation
- CSS3 with modern browser support
- Webpack bundling with optimization