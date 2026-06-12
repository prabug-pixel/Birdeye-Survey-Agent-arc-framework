import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import DataType from '../../../Molecules/DataType/DataType';
import './VariableSelectionModal.css';

const DEFAULT_NODES = [
  { id: '1', label: '1.Trigger', count: 4 },
  { id: '2', label: '2.Task: Identify relevant...', count: 4 },
  { id: '3', label: '3.Task: custom tokens', count: 5 },
  { id: '4', label: '4.Task: Generate resp...', count: 2 },
  { id: '5', label: '5.Task : Send a review r...', count: 5 },
];

const DEFAULT_VARIABLES = [
  'Review.source',
  'Review.sentiment',
  'Review.rating',
  'Review.spam',
  'Review.comment',
];

const DEFAULT_SYSTEM_NODES = [
  { id: 'contact', label: 'Contact', count: 8 },
  { id: 'business', label: 'Business', count: 6 },
  { id: 'listing', label: 'Listing profile fields', count: 5 },
  { id: 'date', label: 'Date', count: 4 },
  { id: 'utilities', label: 'Utilities', count: 3 },
];

const DEFAULT_SYSTEM_VARIABLES_BY_NODE = {
  contact: [
    'Contact First Name',
    'Contact Last Name',
    'Contact Email',
    'Contact Phone',
    'Contact Display Name',
    'Contact Country Code',
    'Contact City',
    'Contact State',
  ],
  business: [
    'Business Name',
    'Business Industry',
    'Business Phone',
    'Business Email',
    'Business Website',
    'Business Address',
  ],
  listing: [
    'Listing Profile Name',
    'Listing Profile URL',
    'Listing Profile Rating',
    'Listing Profile Review Count',
    'Listing Profile Category',
  ],
  date: [
    'Current Date',
    'Current Time',
    'Current Day',
    'Current Month',
  ],
  utilities: [
    'Agent Name',
    'Survey Name',
    'Response ID',
  ],
};

export default function VariableSelectionModal({
  isOpen,
  onClose,
  onVariableSelect,
  nodes = DEFAULT_NODES,
  variables = DEFAULT_VARIABLES,
  systemNodes = DEFAULT_SYSTEM_NODES,
  systemVariablesByNode = DEFAULT_SYSTEM_VARIABLES_BY_NODE,
  title = 'Fields',
  dropdown = false,
  dropdownStyle,
}) {
  const [activeTab, setActiveTab] = useState('system');
  const [activeNodeId, setActiveNodeId] = useState(nodes[0]?.id ?? null);
  const [activeSystemNodeId, setActiveSystemNodeId] = useState(systemNodes[0]?.id ?? null);
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const isSystemTab = activeTab === 'system';

  const activeLeftNodes = isSystemTab ? systemNodes : nodes;
  const activeLeftNodeId = isSystemTab ? activeSystemNodeId : activeNodeId;
  const setActiveLeftNodeId = isSystemTab ? setActiveSystemNodeId : setActiveNodeId;

  const currentVariables = isSystemTab
    ? (systemVariablesByNode[activeSystemNodeId] ?? [])
    : variables;

  const filteredVariables = currentVariables.filter((v) =>
    v.toLowerCase().includes(search.toLowerCase())
  );

  const dialog = (
    <div
      className="variable-selection-modal__dialog"
      style={dropdown ? { zIndex: 1000, ...dropdownStyle } : undefined}
    >
        <div className="variable-selection-modal__header">
          <p className="variable-selection-modal__title">{title}</p>
          <button className="variable-selection-modal__close" onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="variable-selection-modal__body">
          <div className="variable-selection-modal__tabs">
            {['system', 'local'].map((tab) => (
              <button
                key={tab}
                className={`variable-selection-modal__tab${activeTab === tab ? ' variable-selection-modal__tab--active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                <span className="variable-selection-modal__tab-text">
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </span>
                <span className="variable-selection-modal__tab-indicator" />
              </button>
            ))}
          </div>

          <div className="variable-selection-modal__search">
            <span className="material-symbols-outlined variable-selection-modal__search-icon">search</span>
            <input
              className="variable-selection-modal__search-input"
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="variable-selection-modal__panels">
            <div className="variable-selection-modal__node-list">
              {activeLeftNodes.map((node) => (
                <button
                  key={node.id}
                  className={`variable-selection-modal__node${activeLeftNodeId === node.id ? ' variable-selection-modal__node--active' : ''}`}
                  onClick={() => setActiveLeftNodeId(node.id)}
                >
                  <span className="variable-selection-modal__node-label">{node.label}</span>
                  <span className="variable-selection-modal__node-count">{node.count}</span>
                  <span className="material-symbols-outlined variable-selection-modal__node-chevron">chevron_right</span>
                </button>
              ))}
            </div>

            <div className="variable-selection-modal__variable-list">
              {filteredVariables.map((variable, i) => (
                <button
                  key={variable}
                  className="variable-selection-modal__variable-btn"
                  onClick={() => onVariableSelect?.(variable)}
                >
                  <DataType type="variable" label={`${i + 1}. ${variable}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
  );

  if (dropdown) return createPortal(dialog, document.body);

  return (
    <div className="variable-selection-modal__overlay" onClick={handleOverlayClick}>
      {dialog}
    </div>
  );
}
