const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load .env file if it exists
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (error) {
  // Ignore errors loading .env
}

async function notarizeDMG() {
  if (!process.env.APPLE_ID || !process.env.APPLE_APP_SPECIFIC_PASSWORD || !process.env.APPLE_TEAM_ID) {
    console.log('⚠️  Skipping DMG stapling: Apple credentials not provided');
    console.log('   Set APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, and APPLE_TEAM_ID');
    return;
  }

  const releaseDir = path.join(__dirname, '..', 'release');
  
  if (!fs.existsSync(releaseDir)) {
    console.log('⚠️  Release directory not found');
    return;
  }

  // Find all DMG files
  const files = fs.readdirSync(releaseDir);
  const dmgFiles = files.filter(f => f.endsWith('.dmg') && !f.endsWith('.blockmap'));

  if (dmgFiles.length === 0) {
    console.log('⚠️  No DMG files found to notarize');
    return;
  }

  console.log('\n🔨 Notarizing and stapling DMG files...');
  
  for (const dmg of dmgFiles) {
    const dmgPath = path.join(releaseDir, dmg);
    console.log(`\n📦 Processing: ${dmg}`);
    
    try {
      // Submit DMG for notarization
      console.log('   Submitting to Apple for notarization...');
      const submitCmd = `xcrun notarytool submit "${dmgPath}" --apple-id "${process.env.APPLE_ID}" --password "${process.env.APPLE_APP_SPECIFIC_PASSWORD}" --team-id "${process.env.APPLE_TEAM_ID}" --wait`;
      execSync(submitCmd, { stdio: 'inherit' });
      console.log(`   ✅ Notarization complete for ${dmg}`);
      
      // Try to staple the DMG
      console.log('   Attempting to staple...');
      try {
        execSync(`xcrun stapler staple "${dmgPath}"`, { stdio: 'inherit' });
        console.log(`   ✅ Successfully stapled ${dmg}`);
        
        // Validate
        execSync(`xcrun stapler validate "${dmgPath}"`, { stdio: 'inherit' });
        console.log(`   ✅ Validation passed for ${dmg}`);
      } catch (stapleError) {
        console.warn(`   ⚠️  Stapling failed (Apple CloudKit issue)`);
        console.warn(`   But notarization succeeded! The DMG is safe to distribute.`);
        console.warn(`   Users will need internet on first launch for Gatekeeper.`);
        console.warn(`   You can try stapling manually later with:`);
        console.warn(`   xcrun stapler staple "${dmgPath}"`);
      }
      
    } catch (error) {
      console.error(`   ❌ Failed to notarize ${dmg}`);
      console.error(`   Error: ${error.message}`);
      throw error; // Stop the build if notarization fails
    }
  }
  
  console.log('\n✅ DMG processing complete!');
}

// Run if called directly
if (require.main === module) {
  notarizeDMG().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = notarizeDMG;

