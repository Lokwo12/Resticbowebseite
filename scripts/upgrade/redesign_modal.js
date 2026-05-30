const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'DonationModal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace the strict 9:16 layout container
const oldContainer = `{/* Dialog panel — Strict 9:16 portrait ratio (450x800) */}
      <div
        className="elegant-modal relative rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
        style={{
          width: 'min(95vw, calc(95vh * 9 / 16), 520px)',
          aspectRatio: '9 / 16',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontWeight: 400,
          fontSize: '10px',
        }}
      >`;

const newContainer = `{/* Premium Desktop Split-Screen Modal */}
      <div className="elegant-modal relative rounded-3xl shadow-premium-soft flex flex-col md:flex-row overflow-hidden border border-slate-100 bg-white w-full max-w-4xl max-h-[90vh]">
        
        {/* Left Side: Impact Image (Hidden on mobile) */}
        <div className="hidden md:flex md:w-5/12 relative bg-slate-900 overflow-hidden flex-col justify-between p-8">
          <div className="absolute inset-0 opacity-40 mix-blend-overlay">
            <img src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1000&auto=format&fit=crop" alt="Children smiling" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A192F] via-[#0A192F]/60 to-transparent"></div>
          
          <div className="relative z-10">
            <img src={logoUrl} alt="Logo" className="h-12 w-12 rounded-full shadow-lg border-2 border-emerald-500/30" onError={(e) => { e.currentTarget.src = '/logo.png'; }} />
          </div>
          
          <div className="relative z-10 space-y-4">
            <h2 className="font-heading text-3xl font-bold text-white leading-tight">Your generosity transforms lives.</h2>
            <p className="text-emerald-100/80 text-sm font-medium leading-relaxed">Join us in bringing education, healthcare, and hope to the Kiryandongo community.</p>
            
            <div className="pt-6 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-[#0A192F]"></div>
                  <div className="w-8 h-8 rounded-full bg-emerald-200 border-2 border-[#0A192F]"></div>
                  <div className="w-8 h-8 rounded-full bg-sky-200 border-2 border-[#0A192F]"></div>
                </div>
                <p className="text-xs text-white/60">Join 1,000+ donors</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form Content */}
        <div className="w-full md:w-7/12 flex flex-col relative bg-white">`;

content = content.replace(oldContainer, newContainer);

// 2. Adjust Header inside Right Side
content = content.replace(
  /className="shrink-0 px-6 pt-10 pb-8 flex flex-col items-center relative overflow-hidden bg-white border-b border-gray-100"/,
  'className="shrink-0 px-6 pt-8 pb-6 flex flex-col items-center relative overflow-hidden bg-white border-b border-slate-100"'
);

// 3. Remove the duplicated Logo in the right side header (since it's on the left now for desktop)
content = content.replace(
  /<img\s+src=\{logoUrl\}[\s\S]*?onError=\{[\s\S]*?\}\s*\/>/m,
  `<img src={logoUrl} alt="Company Logo" className="md:hidden h-14 w-14 rounded-full object-cover shadow-sm border border-emerald-500/20 relative z-10" onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }} />`
);

// 4. Update Header text to use Outfit and Premium colors
content = content.replace(
  /<h2 className="text-base font-bold text-gray-900 tracking-tight">Support Our Mission<\/h2>/,
  '<h2 className="font-heading text-xl font-bold text-[#0A192F] tracking-tight">Support Our Mission</h2>'
);

// 5. Enhance Preset Amounts buttons
content = content.replace(
  /className={`relative rounded-xl border font-bold transition-all duration-300 flex items-center justify-center \$\{amount === a \? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:bg-emerald-50\/50'\}`}/g,
  "className={`relative rounded-xl border font-bold transition-all duration-300 flex items-center justify-center ${amount === a ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md transform -translate-y-0.5' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50 hover:-translate-y-0.5'}`}"
);

// 6. Fix "Next Step" Button
content = content.replace(
  /className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-4 rounded-xl text-sm transition-all duration-300 shadow-md flex items-center justify-center gap-2 hover:shadow-xl hover:scale-\[1.02\] active:scale-\[0.98\]"/g,
  'className="w-full bg-[#0A192F] hover:bg-emerald-600 text-white font-semibold py-4 rounded-xl text-sm transition-all duration-300 shadow-md flex items-center justify-center gap-2 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"'
);

// 7. Fix Back arrow inside Step 2
content = content.replace(
  /className="absolute left-4 top-5 z-10 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 p-2 rounded-full transition-all duration-300"/,
  'className="absolute left-4 top-5 z-10 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 p-2 rounded-full transition-all duration-300"'
);

// 8. Fix Close arrow at bottom of modal
const closeTags = `</div>\n      </div>\n    </div>\n  );\n}`;
const newCloseTags = `</div>\n      </div>\n      </div>\n    </div>\n  );\n}`; // Extra closing div for the split screen wrapper
if(content.includes(oldContainer)){
  content = content.replace(closeTags, newCloseTags);
}


fs.writeFileSync(filePath, content);
console.log('Redesign modal script applied successfully.');
