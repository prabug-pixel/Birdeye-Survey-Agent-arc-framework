const toId = (label) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const agentChildren = (items) => items.map((label) => ({
  id: toId(label),
  label,
}));

const standardSections = (agentLabels) => [
  {
    id: 'actions',
    label: 'Actions',
    defaultExpanded: true,
    children: [
      { id: 'view-all-agents', label: 'View all agents' },
      { id: 'create-agent', label: 'Create agent' },
    ],
  },
  {
    id: 'agents',
    label: 'Agents',
    defaultExpanded: true,
    children: agentChildren(agentLabels),
  },
  {
    id: 'monitor',
    label: 'Monitor',
    children: [
      { id: 'active', label: 'Active' },
      { id: 'paused', label: 'Paused' },
      { id: 'failed', label: 'Failed' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    children: [
      { id: 'performance', label: 'Performance' },
      { id: 'accuracy', label: 'Accuracy' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    children: [
      { id: 'thresholds', label: 'Thresholds' },
      { id: 'notifications', label: 'Notifications' },
    ],
  },
];

const expandedSections = (sections) => sections.map(({ label, children = [] }) => ({
  id: toId(label),
  label,
  defaultExpanded: label === 'Agents',
  children: children.map((child) => ({
    id: toId(child),
    label: child,
  })),
}));

const firstAgentItemId = (menuItems = []) => (
  menuItems.find((item) => item.label === 'Agents')?.children?.[0]?.id
);

export const MODULE_NAV = {
  overview: {
    title: 'Overview',
    ctaLabel: 'Create agent',
    defaultItemId: 'view-all-agents',
    menuItems: standardSections(['Business summary agents', 'Risk detection agents']),
  },
  inbox: {
    title: 'Inbox AI',
    ctaLabel: 'Create agent',
    defaultItemId: 'view-all-agents',
    menuItems: standardSections(['Conversation intent routing agents', 'Inbox reply assistant agents']),
  },
  search: {
    title: 'Search AI',
    ctaLabel: 'Create agent',
    defaultItemId: 'faq-generation-agents',
    menuItems: expandedSections([
      { label: 'Overview', children: [] },
      { label: 'Actions', children: ['Recommendations', 'Track progress'] },
      { label: 'Agents', children: ['FAQ generation agents'] },
      { label: 'Settings', children: ['Prompts'] },
    ]),
  },
  listings: {
    title: 'Listings AI',
    ctaLabel: 'Create agent',
    defaultItemId: 'lisiting-scan-agents',
    menuItems: expandedSections([
      {
        label: 'Actions',
        children: ['Recommendations', 'Suppress duplicates', 'Google suggestions'],
      },
      {
        label: 'Ranking reports',
        children: ['Keywords', 'Citations', 'Rankings'],
      },
      {
        label: 'Search performance',
        children: ['All sites', 'Google', 'Apple', 'Facebook', 'Bing', 'Yelp'],
      },
      {
        label: 'Accuracy',
        children: ['Core sites', 'Other sites'],
      },
      {
        label: 'Publish status',
        children: ['All listings', 'By location', 'By site'],
      },
      {
        label: 'Agents',
        children: ['Lisiting scan agents', 'Lisiting optimization agents', 'Lisiting sync agents'],
      },
      {
        label: 'Settings',
        children: ['Profiles', 'Keywords', 'Ranking report', 'FAQs', 'Products', 'Google services'],
      },
    ]),
  },
  reviews: {
    title: 'Reviews AI',
    ctaLabel: 'Send a review request',
    defaultItemId: 'view-all-reviews',
    menuItems: expandedSections([
      {
        label: 'Actions',
        children: [
          'View all reviews',
          'Respond to reviews',
          'Approve replies',
          'Fix rejected replies',
          'View scheduled replies',
          'Fix failed replies',
        ],
      },
      {
        label: 'Reports',
        children: [
          'Overview',
          'Volume and ratings',
          'Leaderboard',
          'Distribution',
          'Responses',
          'NPS',
          'Tags',
          'QR Codes',
          'Review impressions',
        ],
      },
      {
        label: 'Competitors',
        children: ['Benchmarking', 'Head to head', 'Reviews'],
      },
      {
        label: 'Agents',
        children: ['Review generation agents', 'Review response agents'],
      },
      {
        label: 'Settings',
        children: [
          'Review sites',
          'Request templates',
          'Reply templates',
          'Approvals',
          'QR codes',
          'Widgets',
          'Rating display',
          'Auto share rules',
          'Auto reply rules',
          'AI prompts',
        ],
      },
    ]),
  },
  referrals: {
    title: 'Referrals AI',
    ctaLabel: 'Create agent',
    defaultItemId: 'view-all-agents',
    menuItems: standardSections(['Referral request agents', 'Referral follow-up agents']),
  },
  payments: {
    title: 'Payments AI',
    ctaLabel: 'Create agent',
    defaultItemId: 'view-all-agents',
    menuItems: standardSections(['Payment reminder agents', 'Failed payment recovery agents']),
  },
  appointments: {
    title: 'Appointments AI',
    ctaLabel: 'Create agent',
    defaultItemId: 'view-all-agents',
    menuItems: standardSections(['Appointment reminder agents', 'No-show recovery agents']),
  },
  social: {
    title: 'Social AI',
    ctaLabel: 'Create post',
    defaultItemId: 'social-publishing-agents',
    menuItems: expandedSections([
      {
        label: 'Publish',
        children: [
          'View calendar',
          'View drafts',
          'Approve posts',
          'Fix failed posts',
          'Fix rejected posts',
        ],
      },
      {
        label: 'Engage',
        children: [
          'View all engagements',
          'Assigned to me',
          'Approve replies',
          'Fix rejected replies',
          'View spam',
        ],
      },
      {
        label: 'Reports',
        children: ['All channels', 'Post performance', 'Response trends', 'Best time to post'],
      },
      {
        label: 'Competitors',
        children: ['Benchmarking', 'Posts'],
      },
      {
        label: 'Libraries',
        children: ['Post library', 'Media library', 'Reply templates'],
      },
      {
        label: 'Agents',
        children: [
          'Social publishing agents',
          'Social engagement agents',
          'Social boosting agents',
          'Social benchmarking agents',
        ],
      },
      {
        label: 'Settings',
        children: ['Approvals', 'Link in bio', 'Tags', 'AI posts', 'AI prompts'],
      },
    ]),
  },
  surveys: {
    title: 'Surveys AI',
    ctaLabel: 'Create survey',
    defaultItemId: 'survey-response-agents',
    menuItems: expandedSections([
      {
        label: 'Actions',
        children: ['View surveys'],
      },
      {
        label: 'Reports',
        children: ['Survey NPS', 'Responses'],
      },
      {
        label: 'Agents',
        children: ['Survey follow-up agents', 'Survey response agents', 'Survey insights agents'],
      },
    ]),
  },
  ticketing: {
    title: 'Ticketing AI',
    ctaLabel: 'Create ticket',
    defaultItemId: 'ticketing-agents',
    menuItems: expandedSections([
      {
        label: 'Actions',
        children: ['My tickets', 'View all tickets'],
      },
      {
        label: 'Reports',
        children: ['Resolution time', 'Volume'],
      },
      {
        label: 'Agents',
        children: ['Ticketing agents'],
      },
    ]),
  },
  contacts: {
    title: 'Contacts AI',
    ctaLabel: 'Create agent',
    defaultItemId: 'view-all-agents',
    menuItems: standardSections(['Contact enrichment agents', 'Duplicate merge agents']),
  },
  campaigns: {
    title: 'Campaigns AI',
    ctaLabel: 'Create agent',
    defaultItemId: 'view-all-agents',
    menuItems: standardSections(['Campaign QA agents', 'Campaign optimizer agents']),
  },
  reports: {
    title: 'Reports',
    ctaLabel: 'Create report agent',
    defaultItemId: 'view-all-agents',
    menuItems: standardSections(['Report digest agents', 'Anomaly insight agents']),
  },
  insights: {
    title: 'Insights AI',
    ctaLabel: 'Create insight agent',
    defaultItemId: 'insight-summary-agents',
    menuItems: expandedSections([
      {
        label: 'Actions',
        children: ['Recommendations', 'Track progress'],
      },
      {
        label: 'Analysis',
        children: ['All signals', 'Reviews', 'Listings', 'Calls'],
      },
      {
        label: 'Agents',
        children: ['Insight summary agents', 'Trend detection agents'],
      },
      {
        label: 'Settings',
        children: ['Categories & keywords', 'Birdeye score'],
      },
    ]),
  },
  competitors: {
    title: 'Competitors AI',
    ctaLabel: 'Create agent',
    defaultItemId: 'view-all-agents',
    menuItems: standardSections(['Competitor monitoring agents', 'Benchmark summary agents']),
  },
  settings: {
    title: 'Settings',
    ctaLabel: 'Create agent',
    defaultItemId: 'view-all-agents',
    menuItems: [
      {
        id: 'workspace',
        label: 'Workspace',
        defaultExpanded: true,
        children: [
          { id: 'view-all-agents', label: 'View all agents' },
          { id: 'templates', label: 'Templates' },
          { id: 'permissions', label: 'Permissions' },
        ],
      },
    ],
  },
};

export function getModuleNav(moduleId) {
  const moduleNav = MODULE_NAV[moduleId] || MODULE_NAV.overview;
  return {
    ...moduleNav,
    defaultItemId: firstAgentItemId(moduleNav.menuItems) || moduleNav.defaultItemId,
  };
}
