const fs = require('fs');

let c = fs.readFileSync('src/components/EnhancedAdminDashboard.tsx', 'utf8');

// The code broke because `/\n/g` became `/
// /g`
// We need to find literal newlines that are directly followed by `/g` and preceded by `/`
// Wait, replacing ALL literal newlines with `\n` is wrong because actual code needs newlines!
// It's specifically `newsletterBody.replace(/` followed by newline followed by `/g`
c = c.replace(/newsletterBody\.replace\(\/\n\/g, '<br>'\)/g, "newsletterBody.replace(/\\n/g, '<br>')");

fs.writeFileSync('src/components/EnhancedAdminDashboard.tsx', c);
