const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');
const filesToUpgrade = [
  'Hero.tsx', 'About.tsx', 'Programs.tsx', 'ImpactStories.tsx', 'Gallery.tsx'
];

filesToUpgrade.forEach(file => {
  const filePath = path.join(componentsDir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Upgrade padding
  content = content.replace(/py-16|py-20|py-24/g, 'section-spacing-lg');
  
  // Upgrade shadows
  content = content.replace(/shadow-lg|shadow-xl/g, 'shadow-premium-soft hover:shadow-2xl transition-all duration-300');
  content = content.replace(/shadow-md/g, 'shadow-premium-soft transition-all duration-300');
  
  // Upgrade headings to use Outfit
  content = content.replace(/font-bold/g, 'font-bold font-heading tracking-tight');
  content = content.replace(/font-extrabold/g, 'font-extrabold font-heading tracking-tight');
  
  // Upgrade Backgrounds slightly for more premium feel
  if(file === 'About.tsx') {
    content = content.replace(/bg-white/g, 'bg-slate-50/50');
  }
  if(file === 'Programs.tsx') {
    content = content.replace(/bg-gray-50/g, 'bg-white');
    content = content.replace(/bg-white rounded-2xl/g, 'bg-slate-50 border border-slate-100 rounded-3xl');
  }

  fs.writeFileSync(filePath, content);
  console.log(`Upgraded ${file}`);
});
