import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@birdeye/elemental/core/atoms/Button/index.js';
import Avatar from '@birdeye/elemental/core/atoms/Avatar/index.js';
import TabHeader from '@birdeye/elemental/core/atoms/TabHeader/index.js';
import PrimaryRailNav from '../../Organisms/Nav/PrimaryRailNav/PrimaryRailNav';
import SecondaryRailNav from '../../Organisms/Nav/SecondaryRailNav/SecondaryRailNav';
import MetricsGroup from '../../Organisms/MetricsGroup/MetricsGroup';
import AgentsTable from '../../Organisms/DataViews/AgentsTable/AgentsTable';
import TemplateLibrary from '../../Organisms/TemplateLibrary/TemplateLibrary';
import EmptyStates from '../../Patterns/EmptyStates/EmptyStates';

const font = '"Roboto", sans-serif';

/* ─── Empty state copy per agent section ─── */

const EMPTY_STATE_COPY = {
  // Social AI
  'Social publishing agents': {
    title: 'Create your first social publishing agent',
    description: 'Automatically create and publish social posts to keep your audience engaged',
  },
  'Social engagement agents': {
    title: 'Create your first social engagement agent',
    description: 'Automatically engage and respond to your audience across social platforms',
  },
  // Reviews AI
  'Review response agents': {
    title: 'Create your first review response agent',
    description: 'Automatically respond to customer reviews and protect your reputation',
  },
  'Review generation agents': {
    title: 'Create your first review generation agent',
    description: 'Automatically request reviews from customers at the perfect moment',
  },
  'Negative review escalation agents': {
    title: 'Create your first escalation agent',
    description: 'Automatically flag and escalate negative reviews before they affect your business',
  },
  // Inbox AI
  'Conversation intent routing agents': {
    title: 'Create your first routing agent',
    description: 'Automatically route conversations to the right team based on intent',
  },
  'Inbox reply assistant agents': {
    title: 'Create your first reply assistant agent',
    description: 'Automatically suggest and send replies to inbox messages',
  },
  // Listings AI
  'Listings scan agents': {
    title: 'Create your first listings scan agent',
    description: 'Automatically scan and fix listing inaccuracies across directories',
  },
  'Holiday hours agents': {
    title: 'Create your first holiday hours agent',
    description: 'Automatically update your business hours for holidays and special events',
  },
  // Overview
  'Business summary agents': {
    title: 'Create your first business summary agent',
    description: 'Automatically generate business performance summaries',
  },
  'Risk detection agents': {
    title: 'Create your first risk detection agent',
    description: 'Automatically detect and alert on business risks before they escalate',
  },
  // Referrals AI
  'Referral request agents': {
    title: 'Create your first referral request agent',
    description: 'Automatically request referrals from satisfied customers',
  },
  'Referral follow-up agents': {
    title: 'Create your first referral follow-up agent',
    description: 'Automatically follow up on referral leads to drive conversions',
  },
  // Payments AI
  'Payment reminder agents': {
    title: 'Create your first payment reminder agent',
    description: 'Automatically send payment reminders to reduce late and missed payments',
  },
  'Failed payment recovery agents': {
    title: 'Create your first recovery agent',
    description: 'Automatically recover failed payments and reduce customer churn',
  },
  // Appointments AI
  'Appointment reminder agents': {
    title: 'Create your first reminder agent',
    description: 'Automatically remind customers of upcoming appointments to reduce no-shows',
  },
  'No-show recovery agents': {
    title: 'Create your first no-show recovery agent',
    description: 'Automatically re-engage customers who missed their appointments',
  },
  // Surveys AI
  'Survey follow-up agents': {
    title: 'Create your first survey follow-up agent',
    description: 'Automatically follow up with survey respondents based on their answers',
  },
  'Survey response agents': {
    title: 'Create your first survey response agent',
    description: 'Automatically analyze survey responses and generate personalized, on-brand replies that acknowledge feedback and reduce churn',
  },
  'Survey insights agents': {
    title: 'Create your first insights agent',
    description: 'Automatically surface key insights and patterns from survey responses',
  },
  // Ticketing AI
  'Ticket priority agents': {
    title: 'Create your first ticket priority agent',
    description: 'Automatically prioritize tickets based on urgency and customer value',
  },
  'SLA rescue agents': {
    title: 'Create your first SLA rescue agent',
    description: 'Automatically alert and escalate tickets at risk of missing SLAs',
  },
  // Contacts AI
  'Contact enrichment agents': {
    title: 'Create your first enrichment agent',
    description: 'Automatically enrich contact data to keep your CRM accurate and complete',
  },
  'Duplicate merge agents': {
    title: 'Create your first duplicate merge agent',
    description: 'Automatically identify and merge duplicate contact records',
  },
  // Campaigns AI
  'Campaign QA agents': {
    title: 'Create your first QA agent',
    description: 'Automatically review campaigns for errors before they go live',
  },
  'Campaign optimizer agents': {
    title: 'Create your first optimizer agent',
    description: 'Automatically optimize campaigns based on performance signals',
  },
  // Reports
  'Report digest agents': {
    title: 'Create your first report digest agent',
    description: 'Automatically generate and deliver regular performance reports',
  },
  'Anomaly insight agents': {
    title: 'Create your first anomaly agent',
    description: 'Automatically detect and surface anomalies in your data',
  },
  // Insights
  'Insight summary agents': {
    title: 'Create your first insight agent',
    description: 'Automatically summarize key insights from across your business',
  },
  'Trend detection agents': {
    title: 'Create your first trend detection agent',
    description: 'Automatically identify and surface emerging trends in your data',
  },
  // Search AI
  'FAQ generation agents': {
    title: 'Create your first FAQ generation agent',
    description: 'Automatically generate and update FAQs from your business content and customer questions',
  },
  // Competitors AI
  'Competitor monitoring agents': {
    title: 'Create your first monitoring agent',
    description: 'Automatically track competitor changes and surface key insights',
  },
  'Benchmark summary agents': {
    title: 'Create your first benchmark agent',
    description: 'Automatically compare your performance against competitors',
  },
};

