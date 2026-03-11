export default {
  editor: {
    label: { en: 'Admin KPI Dashboard' },
    icon: 'activity',
    categories: ['data'],
    deprecated: false,
  },
  properties: {
    supabaseUrl: {
      label: { en: 'Supabase URL' },
      type: 'Text',
      bindable: true,
      hidden: true,
      defaultValue: '',
    },
    supabaseAnonKey: {
      label: { en: 'Supabase Anon Key' },
      type: 'Text',
      bindable: true,
      hidden: true,
      defaultValue: '',
    },
    accessToken: {
      label: { en: 'Auth Token' },
      type: 'Text',
      bindable: true,
      hidden: true,
      defaultValue: '',
    },
    userId: {
      label: { en: 'User ID' },
      type: 'Text',
      bindable: true,
      hidden: true,
      defaultValue: '',
    },
    refreshInterval: {
      label: { en: 'Auto-refresh Interval (s)' },
      type: 'Number',
      bindable: true,
      defaultValue: 60,
      options: { min: 15, max: 600 },
    },
    enableRealtime: {
      label: { en: 'Enable Realtime Alerts' },
      type: 'OnOff',
      bindable: true,
      defaultValue: true,
    },
    showAlertsFeed: {
      label: { en: 'Show Live Alerts Feed' },
      type: 'OnOff',
      bindable: true,
      defaultValue: true,
    },
    refreshTrigger: {
      label: { en: 'Refresh Trigger' },
      type: 'Text',
      bindable: true,
      hidden: true,
      defaultValue: '',
    },
  },
  triggerEvents: [
    {
      name: 'kpidashboard:loaded',
      label: { en: 'On Data Loaded' },
      event: { sections: '' },
    },
    {
      name: 'kpidashboard:alertReceived',
      label: { en: 'On New Alert (Realtime)' },
      event: { alertId: '', headline: '', severity: '' },
    },
    {
      name: 'kpidashboard:error',
      label: { en: 'On Error' },
      event: { message: '' },
    },
  ],
};
