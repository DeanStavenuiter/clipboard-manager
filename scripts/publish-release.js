const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function publishRelease() {
  const releaseDir = path.join(__dirname, '..', 'release');
  
  if (!fs.existsSync(releaseDir)) {
    console.error('❌ Release directory not found. Build first with: npm run dist:notarize');
    process.exit(1);
  }

  // Find DMG files
  const files = fs.readdirSync(releaseDir);
  const dmgFiles = files.filter(f => f.endsWith('.dmg') && !f.endsWith('.blockmap'));
  const blockMapFiles = files.filter(f => f.endsWith('.dmg.blockmap'));
  const ymlFiles = files.filter(f => f.endsWith('.yml'));

  if (dmgFiles.length === 0) {
    console.error('❌ No DMG files found to publish');
    process.exit(1);
  }

  console.log('\n📦 Publishing notarized DMG files to GitHub...\n');
  
  // Check if gh CLI is available
  try {
    execSync('gh --version', { stdio: 'ignore' });
  } catch (error) {
    console.log('⚠️  GitHub CLI (gh) not found, falling back to electron-builder publish');
    console.log('   Install gh CLI for faster publishing: brew install gh\n');
    
    try {
      // This will use existing artifacts without rebuilding
      const { PublishManager } = require('electron-builder');
      console.log('🚀 Publishing with electron-builder...');
      
      execSync('electron-builder --publish always', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
        env: { ...process.env }
      });
      
      console.log('\n✅ Successfully published to GitHub releases!');
      return;
      
    } catch (publishError) {
      console.error('❌ Failed to publish:', publishError.message);
      process.exit(1);
    }
  }
  
  // Use gh CLI to upload files
  const packageJson = require('../package.json');
  const version = packageJson.version;
  const tag = `v${version}`;
  
  console.log(`🚀 Publishing release ${tag} using GitHub CLI...`);
  
  try {
    // Check if release exists, create if not
    try {
      execSync(`gh release view ${tag}`, { stdio: 'ignore' });
      console.log(`   Release ${tag} already exists, uploading files...`);
    } catch {
      console.log(`   Creating release ${tag}...`);
      execSync(`gh release create ${tag} --title "${packageJson.productName || packageJson.name} ${version}" --notes "Release ${version}"`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });
    }
    
    // Upload DMGs and related files
    const filesToUpload = [...dmgFiles, ...blockMapFiles, ...ymlFiles];
    
    for (const file of filesToUpload) {
      const filePath = path.join(releaseDir, file);
      console.log(`   Uploading ${file}...`);
      execSync(`gh release upload ${tag} "${filePath}" --clobber`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });
    }
    
    console.log('\n✅ Successfully published to GitHub releases!');
    
  } catch (error) {
    console.error('❌ Failed to publish:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  publishRelease().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = publishRelease;

