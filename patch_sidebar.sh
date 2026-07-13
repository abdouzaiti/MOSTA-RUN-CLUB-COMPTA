sed -i "/{ id: 'dashboard'/a\    { id: 'run-recorder', label: language === 'ar' ? 'لنجري' : language === 'en' ? \\\"Let's Run\\\" : 'Allons Courir', icon: Activity }," src/components/Sidebar.tsx
