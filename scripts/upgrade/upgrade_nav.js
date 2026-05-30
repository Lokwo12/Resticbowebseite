const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');

// 1. Upgrade Header
const headerPath = path.join(componentsDir, 'Header.tsx');
if (fs.existsSync(headerPath)) {
  let headerContent = fs.readFileSync(headerPath, 'utf8');
  
  // Make it frosted glass instead of flat white
  headerContent = headerContent.replace(
    /className={`fixed w-full z-50 transition-all duration-300 \$\{[\s\S]*?\}`}/,
    "className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-xl shadow-premium-soft py-2' : 'bg-white py-4'}`}"
  );
  
  // Update font to Outfit
  headerContent = headerContent.replace(/font-bold/g, 'font-bold font-heading tracking-tight');
  
  fs.writeFileSync(headerPath, headerContent);
  console.log('Upgraded Header.tsx');
}

// 2. Upgrade Footer
const footerPath = path.join(componentsDir, 'Footer.tsx');
if (fs.existsSync(footerPath)) {
  let footerContent = fs.readFileSync(footerPath, 'utf8');
  
  // Change background to Navy and text to light
  footerContent = footerContent.replace(
    /<footer className="bg-white border-t border-gray-100 pt-20 pb-10">/,
    '<footer className="bg-[#0A192F] text-slate-300 pt-24 pb-12">'
  );
  
  // Change text colors inside footer
  footerContent = footerContent.replace(/text-gray-900/g, 'text-white font-heading');
  footerContent = footerContent.replace(/text-gray-600/g, 'text-slate-400');
  footerContent = footerContent.replace(/text-gray-500/g, 'text-slate-500');
  footerContent = footerContent.replace(/hover:text-emerald-600/g, 'hover:text-emerald-400 transition-colors');
  footerContent = footerContent.replace(/bg-emerald-50/g, 'bg-emerald-900/30');
  footerContent = footerContent.replace(/text-emerald-600/g, 'text-emerald-400');
  
  // Enhance headings
  footerContent = footerContent.replace(/font-semibold/g, 'font-semibold font-heading tracking-wide');
  
  fs.writeFileSync(footerPath, footerContent);
  console.log('Upgraded Footer.tsx');
}
