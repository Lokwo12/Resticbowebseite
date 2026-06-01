const fs = require('fs');
let code = fs.readFileSync('src/components/AdminFormDialogs.tsx', 'utf8');

const replacement = `  );
}

// Impact Stats Form Dialog
export function ImpactStatsFormDialog({ show, onClose, currentStats, onSuccess, userRole, accessToken }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    peopleServed: 5000,
    programsActive: 12,
    volunteersActive: 150,
    fundsRaised: 250000,
    communitiesReached: 8,
    successRate: 92,
    fundraisingGoal: 50000,
    fundraisingCampaign: 'Campaign 2026',
    fundraisingTitle: 'Help Us Reach Our Goal',
    fundraisingDescription: 'We are raising funds to expand our mobile health clinics...'
  });

  useEffect(() => {
    setFormData({
      peopleServed: currentStats?.peopleServed ?? 5000,
      programsActive: currentStats?.programsActive ?? 12,
      volunteersActive: currentStats?.volunteersActive ?? 150,
      fundsRaised: currentStats?.fundsRaised ?? 250000,
      communitiesReached: currentStats?.communitiesReached ?? 8,
      successRate: currentStats?.successRate ?? 92,
      fundraisingGoal: currentStats?.fundraisingGoal ?? 50000,
      fundraisingCampaign: currentStats?.fundraisingCampaign ?? 'Campaign 2026',
      fundraisingTitle: currentStats?.fundraisingTitle ?? 'Help Us Reach Our Goal',
      fundraisingDescription: currentStats?.fundraisingDescription ?? 'We are raising funds to expand our mobile health clinics...'
    });
  }, [currentStats, show]);

  const handleNumber = (field: string, value: string) => {
    const num = parseInt(value);
    setFormData(prev => ({ ...prev, [field]: isNaN(num) ? 0 : num }));
  };

  const handleSubmit = async (e: React.FormEvent) => {`;

// Replace `  );\r?\n  };\r?\n\r?\n  const handleSubmit = async \(e: React.FormEvent\) => \{`
const regex = /  \);\r?\n  };\r?\n\r?\n  const handleSubmit = async \(e: React\.FormEvent\) => \{/m;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/components/AdminFormDialogs.tsx', code);
  console.log("Fixed AdminFormDialogs.tsx");
} else {
  console.log("Could not find target string with regex.");
}
