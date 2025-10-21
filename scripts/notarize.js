const { notarize } = require('@electron/notarize');
const path = require('path');
const fs = require('fs');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;  
  
  if (electronPlatformName !== 'darwin') {
    console.log('Skipping notarization: Not macOS');
    return;
  }

  if (!process.env.APPLE_ID || !process.env.APPLE_APP_SPECIFIC_PASSWORD || !process.env.APPLE_TEAM_ID) {
    console.log('⚠️  Skipping notarization: Apple credentials not provided');
    console.log('Set APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, and APPLE_TEAM_ID in .env file');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);
  
  console.log('📝 Starting notarization process...');
  console.log(`   App path: ${appPath}`);
  console.log(`   Bundle ID: com.deanstavenuiter.trex`);
  console.log(`   Team ID: ${process.env.APPLE_TEAM_ID}`);
  
  // Check if app exists
  if (!fs.existsSync(appPath)) {
    console.error(`❌ App not found at: ${appPath}`);
    return;
  }
  
  try {
    // Submit for notarization - let @electron/notarize handle stapling
    await notarize({
      tool: 'notarytool',
      appPath: appPath,
      appBundleId: 'com.deanstavenuiter.trex',
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    });
    
    console.log('✅ Notarization and stapling completed successfully!');
    
  } catch (error) {
    console.error('❌ Notarization/stapling failed:', error.message);
    
    // If it's just a stapling error, the app is still notarized
    if (error.message && (error.message.includes('staple') || error.message.includes('code: 65'))) {
      console.warn('⚠️  Stapling failed, but the app is notarized on Apple servers');
      console.warn('The DMG will be stapled after it is created');
      // Don't throw - notarization succeeded, we'll staple the DMG later
      return;
    }
    
    // For other errors, throw to stop the build
    throw error;
  }
};