# Windows Deployment Guide for JCAS-NARCOS v1.0.0

This guide provides step-by-step instructions for deploying JCAS-NARCOS on Windows systems.

## Prerequisites

### Required Software
- **Node.js** (version 14 or higher) - [Download from nodejs.org](https://nodejs.org/)
- **Git** (optional) - [Download from git-scm.com](https://git-scm.com/)

### Recommended
- **Visual Studio Code** - [Download from code.visualstudio.com](https://code.visualstudio.com/)
- **Windows Terminal** - Available from Microsoft Store

## Quick Start (Windows 10/11)

### Option 1: Using Command Prompt
```cmd
# 1. Create project directory
mkdir C:\Projects\JCAS-NARCOS
cd C:\Projects\JCAS-NARCOS

# 2. Clone repository (if using Git)
git clone https://github.com/morgang213/JCAS-NARCOS.git .

# 3. Install dependencies
npm install

# 4. Build for production
npm run build

# 5. Run development server (optional)
npm start
```

### Option 2: Using PowerShell
```powershell
# 1. Create project directory
New-Item -Path "C:\Projects\JCAS-NARCOS" -ItemType Directory
Set-Location "C:\Projects\JCAS-NARCOS"

# 2. Clone repository (if using Git)
git clone https://github.com/morgang213/JCAS-NARCOS.git .

# 3. Install dependencies
npm install

# 4. Build for production
npm run build

# 5. Serve production build
npx serve -s build
```

## Production Deployment

### Option 1: Windows Server with IIS

1. **Install IIS URL Rewrite Module**
   - Download from Microsoft: https://www.iis.net/downloads/microsoft/url-rewrite

2. **Build the application**
   ```cmd
   npm run build
   ```

3. **Copy build files to IIS**
   - Copy contents of `build` folder to `C:\inetpub\wwwroot\jcas-narcos`

4. **Configure IIS site**
   - Create new site pointing to the folder
   - Set default document to `index.html`

5. **Add web.config for React routing**
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <configuration>
     <system.webServer>
       <rewrite>
         <rules>
           <rule name="React Routes" stopProcessing="true">
             <match url=".*" />
             <conditions logicalGrouping="MatchAll">
               <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
               <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
             </conditions>
             <action type="Rewrite" url="/" />
           </rule>
         </rules>
       </rewrite>
     </system.webServer>
   </configuration>
   ```

### Option 2: Node.js Express Server

1. **Install serve globally**
   ```cmd
   npm install -g serve
   ```

2. **Build the application**
   ```cmd
   npm run build
   ```

3. **Serve the application**
   ```cmd
   serve -s build -l 3000
   ```

4. **Run as Windows Service** (optional)
   - Install pm2: `npm install -g pm2`
   - Create ecosystem file and use pm2 to manage the service

### Option 3: Apache on Windows

1. **Install Apache HTTP Server**
   - Download from https://httpd.apache.org/

2. **Build the application**
   ```cmd
   npm run build
   ```

3. **Copy files to Apache document root**
   - Copy `build` folder contents to Apache's `htdocs` directory

4. **Configure .htaccess for React routing**
   ```apache
   Options -MultiViews
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteRule ^ index.html [QSA,L]
   ```

## Development Environment Setup

### Using Visual Studio Code

1. **Install recommended extensions:**
   - ES7+ React/Redux/React-Native snippets
   - Prettier - Code formatter
   - ESLint
   - Auto Rename Tag

2. **Configure workspace settings** (create `.vscode/settings.json`):
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "emmet.includeLanguages": {
       "javascript": "javascriptreact"
     }
   }
   ```

## Troubleshooting

### Common Issues

1. **Node.js version incompatibility**
   - Solution: Use Node.js version 14 or higher

2. **npm install fails**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and package-lock.json, then reinstall

3. **Build fails**
   - Check for syntax errors in source files
   - Ensure all dependencies are installed

4. **Port 3000 already in use**
   - Use different port: `set PORT=3001 && npm start`

5. **Windows Defender blocks execution**
   - Add project folder to Windows Defender exclusions

### Performance Optimization

1. **Enable gzip compression** (IIS/Apache)
2. **Set up CDN** for static assets
3. **Configure browser caching** headers
4. **Use HTTP/2** if available

## Security Considerations

1. **Keep Node.js updated**
2. **Regular dependency updates**: `npm audit fix`
3. **Use HTTPS** in production
4. **Configure proper CORS** headers
5. **Implement Content Security Policy**

## Support

For additional support or issues specific to Windows deployment:
1. Check the project's GitHub issues
2. Review React deployment documentation
3. Consult Windows Server documentation for IIS configuration