import React, { useState, useRef } from 'react';
import FormInput from '@birdeye/elemental/core/atoms/FormInput/index.js';
import NodeType from '../Organisms/Accordion/NodeType/NodeType';
import AIChatBubble from '../Molecules/AIChatBubble/AIChatBubble';
import AIPromptBox from '../Molecules/AIPromptBox/AIPromptBox';
import aiImg from '@birdeye/elemental/core/components/Copilot/assets/icons/aiImg.svg.js';
import LHSEntityGroup from '../Molecules/LHS/LHSEntityGroup/LHSEntityGroup';
import './LHSDrawer.css';

/* ─── Trigger data ─── */
const TRIGGER_SUB_ITEMS = {
  Reviews: {
    title: 'Review event',
    items: [
      'When a new review is received',
      'When a review is updated',
      'When a review is responded',
      'When a new review is received or updated',
    ],
  },
  Inbox: {
    title: 'Inbox event',
    items: [
      'When a new message is received',
      'When a conversation is assigned',
      'When a conversation is closed',
    ],
  },
  Listings: {
    title: 'Listing event',
    items: [
      'When a listing is updated',
      'When a new listing is added',
      'When listing data changes',
    ],
  },
  Social: {
    title: 'Social event',
    items: [
      'When a new post is published',
      'When a comment is received',
      'When a mention is detected',
    ],
  },
  Surveys: {
    title: 'Survey event',
    items: [
      'When a survey response is received',
      'When a survey is completed',
      'When survey score changes',
    ],
  },
  Ticketing: {
    title: 'Ticketing event',
    items: [
      'When a new ticket is created',
      'When a ticket is updated',
      'When a ticket is resolved',
    ],
  },
  Contact: {
    title: 'Contact event',
    items: [
      'When a new contact is added',
      'When a contact is updated',
      'When a contact is merged',
    ],
  },
  'External apps': {
    title: 'External app event',
    items: [
      'When webhook is triggered',
      'When external data is synced',
    ],
  },
};

export const TRIGGER_CARDS = [
  { label: 'Schedule-based', icon: 'schedule', action: 'drag' },
  { label: 'Reviews', icon: 'grade', action: 'chevron' },
  { label: 'Inbox', icon: 'sms', action: 'chevron' },
  { label: 'Listings', icon: 'location_on', action: 'chevron' },
  { label: 'Social', icon: 'workspaces', action: 'chevron' },
  { label: 'Surveys', icon: 'assignment_turned_in', action: 'chevron' },
  { label: 'Ticketing', icon: 'shapes', action: 'chevron' },
  { label: 'Contact', icon: 'group', action: 'chevron' },
  { label: 'External apps', icon: 'grid_view', action: 'chevron' },
];

/* ─── Task data ─── */
const TASK_SUB_ITEMS = {
  Review: {
    title: 'Review task',
    items: [
      'Respond to a review',
      'Translate a review',
      'Categorize a review',
      'Analyze review sentiment',
    ],
  },
  Ticketing: {
    title: 'Ticketing task',
    items: [
      'Create a ticket',
      'Update a ticket',
      'Assign a ticket',
      'Close a ticket',
    ],
  },
  Contact: {
    title: 'Contact task',
    items: [
      'Create a contact',
      'Update a contact',
      'Tag a contact',
    ],
  },
  Referral: {
    title: 'Referral task',
    items: [
      'Send a referral request',
      'Follow up on referral',
      'Track referral status',
    ],
  },
  'Surveys-task': {
    title: 'Survey task',
    items: [
      'Send a survey',
      'Follow up on survey',
      'Analyze survey results',
      'Response handler',
    ],
  },
  'Social-task': {
    title: 'Social task',
    items: [
      'Content settings',
      'Generate business post themes',
      'Upcoming holiday events',
      'Get top performing posts',
      'Get competitor posts',
      'Set publishing schedule',
      'Set approvals',
    ],
  },
  'External apps-task': {
    title: 'External app task',
    items: [
      'Send data to external app',
      'Fetch data from external app',
      'Trigger external webhook',
    ],
  },
};

