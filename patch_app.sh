sed -i "/{activeTab === 'dashboard' && (/i\                  {activeTab === 'run-recorder' && (\n                    <RunRecorder language={language || 'fr'} />\n                  )}\n" src/App.tsx
