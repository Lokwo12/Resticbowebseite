const fs = require('fs');
let code = fs.readFileSync('src/components/SiteSettingsTab.tsx', 'utf8');

// The file has a duplicate donation block, misplaced sections, etc.
// The easiest way is to truncate everything from the start of the duplicate block
// and rebuild it.

// Let's find the true start of the Resources section block that we want to keep.
const resourcesStartIdx = code.indexOf('              {/* Resources Section */}');
const impactDashboardEndIdx = code.indexOf('              </div>\n            </div>\n          </Card>\n        </TabsContent>', resourcesStartIdx);

// Extract the 3 new sections (Resources, Opportunities, Impact Dashboard)
const newSectionsCode = code.substring(resourcesStartIdx, impactDashboardEndIdx);

// Find the place where the sections tab was supposed to end, which is before the FIRST duplicate donation block.
const firstDonationBlockIdx = code.indexOf('        {/* ===== DONATION & PAYMENTS ===== */}');
// Backtrack to the closing tags of the 'sections' tab right before it
const sectionsCloseIdx = code.lastIndexOf('          </Card>\n        </TabsContent>', firstDonationBlockIdx);

// Now find the proper Donation block and Quiz block.
// The quiz block starts with '{/* Quiz Settings */}'
const quizBlockIdx = code.indexOf('        {/* Quiz Settings */}');

// The REAL donation block is the second one, or we can just grab it from quizBlockIdx backwards.
// Actually, let's just grab everything from the second DONATION & PAYMENTS to the end of the file.
const secondDonationBlockIdx = code.indexOf('        {/* ===== DONATION & PAYMENTS ===== */}', firstDonationBlockIdx + 1);

let endOfFileCode = code.substring(secondDonationBlockIdx);

// Reconstruct the file:
// 1. Everything from start up to the original sections closing (BUT NOT including the closing tags yet)
// We need to inject the newSectionsCode before the original closing tags.
let part1 = code.substring(0, sectionsCloseIdx);

// Make sure part1 doesn't have the closing tags
let newCode = part1 + newSectionsCode + '              </div>\n            </div>\n          </Card>\n        </TabsContent>\n\n' + endOfFileCode;

fs.writeFileSync('src/components/SiteSettingsTab.tsx', newCode);
console.log("Fixed!");
