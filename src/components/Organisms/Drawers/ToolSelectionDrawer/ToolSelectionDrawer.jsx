import React, { useState } from 'react';
import CommonSideDrawer from '@birdeye/elemental/core/atoms/CommonSideDrawer/index.js';
import './ToolSelectionDrawer.css';

// ─── Data ────────────────────────────────────────────────────────────────────

const INTERNAL_TOOLS = [
  { id: 'urgency-classifier',     name: 'Urgency classifier',     desc: 'Check how urgent the incoming survey response is.' },
  { id: 'get-surveys',            name: 'Get Surveys',            desc: 'Retrieve survey responses across campaigns, locations, and channels.' },
  { id: 'nps-csat-classifier',    name: 'NPS / CSAT Classifier',  desc: 'Classify survey responses into Promoter / Passive / Detractor (NPS) or Satisfied / Neutral / Dissatisfied (CSAT).' },
  { id: 'sentiment-classifier',   name: 'Sentiment classifier',   desc: 'Classify sentiment of open-text survey answers and detect score-comment mismatches.' },
  { id: 'churn-risk-detector',    name: 'Churn Risk Detector',    desc: 'Detect churn risk signals from survey feedback, respondent history, and severity assessment.' },
  { id: 'contact-history-lookup', name: 'Contact History Lookup', desc: 'Fetch the contact’s prior survey responses, tier, tenure, and custom properties for personalization.' },
  { id: 'response-template',      name: 'Response Template',      desc: 'Suggest an on-brand response template based on respondent type, sentiment, and severity.' },
  { id: 'approval-workflow',      name: 'Approval Workflow',      desc: 'Route high-severity or escalated survey responses through an approval template before sending.' },
  { id: 'survey-responder',       name: 'Survey responder',       desc: 'Post the approved response back to the survey respondent across the appropriate survey channel.' },
  { id: 'business-metadata',      name: 'Business Metadata',      desc: 'Fetch business profile information — category, subcategories, services, and products — for response context.' },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function ToolSelectionDrawer({
  isOpen = false,
  onClose,
  onToolSelect,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = INTERNAL_TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClose = () => onClose?.();

  return (
    <CommonSideDrawer
      isOpen={isOpen}
      title=""
      onClose={handleClose}
      width="650px"
      shouldScroll={false}
      buttonPosition="right"
      headerRightContent={<span className="tsd-drawer-suppress" />}
    >
      <div className="tsd-outer">
        {/* ─── Custom header with back arrow ─── */}
        <div className="tsd-header">
          <button className="tsd-back-btn" type="button" onClick={handleClose} aria-label="Back">
            <span className="material-symbols-outlined">arrow_left_alt</span>
          </button>
          <span className="tsd-header-title">Add a tool</span>
        </div>

        <div className="tsd-body">
          {/* Search */}
          <div className="tsd-search">
            <span className="material-symbols-outlined tsd-search__icon">search</span>
            <input
              className="tsd-search__input"
              placeholder="Search tools"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Tool list */}
          <div className="tsd-list">
            {filtered.map((tool) => (
              <button
                key={tool.id}
                className="tsd-card"
                type="button"
                onClick={() => onToolSelect?.(tool)}
              >
                <div className="tsd-card__icon-wrap">
                  <span className="material-symbols-outlined tsd-card__icon">build</span>
                </div>
                <div className="tsd-card__info">
                  <span className="tsd-card__name">{tool.name}</span>
                  <span className="tsd-card__desc">{tool.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </CommonSideDrawer>
  );
}
