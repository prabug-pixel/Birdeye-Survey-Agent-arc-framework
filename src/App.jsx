import { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import AgentBuilder from './components/AgentBuilder/AgentBuilder';
import AgentsDashboardTemplate from './components/Templates/AgentsDashboardTemplate/AgentsDashboardTemplate';
import AgentViewerPage from './pages/AgentViewerPage';
import { getModuleTemplates } from './components/Modules/agentFrameworkData';
import { getModuleNav } from './components/Modules/moduleNavigation';
import { subscribeToAgents, deleteAgent, saveAgent } from './services/agentService';
import { deleteTemplate, saveTemplate, subscribeToTemplates } from './services/templateService';
import ShareModal from './components/Organisms/Modals/ShareModal/ShareModal';
import MoveToModal from './components/Organisms/Modals/MoveToModal/MoveToModal';
import styles from './App.module.css';
import '@xyflow/react/dist/style.css';

/* ─── Helpers ─── */

function formatTitle(value) {
  return value
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function toDashboardAgent(agent) {
  return {
    id: agent.id,
    name: agent.name,
    status: agent.status || 'Draft',
    reviewsResponded: agent.reviewsResponded || 0,
    responseRate: agent.responseRate || '—',
    avgResponseTime: agent.avgResponseTime || '—',
    timeSaved: agent.timeSaved || '—',
    locations: agent.locations || 0,
    agentSlug: agent.agentSlug || '',
    moduleSlug: agent.moduleSlug || agent.moduleContext || '',
  };
}

function getPageTitle(activeItemId, moduleNav) {
  const child = moduleNav.menuItems
    .flatMap((item) => item.children || [item])
    .find((item) => item.id === activeItemId);

  if (child?.label) return child.label;
  return `${formatTitle(activeItemId || 'agents')} agents`;
}

/* ─── Agent-section L2 items all end with '-agents' ─── */
function isAgentSection(itemId) {
  return !itemId || itemId.endsWith('-agents');
}

function withTemplateContext(template, moduleId, sectionId) {
  return {
    ...template,
    moduleContext: template.moduleContext || moduleId,
    sectionContext: template.sectionContext || sectionId,
    source: template.source || 'default',
  };
}

function mergeTemplates(defaultTemplates, savedTemplates, moduleId, sectionId) {
  const moduleSaved = savedTemplates
    .filter((template) => template.moduleContext === moduleId && template.sectionContext === sectionId)
    .sort((a, b) => {
      const aTime = a.updatedAt?.seconds ?? 0;
      const bTime = b.updatedAt?.seconds ?? 0;
      return aTime - bTime;
    });
  const savedById = new Map(moduleSaved.map((template) => [template.id, template]));
  const defaults = defaultTemplates.map((template) => {
    const saved = savedById.get(template.id);
    if (saved?.deleted) return null;
    return withTemplateContext(saved ? { ...template, ...saved } : template, moduleId, sectionId);
  }).filter(Boolean);
  const custom = moduleSaved
    .filter((template) => !template.deleted && !defaultTemplates.some((item) => item.id === template.id))
    .map((template) => withTemplateContext(template, moduleId, sectionId));

  return [...defaults, ...custom];
}

const toSlug = (name) =>
  name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

/* ─── Primary nav items — Search AI inserted above Reviews ─── */
const CUSTOM_NAV_ITEMS = [
  { id: 'overview',     label: 'Overview',     icon: 'home' },
  { id: 'inbox',        label: 'Inbox',        icon: 'sms' },
  { id: 'listings',     label: 'Listings',     icon: 'location_on' },
  { id: 'search',       label: 'Search AI',    icon: 'lightbulb' },
  { id: 'reviews',      label: 'Reviews',      icon: 'grade' },
  { id: 'referrals',    label: 'Referrals',    icon: 'featured_seasonal_and_gifts' },
  { id: 'payments',     label: 'Payments',     icon: 'monetization_on' },
  { id: 'appointments', label: 'Appointments', icon: 'calendar_month' },
  { id: 'social',       label: 'Social',       icon: 'workspaces' },
  { id: 'surveys',      label: 'Surveys',      icon: 'assignment_turned_in' },
  { id: 'ticketing',    label: 'Ticketing',    icon: 'shapes' },
  { id: 'contacts',     label: 'Contacts',     icon: 'group' },
  { id: 'campaigns',    label: 'Campaigns',    icon: 'campaign' },
  { id: 'reports',      label: 'Reports',      icon: 'pie_chart' },
  { id: 'insights',     label: 'Insights',     icon: 'tips_and_updates' },
  { id: 'competitors',  label: 'Competitors',  icon: 'leaderboard' },
];

/* ─── App ─── */

function App() {
  const navigate = useNavigate();
  const [currentModule, setCurrentModule] = useState('surveys');
  const [activeL2Item, setActiveL2Item] = useState(() => getModuleNav('surveys').defaultItemId);
  const [agents, setAgents] = useState([]);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastTone, setToastTone] = useState('success');
  const [dashboardInitialTab, setDashboardInitialTab] = useState('agents');
  const [templateShareUrl, setTemplateShareUrl] = useState(null);
  const [moveToTarget, setMoveToTarget] = useState(null);
  const toastTimerRef = useRef(null);

  function showToast(message, tone = 'success') {
    clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    setToastTone(tone);
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 3000);
  }

  // Subscribe to all agents in real-time from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToAgents((data) => {
      const sorted = data.sort((a, b) => {
        const ta = a.updatedAt?.seconds ?? 0;
        const tb = b.updatedAt?.seconds ?? 0;
        return tb - ta;
      });
      setAgents(sorted);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToTemplates((data) => {
      setSavedTemplates(data);
    });
    return () => unsubscribe();
  }, []);

  const moduleNav = getModuleNav(currentModule);
  const defaultModuleTemplates = useMemo(
    () => getModuleTemplates(currentModule, activeL2Item).map((template) => withTemplateContext(template, currentModule, activeL2Item)),
    [currentModule, activeL2Item]
  );
  const moduleTemplates = useMemo(
    () => mergeTemplates(defaultModuleTemplates, savedTemplates, currentModule, activeL2Item),
    [defaultModuleTemplates, savedTemplates, currentModule, activeL2Item]
  );
  const moduleAgents = useMemo(
    () =>
      agents
        .filter((a) => {
          if (a.moduleContext !== currentModule) return false;
          if (activeL2Item === 'view-all-agents') return true;
          return a.sectionContext === activeL2Item;
        })
        .map(toDashboardAgent),
    [agents, currentModule, activeL2Item]
  );

  /* ─── Module change ─── */
  function handleModuleChange(moduleId) {
    const nextNav = getModuleNav(moduleId);
    setCurrentModule(moduleId);
    setActiveL2Item(nextNav.defaultItemId);
    setDashboardInitialTab('agents');
    navigate('/');
  }

  /* ─── Agent builder open / close ─── */
  async function handleCreateAgent(template) {
    const resolved = template || moduleTemplates.find((t) => t.sectionContext === activeL2Item) || moduleTemplates[0] || null;
    const newId = crypto.randomUUID();
    const moduleSlug = currentModule;
    const agentSlug = toSlug(resolved?.title || 'agent') + '-' + Date.now().toString(36);
    await saveAgent(newId, {
      id: newId,
      name: resolved?.title || '',
      moduleSlug,
      agentSlug,
      moduleContext: currentModule,
      sectionContext: activeL2Item,
      status: 'Draft',
      nodes: resolved?.nodes || null,
      nodeDetails: resolved?.nodeDetails || null,
      templateId: resolved?.id,
      templateSource: resolved?.source,
    });
    navigate(`/${moduleSlug}/agents/${agentSlug}`);
  }

  function handleUseTemplate(templateId) {
    const template = moduleTemplates.find((item) => item.id === templateId);
    handleCreateAgent(template || null);
  }

  async function handleSaveTemplate(template) {
    const templateId = template.id || crypto.randomUUID();
    const previousTemplate = savedTemplates.find((item) => item.id === templateId);
    const nextTemplate = {
      ...template,
      id: templateId,
      moduleContext: template.moduleContext || currentModule,
      sectionContext: template.sectionContext || activeL2Item,
      source: template.source || 'custom',
      title: template.title,
      description: template.description,
    };

    setSavedTemplates((prev) => {
      const rest = prev.filter((item) => item.id !== templateId);
      return [...rest, { ...nextTemplate, updatedAt: { seconds: Math.floor(Date.now() / 1000) } }];
    });

    try {
      await saveTemplate(templateId, nextTemplate);
      setDashboardInitialTab('library');
      showToast('Template saved successfully');
    } catch (error) {
      setSavedTemplates((prev) => {
        const rest = prev.filter((item) => item.id !== templateId);
        return previousTemplate ? [...rest, previousTemplate] : rest;
      });
      console.error('Template save failed', error);
      showToast('Template could not be saved', 'error');
      throw error;
    }
  }

  function handleCreateTemplate(template) {
    return handleSaveTemplate({
      ...template,
      id: crypto.randomUUID(),
      moduleContext: currentModule,
      sectionContext: activeL2Item,
      source: 'custom',
    });
  }

  function handleDeleteTemplate(templateId) {
    const template = moduleTemplates.find((item) => item.id === templateId);
    if (template?.source === 'default') {
      return saveTemplate(templateId, {
        ...template,
        deleted: true,
        moduleContext: template.moduleContext || currentModule,
        sectionContext: template.sectionContext || activeL2Item,
      });
    }
    return deleteTemplate(templateId);
  }

  function handleL2ItemClick(itemId) {
    if (itemId === 'create-agent') {
      handleCreateAgent();
      return;
    }
    setActiveL2Item(itemId);
  }

  function handleDeleteAgent(agentId) {
    deleteAgent(agentId);
  }

  async function handleAgentUpdate(agentId, field, value) {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;
    const rest = { ...agent };
    delete rest.updatedAt;
    await saveAgent(agentId, { ...rest, [field]: value });
  }

  async function handleOpenAgent(agentId) {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;
    if (agent.agentSlug && agent.moduleSlug) {
      navigate(`/${agent.moduleSlug}/agents/${agent.agentSlug}`);
    } else {
      const moduleSlug = agent.moduleContext || currentModule;
      const agentSlug = toSlug(agent.name || 'agent') + '-' + Date.now().toString(36);
      const { updatedAt, ...rest } = agent;
      await saveAgent(agent.id, { ...rest, moduleSlug, agentSlug });
      navigate(`/${moduleSlug}/agents/${agentSlug}`);
    }
  }

  /* ─── Save / Publish ─── */
  function handleSaveAgent(isPublish = false, publishedAgent = null) {
    if (publishedAgent) {
      if (publishedAgent.moduleContext) setCurrentModule(publishedAgent.moduleContext);
      setAgents((prev) => {
        const entry = { ...publishedAgent, updatedAt: { seconds: Math.floor(Date.now() / 1000) } };
        const rest = prev.filter((a) => a.id !== publishedAgent.id);
        return [entry, ...rest];
      });
    }
    navigate('/');
    if (isPublish) {
      showToast('Agent published successfully');
    }
  }

  /* ─── Export / Import ─── */
  function handleExportAgent(agent) {
    const full = agents.find((a) => a.id === agent.id) || agent;
    const blob = new Blob([JSON.stringify(full, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${full.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportAgent(data) {
    const agentId = crypto.randomUUID();
    const moduleSlug = data.moduleContext || currentModule;
    const agentSlug = toSlug(data.name || 'agent') + '-' + Date.now().toString(36);
    const imported = {
      ...data,
      id: agentId,
      moduleContext: data.moduleContext || currentModule,
      moduleSlug,
      agentSlug,
      status: data.status || 'Draft',
    };
    await saveAgent(agentId, imported);
    navigate(`/${moduleSlug}/agents/${agentSlug}`);
  }

  /* ─── Duplicate agent ─── */
  async function handleDuplicateAgent(agentId) {
    const full = agents.find((a) => a.id === agentId);
    if (!full) return;
    const newId = crypto.randomUUID();
    const newName = `Copy of ${full.name || 'Untitled'}`;
    const moduleSlug = full.moduleSlug || full.moduleContext || currentModule;
    const agentSlug = toSlug(newName) + '-' + Date.now().toString(36);
    const { updatedAt, ...rest } = full;
    await saveAgent(newId, { ...rest, id: newId, name: newName, moduleSlug, agentSlug, status: 'Draft' });
    showToast('Agent duplicated');
  }

  /* ─── Move agent ─── */
  async function handleMoveAgent(agentId, moduleId, sectionId) {
    const full = agents.find((a) => a.id === agentId);
    if (!full) return;
    const { updatedAt, ...rest } = full;
    await saveAgent(agentId, { ...rest, moduleContext: moduleId, sectionContext: sectionId });
    showToast('Agent moved');
  }

  /* ─── Duplicate template ─── */
  async function handleDuplicateTemplate(template) {
    const newId = crypto.randomUUID();
    await saveTemplate(newId, {
      id: newId,
      title: `Copy of ${template.title || 'Untitled'}`,
      description: template.description || '',
      moduleContext: template.moduleContext || currentModule,
      sectionContext: template.sectionContext || activeL2Item,
      source: 'custom',
      nodes: template.nodes || null,
      nodeDetails: template.nodeDetails || null,
    });
    showToast('Template duplicated');
  }

  /* ─── Move template ─── */
  async function handleMoveTemplate(templateId, moduleId, sectionId) {
    const template = moduleTemplates.find((t) => t.id === templateId) || savedTemplates.find((t) => t.id === templateId);
    if (!template) return;
    await saveTemplate(templateId, {
      id: templateId,
      title: template.title,
      description: template.description || '',
      moduleContext: moduleId,
      sectionContext: sectionId,
      source: template.source || 'custom',
      nodes: template.nodes || null,
      nodeDetails: template.nodeDetails || null,
    });
    showToast('Template moved');
  }

  /* ─── Move To modal helpers ─── */
  function handleRequestMoveAgent(agentId) {
    setMoveToTarget({ type: 'agent', id: agentId });
  }

  function handleRequestMoveTemplate(template) {
    setMoveToTarget({ type: 'template', id: template.id });
  }

  function handleMoveConfirm(moduleId, sectionId) {
    if (!moveToTarget) return;
    if (moveToTarget.type === 'agent') {
      handleMoveAgent(moveToTarget.id, moduleId, sectionId);
    } else {
      handleMoveTemplate(moveToTarget.id, moduleId, sectionId);
    }
    setMoveToTarget(null);
  }

  /* ─── Share template ─── */
  async function handleShareTemplate(template) {
    await saveTemplate(template.id, {
      id: template.id,
      title: template.title,
      description: template.description || '',
      moduleContext: template.moduleContext || currentModule,
      sectionContext: template.sectionContext || activeL2Item,
      source: template.source || 'custom',
      nodes: template.nodes || null,
      nodeDetails: template.nodeDetails || null,
    });
    setTemplateShareUrl(`${window.location.origin}/view/template/${template.id}`);
  }

  /* ─── Toast portal (always mounted so it survives route changes) ─── */
  const toast = toastVisible
    ? ReactDOM.createPortal(
        <div className={`${styles.toast} ${toastTone === 'error' ? styles.toastError : ''}`}>
          <span className="material-symbols-outlined">{toastTone === 'error' ? 'error' : 'check_circle'}</span>
          {toastMessage}
        </div>,
        document.body
      )
    : null;

  const showDashboard = isAgentSection(activeL2Item);

  const dashboardElement = (
    <AgentsDashboardTemplate
      navItems={CUSTOM_NAV_ITEMS}
      navTitle={moduleNav.title}
      ctaLabel={moduleNav.ctaLabel}
      menuItems={moduleNav.menuItems}
      pageTitle={getPageTitle(activeL2Item, moduleNav)}
      activeNavId={currentModule}
      activeMenuItemId={activeL2Item}
      agents={moduleAgents}
      templates={moduleTemplates}
      initialActiveTab={dashboardInitialTab}
      showDashboard={showDashboard}
      onCreateAgent={() => handleCreateAgent()}
      onCreateTemplate={handleCreateTemplate}
      onDeleteTemplate={handleDeleteTemplate}
      onSaveTemplate={handleSaveTemplate}
      onUseTemplate={handleUseTemplate}
      onShareTemplate={handleShareTemplate}
      onDuplicateTemplate={handleDuplicateTemplate}
      onMoveTemplate={handleRequestMoveTemplate}
      onDuplicateAgent={handleDuplicateAgent}
      onMoveAgent={handleRequestMoveAgent}
      onNavChange={handleModuleChange}
      onMenuItemClick={handleL2ItemClick}
      onOpenAgent={handleOpenAgent}
      onDeleteAgent={handleDeleteAgent}
      onAgentUpdate={handleAgentUpdate}
      onExportAgent={handleExportAgent}
      onImportAgent={handleImportAgent}
    />
  );

  const builderElement = (
    <ReactFlowProvider>
      <AgentBuilder
        onSaveAgent={handleSaveAgent}
        onSaveTemplate={handleSaveTemplate}
        onClose={() => navigate('/')}
      />
    </ReactFlowProvider>
  );

  return (
    <>
      <Routes>
        <Route path="/" element={dashboardElement} />
        <Route path="/:moduleSlug/agents/:agentSlug" element={builderElement} />
        <Route path="/view/template/:templateId" element={<AgentViewerPage />} />
        <Route path="/view/:moduleSlug/:agentSlug" element={<AgentViewerPage />} />
        <Route path="/view/:agentId" element={<AgentViewerPage />} />
      </Routes>
      {templateShareUrl && (
        <ShareModal shareUrl={templateShareUrl} onClose={() => setTemplateShareUrl(null)} />
      )}
      {moveToTarget && (
        <MoveToModal onMove={handleMoveConfirm} onCancel={() => setMoveToTarget(null)} />
      )}
      {toast}
    </>
  );
}

export default App;