export const TASK_CARDS = [
  { label: 'Custom', icon: 'dashboard_customize', action: 'drag' },
  { label: 'Review', icon: 'grade', action: 'chevron', subKey: 'Review' },
  { label: 'Ticketing', icon: 'confirmation_number', action: 'chevron', subKey: 'Ticketing' },
  { label: 'Contact', icon: 'group', action: 'chevron', subKey: 'Contact' },
  { label: 'Referral', icon: 'redeem', action: 'chevron', subKey: 'Referral' },
  { label: 'Surveys', icon: 'task_alt', action: 'chevron', subKey: 'Surveys-task' },
  { label: 'Social', icon: 'workspaces', action: 'chevron', subKey: 'Social-task' },
  { label: 'External apps', icon: 'grid_view', action: 'chevron', subKey: 'External apps-task' },
];

/* ─── Controls data ─── */
export const CONTROL_CARDS = [
  { label: 'Branch', icon: 'account_tree', action: 'drag', nodeType: 'branch' },
  { label: 'Delay', icon: 'schedule', action: 'drag', nodeType: 'delay' },
  { label: 'Parallel tasks', icon: 'splitscreen_add', action: 'drag', nodeType: 'parallel' },
  { label: 'Loop', icon: 'repeat', action: 'drag', nodeType: 'loop' },
];

/* ─── All sub-items merged (initial state) ─── */
const INITIAL_SUB_ITEMS = { ...TRIGGER_SUB_ITEMS, ...TASK_SUB_ITEMS };

/* ─── Card Row ─── */
export function CardRow({ label, icon, action, isActive, onClick, onHover, cardRef, nodeType, viewOnly }) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/reactflow-type', nodeType);
    e.dataTransfer.setData('application/reactflow-label', label);
    e.dataTransfer.setData('application/reactflow-description', label);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const isDraggable = action === 'drag' && !viewOnly;

  return (
    <div
      ref={cardRef}
      className={`lhs-drawer__card ${action === 'drag' ? 'lhs-drawer__card--drag' : ''} ${isActive ? 'lhs-drawer__card--active' : ''} ${viewOnly ? 'lhs-drawer__card--view-only' : ''}`}
      onClick={onClick}
      onMouseEnter={onHover}
      draggable={isDraggable}
      onDragStart={isDraggable ? handleDragStart : undefined}
    >
      <span className="lhs-drawer__card-icon material-symbols-outlined">
        {icon}
      </span>
      <span className="lhs-drawer__card-label">{label}</span>
      {action === 'drag' ? (
        <span className="lhs-drawer__card-action">
          <span className="material-symbols-outlined">drag_indicator</span>
        </span>
      ) : (
        <span className="lhs-drawer__card-action lhs-drawer__card-action--chevron">
          <span className="material-symbols-outlined">expand_more</span>
        </span>
      )}
    </div>
  );
}

const TABS = ['Create with AI', 'Create manually'];

const AI_OPTIONS = [
  'Replying using templates',
  'Replying autonomously',
  'Replying after human approval',
  'Suggesting replies in dashboard',
];

