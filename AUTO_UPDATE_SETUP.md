# Auto-Update Setup Guide

## 🔄 What is Auto-Update?

Auto-update allows your Trex app to automatically check for, download, and install new versions without user intervention. Users get seamless updates in the background.

## 📋 Setup Requirements

### 1. GitHub Repository
- Create a GitHub repository for your app (e.g., `trex-clipboard-manager`)
- Make sure it's public or you have a GitHub token for private repos

### 2. GitHub Token (for Publishing)
Create a GitHub Personal Access Token with `repo` permissions:
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Create a token with `repo` scope
3. Save it securely

### 3. Environment Setup
Set your GitHub token as an environment variable:
```bash
export GH_TOKEN=your_github_token_here
```

## 🚀 Publishing Releases

### For First Release
```bash
# Update version
npm version 1.0.1

# Build and publish to GitHub
npm run dist:publish
```

### For Subsequent Releases
```bash
# Update version (patch/minor/major)
npm version patch

# Build and publish
npm run dist:publish
```

## 🔧 How It Works

### Update Check Schedule
- **On App Start**: Checks for updates immediately
- **Hourly**: Checks every hour while app is running
- **Manual**: "Check for Updates" in tray menu

### Update Process
1. **Check**: App checks GitHub releases for newer version
2. **Download**: If found, downloads update in background
3. **Notify**: Shows notification "Update Available"
4. **Install**: Downloads and shows "Update Ready" notification
5. **Restart**: Auto-restarts after 5 seconds to apply update

### User Experience
- ✅ **Silent Updates**: Downloads happen in background
- ✅ **Notifications**: User gets informed about update status
- ✅ **Minimal Disruption**: Quick restart to apply updates
- ✅ **Manual Control**: Users can check for updates manually

## 🛠️ Configuration

### Update Preferences
Located in `src/main.ts`:
- `checkForUpdatesAndNotify()`: Check frequency
- `quitAndInstall()`: Auto-restart behavior
- Notification settings: Uses existing app preferences

### Publishing Settings
Located in `package.json`:
- `publish.provider`: "github"
- `publish.owner`: Your GitHub username
- `publish.repo`: Your repository name

## 🧪 Testing

### Development
- Auto-updates are disabled in development mode
- Use `npm run dist` for local testing

### Production Testing
1. Create a test release on GitHub
2. Install previous version of your app
3. Publish new version
4. Verify auto-update works

## 📦 Release Workflow

### Recommended Workflow
1. **Development**: Make changes, test locally
2. **Version Bump**: `npm version patch/minor/major`
3. **Commit**: Git commit the version change
4. **Build & Publish**: `npm run dist:publish`
5. **GitHub Release**: Creates release automatically
6. **Auto-Update**: Existing users get update automatically

### File Structure After Publishing
```
GitHub Release Assets:
├── Trex-1.0.1.dmg (Universal)
├── Trex-1.0.1-arm64.dmg (Apple Silicon)
├── latest-mac.yml (Update metadata)
└── Release notes
```

## 🔍 Monitoring

### Logs
Check console for update events:
- "Checking for update..."
- "Update available"
- "Update not available"
- "Download progress: X%"
- "Update downloaded"

### Troubleshooting
- Ensure GitHub token has correct permissions
- Check repository settings are correct
- Verify version number is higher than current
- Check network connectivity for users

## 🎯 Benefits

- **User Retention**: Users always have latest features
- **Security**: Quick deployment of security fixes
- **Reduced Support**: Fewer users on old versions
- **Analytics**: Track update adoption rates
- **Professional**: Enterprise-grade update system