const DEFAULT_EMPTY = {
  title: 'Create your first agent',
  description: 'Automate repetitive tasks and let AI handle the work for you',
};

/* ─── Template ─── */

const DEFAULT_TABS = [
  { id: 'agents',  label: 'Agents' },
  { id: 'library', label: 'Library' },
];

const DEFAULT_METRICS = [
  { value: '835', title: 'Reviews responded',     showTrend: true, trend: '+1.3%', trendPositive: true },
  { value: '92%', title: 'Response rate',          showTrend: true, trend: '+1.3%', trendPositive: true },
  { value: '20m', title: 'Average response time',  showTrend: true, trend: '+1.3%', trendPositive: true },
];

export default function AgentsDashboardTemplate({
  pageTitle = 'Review response agents',
  tabs = DEFAULT_TABS,
  metrics = DEFAULT_METRICS,
  primaryMetricValue = '6h 20m',
  agents,
  templates,
  initialActiveTab = tabs[0]?.id,
  onCreateAgent,
  onCreateTemplate,
  onDeleteTemplate,
  onSaveTemplate,
  onUseTemplate,
  onShareTemplate,
  onDuplicateTemplate,
  onMoveTemplate,
  onOpenAgent,
  onDeleteAgent,
  onDuplicateAgent,
  onMoveAgent,
  onAgentUpdate,
  avatarSrc,
  activeNavId = 'reviews',
  activeMenuItemId = 'review-response-agents',
  navTitle = 'ReviewsAI',
  ctaLabel = 'Send a review request',
  menuItems,
  navItems,
  onNavChange,
  onMenuItemClick,
}) {
  const [activeTab, setActiveTab] = useState(initialActiveTab || tabs[0]?.id);
  const [libraryView, setLibraryView] = useState('grid');

  // Lifted metrics state — survives tab switches
  const [savedMetrics, setSavedMetrics] = useState(metrics);
  const [savedPrimaryValue, setSavedPrimaryValue] = useState(primaryMetricValue);

  const agentList = agents ?? [];
  const isEmpty = agentList.length === 0;
  const emptyCopy = EMPTY_STATE_COPY[pageTitle] ?? DEFAULT_EMPTY;

  useEffect(() => {
    setActiveTab(initialActiveTab || tabs[0]?.id);
  }, [initialActiveTab, tabs]);

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: font, color: '#212121', overflow: 'hidden' }}>

      {/* Primary Rail Nav */}
      <PrimaryRailNav
        {...(navItems ? { navItems } : {})}
        activeNavId={activeNavId}
        onNavChange={onNavChange}
      />

      {/* Secondary Rail Nav */}
      <SecondaryRailNav
        title={navTitle}
        ctaLabel={ctaLabel}
        menuItems={menuItems}
        activeItemId={activeMenuItemId}
        onItemClick={onMenuItemClick}
      />

      {/* Main column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#fff' }}>

        {/* Top Nav */}
        <div style={{
          height: 52,
          background: '#fff',
          borderBottom: '1px solid #e9e9eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 24px',
          gap: 4,
          flexShrink: 0,
        }}>
          <button style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#1976d2', fontVariationSettings: "'FILL' 1", lineHeight: 1 }}>add_circle</span>
          </button>
          <button style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#212121', lineHeight: 1 }}>help</span>
          </button>
          <button style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, padding: 2 }}>
            <Avatar alt="User" src={avatarSrc} size="extra-small" variant="circular" />
          </button>
          <button style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#555', lineHeight: 1 }}>menu</span>
          </button>
        </div>

        {/* Page Header */}
        <div style={{
          height: 64,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 18, fontWeight: 400, lineHeight: '26px', letterSpacing: '-0.36px', color: '#212121' }}>
            {pageTitle}
          </span>

          {activeTab === 'library' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button style={{ width: 36, height: 36, border: '1px solid #e5e9f0', borderRadius: 4, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#555', lineHeight: 1 }}>search</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 36, border: '1px solid #e5e9f0', borderRadius: 4, background: '#fff', padding: '0 8px' }}>
                <button
                  onClick={() => setLibraryView('grid')}
                  style={{ width: 24, height: 24, border: 'none', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: libraryView === 'grid' ? '#e5e9f0' : '#fff' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#212121', lineHeight: 1 }}>grid_view</span>
                </button>
                <button
                  onClick={() => setLibraryView('table')}
                  style={{ width: 24, height: 24, border: 'none', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: libraryView === 'table' ? '#e5e9f0' : '#fff' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#212121', lineHeight: 1 }}>table_rows</span>
                </button>
              </div>
              <button style={{ width: 36, height: 36, border: '1px solid #e5e9f0', borderRadius: 4, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#555', lineHeight: 1 }}>filter_list</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#555', lineHeight: 1 }}>search</span>
              </button>
              <Button theme="primary" label="Create agent" onClick={onCreateAgent} />
              <button style={{ width: 36, height: 36, border: '1px solid #e5e9f0', borderRadius: 4, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#555', lineHeight: 1 }}>filter_list</span>
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, background: '#fff', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ paddingLeft: 24, flexShrink: 0 }}>
            <TabHeader
              content={tabs.map(t => ({ value: t.id, label: t.label }))}
              activeTab={activeTab}
              clickTab={setActiveTab}
            />
          </div>

          {activeTab === 'agents' && (
            isEmpty ? (
              <EmptyStates
                title={emptyCopy.title}
                description={emptyCopy.description}
                actionLabel="Create agent"
                onAction={onCreateAgent}
              />
            ) : (
              <>
                <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
                  <MetricsGroup
                    primaryValue={savedPrimaryValue}
                    primaryType="time"
                    showTrend
                    primaryTrend="+1.3%"
                    primaryTrendPositive
                    metrics={savedMetrics}
                    onMetricsChange={setSavedMetrics}
                    onPrimaryValueChange={setSavedPrimaryValue}
                  />
                </div>
                <div style={{ padding: '20px 24px 24px' }}>
                  <AgentsTable
                    agents={agentList}
                    onRowClick={(agent) => onOpenAgent?.(agent.id)}
                    onDeleteAgent={onDeleteAgent}
                    onDuplicateAgent={onDuplicateAgent}
                    onMoveAgent={onMoveAgent}
                    onAgentUpdate={onAgentUpdate}
                  />
                </div>
              </>
            )
          )}

          {activeTab === 'library' && (
            <div style={{ padding: 24 }}>
              <TemplateLibrary
                templates={templates}
                variant={libraryView === 'table' ? 'list' : 'grid'}
                onCreateTemplate={onCreateTemplate}
                onDeleteTemplate={onDeleteTemplate}
                onSaveTemplate={onSaveTemplate}
                onUseTemplate={onUseTemplate}
                onShareTemplate={onShareTemplate}
                onDuplicateTemplate={onDuplicateTemplate}
                onMoveTemplate={onMoveTemplate}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

AgentsDashboardTemplate.propTypes = {
  pageTitle: PropTypes.string,
  tabs: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, label: PropTypes.string })),
  metrics: PropTypes.array,
  primaryMetricValue: PropTypes.string,
  agents: PropTypes.array,
  templates: PropTypes.array,
  initialActiveTab: PropTypes.string,
  onCreateAgent: PropTypes.func,
  onCreateTemplate: PropTypes.func,
  onDeleteTemplate: PropTypes.func,
  onSaveTemplate: PropTypes.func,
  onUseTemplate: PropTypes.func,
  onOpenAgent: PropTypes.func,
  avatarSrc: PropTypes.string,
  activeNavId: PropTypes.string,
  activeMenuItemId: PropTypes.string,
  navTitle: PropTypes.string,
  ctaLabel: PropTypes.string,
  menuItems: PropTypes.array,
  navItems: PropTypes.array,
  onNavChange: PropTypes.func,
  onMenuItemClick: PropTypes.func,
};