export default function LHSDrawer({
  defaultTab = 'Create manually',
  defaultOpenSection = 'Trigger',
  viewOnly = false,
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [openSection, setOpenSection] = useState(defaultOpenSection);
  const toggleSection = (section) =>
    setOpenSection((prev) => (prev === section ? null : section));
  const [search, setSearch] = useState('');
  const [expandedCard, setExpandedCard] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [dropdownTop, setDropdownTop] = useState(0);
  const [subItems, setSubItems] = useState(INITIAL_SUB_ITEMS);
  const panelRef = useRef(null);
  const cardRefs = useRef({});

  const handleSubItemsChange = (key, newItems) => {
    setSubItems((prev) => ({
      ...prev,
      [key]: { ...prev[key], items: newItems },
    }));
  };

  const handleCardHover = (card, section, subKey) => {
    if (card.action !== 'chevron') {
      // Hovering a non-chevron card closes any open dropdown
      setExpandedCard(null);
      setExpandedSection(null);
      return;
    }

    const key = subKey || card.label;

    const cardEl = cardRefs.current[`${section}-${card.label}`];
    const panelEl = panelRef.current;
    if (cardEl && panelEl) {
      const cardRect = cardEl.getBoundingClientRect();
      const panelRect = panelEl.getBoundingClientRect();
      setDropdownTop(cardRect.top - panelRect.top);
    }
    setExpandedCard(key);
    setExpandedSection(section);
  };

  const renderCards = (cards, section, nodeType) => (
    <div className="lhs-drawer__cards">
      {cards.filter(
        (c) => !search || c.label.toLowerCase().includes(search.toLowerCase())
      ).map((card) => {
        const subKey = card.subKey || card.label;
        return (
          <div key={card.label} className="lhs-drawer__card-wrapper">
            <CardRow
              label={card.label}
              icon={card.icon}
              action={card.action}
              nodeType={card.nodeType || nodeType}
              isActive={expandedCard === subKey && expandedSection === section}
              onClick={() => {}}
              onHover={() => handleCardHover(card, section, card.subKey)}
              cardRef={(el) => { cardRefs.current[`${section}-${card.label}`] = el; }}
              viewOnly={viewOnly}
            />
          </div>
        );
      })}
    </div>
  );

  const triggerContent = renderCards(TRIGGER_CARDS, 'trigger', 'trigger');
  const tasksContent = renderCards(TASK_CARDS, 'task', 'task');
  const controlsContent = renderCards(CONTROL_CARDS, 'control', 'branch');

  const activeSubItems = expandedCard ? subItems[expandedCard] : null;

  const closeDropdown = () => {
    setExpandedCard(null);
    setExpandedSection(null);
  };

  return (
    <div className="lhs-drawer" ref={panelRef} onMouseLeave={closeDropdown}>
      <div className="lhs-drawer__tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`lhs-drawer__tab${activeTab === tab ? ' lhs-drawer__tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            <span className="lhs-drawer__tab-label">
              {tab === 'Create with AI' ? (
                <>Create with <img src={aiImg} alt="AI" className="lhs-drawer__tab-ai-icon" /></>
              ) : tab}
            </span>
            <span className="lhs-drawer__tab-underline" />
          </button>
        ))}
      </div>

      {activeTab === 'Create manually' ? (
        <div className="lhs-drawer__body">
          <div className="lhs-drawer__search">
            <FormInput
              name="search"
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e, value) => setSearch(value)}
              showLeftIcon
              customIconClass="icon_phoenix-search-glass"
            />
          </div>

          <div className="lhs-drawer__sections">
            <NodeType title="Trigger" content={triggerContent} isOpen={openSection === 'Trigger'} onToggle={() => toggleSection('Trigger')} />
            <NodeType title="Tasks" content={tasksContent} isOpen={openSection === 'Tasks'} onToggle={() => toggleSection('Tasks')} />
            <NodeType title="Controls" content={controlsContent} isOpen={openSection === 'Controls'} onToggle={() => toggleSection('Controls')} />
          </div>
        </div>
      ) : (
        <div className="lhs-drawer__ai-body">
          <div className="lhs-drawer__ai-chat-area">
            <AIChatBubble
              message="Hi! I'm here to help you build your Review response agent. Tell me what you'd like to build"
              options={AI_OPTIONS}
            />
          </div>
          <AIPromptBox onSend={() => {}} />
        </div>
      )}

      {activeSubItems && (
        <div
          className="lhs-drawer__dropdown-zone"
          style={{ top: dropdownTop }}
        >
          <div className="lhs-drawer__dropdown-bridge" />
          <LHSEntityGroup
            title={activeSubItems.title}
            items={activeSubItems.items}
            nodeType={expandedSection === 'trigger' ? 'trigger' : 'task'}
            parentLabel={expandedCard}
            onItemsChange={(newItems) => handleSubItemsChange(expandedCard, newItems)}
            viewOnly={viewOnly}
          />
        </div>
      )}
    </div>
  );
}
