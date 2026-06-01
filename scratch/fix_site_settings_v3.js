const fs = require('fs');

// Read the clean file
let code = fs.readFileSync('src/components/SiteSettingsTab.tsx', 'utf8');

// The exact string where the sections tab ends
const endOfSectionsBlock = `
              </div>
            </div>
          </Card>
        </TabsContent>`;

const newSections = `
              {/* Resources Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Resources Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.resources?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            resources: { ...settings.sections?.resources, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.resources?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            resources: { ...settings.sections?.resources, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Opportunities Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Opportunities Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.opportunities?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            opportunities: { ...settings.sections?.opportunities, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.opportunities?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            opportunities: { ...settings.sections?.opportunities, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Impact Dashboard Section */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm text-gray-900 mb-3">Impact Dashboard Section</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={settings.sections?.impact?.title || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            impact: { ...settings.sections?.impact, title: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={settings.sections?.impact?.description || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          sections: {
                            ...settings.sections,
                            impact: { ...settings.sections?.impact, description: e.target.value },
                          },
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>`;

const quizBlock = `
        {/* Quiz Settings */}
        <TabsContent value="quiz">
          <Card className="p-6">
            <h3 className="text-lg text-gray-900 mb-4">Volunteer Match Quiz</h3>
            <p className="text-sm text-gray-500 mb-6">Customize the texts for the Volunteer Matching Quiz.</p>
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Quiz Modal Title</label>
                <input
                  type="text"
                  value={settings.quiz?.title || 'Find Your Perfect Volunteer Role'}
                  onChange={(e) => setSettings({ ...settings, quiz: { ...settings.quiz, title: e.target.value } })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Quiz Modal Subtitle</label>
                <textarea
                  value={settings.quiz?.subtitle || 'Take our quick 3-question quiz to see where you can make the biggest impact.'}
                  onChange={(e) => setSettings({ ...settings, quiz: { ...settings.quiz, subtitle: e.target.value } })}
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-bold text-gray-900 mb-2">Question 1: Impact Area</label>
                <input
                  type="text"
                  value={settings.quiz?.q1Text || 'What type of impact are you looking to make?'}
                  onChange={(e) => setSettings({ ...settings, quiz: { ...settings.quiz, q1Text: e.target.value } })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 mb-2"
                />
                <p className="text-xs text-gray-500">Matches against the Opportunity "Category" (e.g. Healthcare, Education)</p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-bold text-gray-900 mb-2">Question 2: Time Commitment</label>
                <input
                  type="text"
                  value={settings.quiz?.q2Text || 'How much time can you commit?'}
                  onChange={(e) => setSettings({ ...settings, quiz: { ...settings.quiz, q2Text: e.target.value } })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 mb-2"
                />
                <p className="text-xs text-gray-500">Helps filter roles by commitment level</p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-bold text-gray-900 mb-2">Question 3: Core Skills</label>
                <input
                  type="text"
                  value={settings.quiz?.q3Text || 'What are your primary skills?'}
                  onChange={(e) => setSettings({ ...settings, quiz: { ...settings.quiz, q3Text: e.target.value } })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 mb-2"
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>`;

const endOfTabs = `
        </TabsContent>
      </Tabs>`;

// Normalise line endings in code to \n for easier replacement
const ncode = code.replace(/\\r\\n/g, '\\n');

// 1. Add Sections
let step1 = ncode.replace(endOfSectionsBlock.trim(), newSections.trim());

if (step1 === ncode) {
  console.log("Failed to find end of sections block.");
} else {
  // 2. Add Quiz Tab
  let step2 = step1.replace(endOfTabs.trim(), quizBlock.trim());
  if (step2 === step1) {
    console.log("Failed to find end of tabs block.");
  } else {
    fs.writeFileSync('src/components/SiteSettingsTab.tsx', step2);
    console.log("Fixed SiteSettingsTab.tsx successfully");
  }
}
