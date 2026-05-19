import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AppShell from '../AppShell/AppShell';
import LHSDrawer from '../LHSDrawer/LHSDrawer';
import FlowCanvas from '../FlowCanvas/FlowCanvas';
import RHS from '../Organisms/Panels/RHS/RHS';
import ScheduleBased from '../Molecules/RHS/Trigger/ScheduleBased/ScheduleBased';
import ShareModal from '../Organisms/Modals/ShareModal/ShareModal';
import EmptyStates from '../Patterns/EmptyStates/EmptyStates';
import Button from '@birdeye/elemental/core/atoms/Button/index.js';
import { saveAgent, getAgentBySlug, getCachedAgent } from '../../services/agentService';
import { getModuleNav } from '../Modules/moduleNavigation';
import './AgentBuilder.css';

const START_NODE_ID = '__start__';
const END_NODE_ID = '__end__';

function makeNodeDetails(type, label) {
  if (type === 'trigger' && label === 'Schedule-based') {
    return {
      triggerName: '',
      description: '',
      frequency: 'Daily',
      day: '7 days',
      time: '9:00 AM',
    };
  }
  if (type === 'trigger') {
    return {
      triggerName: '',
      description: '',
      conditions: [
        { field: '', operator: '', value: '' },
        { field: '', operator: '', value: '' },
        { field: '', operator: '', value: '' },
      ],
    };
  }
  if (type === 'branch') return { basedOn: 'conditions', branches: [] };
  if (type === 'delay') return { name: '', duration: '', unit: '' };
  if (type === 'parallel') return { nodeName: '', description: '', branches: [{ name: '' }, { name: '' }] };
  if (type === 'loop') return { name: '', description: '', loopMode: 'manual', loopOver: null };
  if (label === 'Custom') {
    return {
      taskName: '',
      description: '',
      llmModel: 'Fast',
      systemPrompt: '',
      userPrompt: '',
    };
  }
  return {
    taskName: '',
    description: '',
  };
}

function makeNodeConfig(id, type, label, description) {
  let flowType = 'task';
  let hasAiIcon = false;
  let titlePlaceholder = 'Enter name';
  let descriptionPlaceholder = 'Enter description';

  if (type === 'trigger') {
    flowType = 'trigger';
    titlePlaceholder = 'Enter trigger name';
  } else if (type === 'branch') {
    flowType = 'branch';
    titlePlaceholder = 'Enter branch name';
  } else if (type === 'delay') {
    flowType = 'delay';
  } else if (type === 'parallel') {
    flowType = 'parallel';
  } else if (type === 'loop') {
    flowType = 'loop';
  } else if (type === 'task') {
    flowType = 'task';
    hasAiIcon = label === 'Custom';
    titlePlaceholder = 'Enter task name';
  }

  return {
    id,
    flowType,
    data: {
      title: '',
      headerLabel: type === 'trigger' && label === 'Schedule-based' ? 'Schedule-based trigger' : undefined,
      subtype: label,
      stepNumber: null,
      description,
      subtitle: '',
      titlePlaceholder,
      descriptionPlaceholder,
      hasAiIcon,
      hasToggle: true,
      toggleEnabled: true,
    },
  };
}

function deriveNodeTitle(details) {
  if (!details) return undefined;
  return (
    details.triggerName ||
    details.taskName ||
    details.nodeName ||
    details.name ||
    details.branchName ||
    undefined
  );
}

function deriveNodeData(itemData, details) {
  const derivedTitle = deriveNodeTitle(details);
  const derivedSubtitle = details?.description;
  return {
    ...itemData,
    title: derivedTitle || itemData?.title,
    subtitle: derivedSubtitle || itemData?.subtitle,
  };
}

const NODE_BASE_HEIGHT = 132;
const NODE_LINE_HEIGHT = 18;
const NODE_CHARS_PER_LINE = 56;
const NODE_GAP = 110;
const NODE_MIN_SPACING = 250;

function estimateDescriptionLines(text) {
  if (!text) return 1;
  return String(text).split('\n').reduce((sum, line) => {
    return sum + Math.max(1, Math.ceil(line.length / NODE_CHARS_PER_LINE));
  }, 0);
}

function nodeSpacing(itemData, details) {
  if (itemData?.flowType === 'branch' || itemData?.subtype === 'Schedule-based') {
    return NODE_MIN_SPACING;
  }
  const description = details?.description || itemData?.subtitle || '';
  const lines = estimateDescriptionLines(description);
  const height = NODE_BASE_HEIGHT + lines * NODE_LINE_HEIGHT;
  return Math.max(NODE_MIN_SPACING, height + NODE_GAP);
}

function buildFlow(nodeList, startData, nodeDetails = {}) {
  let y = 0;
  const nodes = [];
  const edges = [];

  nodes.push({
    id: START_NODE_ID,
    type: 'start',
    position: { x: 0, y },
    data: { title: startData.title, subtitle: startData.subtitle },
  });
  y += 150;

  nodeList.forEach((item, i) => {
    const nodeId = item.id;
    const prevId = i === 0 ? START_NODE_ID : nodeList[i - 1].id;
    nodes.push({
      id: nodeId,
      type: item.flowType,
      position: { x: 0, y },
      data: item.flowType === 'branch'
        ? {
            ...item.data,
            title: 'Based on conditions',
            subtitle: 'Build condition-specific flows',
          }
        : item.data?.subtype === 'Schedule-based'
          ? {
              ...item.data,
              headerLabel: 'Schedule-based trigger',
              title: nodeDetails[nodeId]?.triggerName ?? item.data.title,
              subtitle: nodeDetails[nodeId]?.description ?? item.data.subtitle,
            }
          : deriveNodeData(item.data, nodeDetails[nodeId]),
    });
    edges.push({
      id: `e-${prevId}-${nodeId}`,
      source: prevId,
      target: nodeId,
      type: 'addButton',
    });

    if (item.flowType === 'branch') {
      const branches = nodeDetails[nodeId]?.branches || [];
      const spacing = 480;
      const startX = -((branches.length - 1) * spacing) / 2;
      const branchChipY = y + 150;
      const branchNodeStartY = y + 260;
      let maxBranchEndY = branchNodeStartY;
      branches.forEach((branch, bi) => {
        const branchX = startX + bi * spacing;
        const branchNodes = nodeDetails[branch.id]?.nodes || [];
        nodes.push({
          id: branch.id,
          type: 'branchPath',
          position: { x: branchX, y: branchChipY },
          data: { label: branch.name, parentId: nodeId, isFallback: !!branch.isFallback },
        });
        edges.push({
          id: `e-${nodeId}-${branch.id}`,
          source: nodeId,
          target: branch.id,
          type: 'branchFan',
        });

        let previousId = branch.id;
        let childY = branchNodeStartY;
        branchNodes.forEach((childNode) => {
          const childData = deriveNodeData(childNode.data, nodeDetails[childNode.id]);
          nodes.push({
            id: childNode.id,
            type: childNode.flowType,
            position: { x: branchX, y: childY },
            data: { ...childData, stepNumber: childNode.data?.stepNumber ?? null },
          });
          edges.push({
            id: `e-${previousId}-${childNode.id}`,
            source: previousId,
            target: childNode.id,
            type: 'addButton',
            data: {
              branchPathId: branch.id,
              afterNodeId: previousId === branch.id ? null : previousId,
            },
          });
          previousId = childNode.id;
          childY += nodeSpacing({ flowType: childNode.flowType, subtype: childNode.data?.subtype, subtitle: childNode.data?.subtitle }, nodeDetails[childNode.id]);
        });

        const branchEndId = `${branch.id}-end`;
        nodes.push({
          id: branchEndId,
          type: 'branchEnd',
          position: { x: branchX, y: childY },
          data: { parentId: branch.id },
        });
        maxBranchEndY = Math.max(maxBranchEndY, childY);
        edges.push({
          id: `e-${previousId}-${branchEndId}`,
          source: previousId,
          target: branchEndId,
          type: 'addButton',
          data: {
            branchPathId: branch.id,
            afterNodeId: previousId === branch.id ? null : previousId,
            viewOnly: !!branch.isFallback,
          },
        });
      });
      y = maxBranchEndY + 140;
    }

    y += nodeSpacing({ flowType: item.flowType, subtype: item.data?.subtype, subtitle: item.data?.subtitle }, nodeDetails[nodeId]);
  });

  const lastId = nodeList.length > 0 ? nodeList[nodeList.length - 1].id : START_NODE_ID;
  if (!nodeList.length || nodeList[nodeList.length - 1].flowType !== 'branch') {
    nodes.push({
      id: END_NODE_ID,
      type: 'end',
      position: { x: 0, y },
      data: {},
    });
    edges.push({
      id: `e-${lastId}-${END_NODE_ID}`,
      source: lastId,
      target: END_NODE_ID,
      type: 'addButton',
    });
  }

  return { nodes, edges };
}

let nodeIdCounter = 0;
function nextId() {
  nodeIdCounter += 1;
  return `node-${nodeIdCounter}`;
}

export default function AgentBuilder({
  agentId: propAgentId,
  appTitle,
  pageTitle = 'Review response agent 1',
  activeNavId = 'reviews',
  moduleContext = 'reviews',
  sectionContext = '',
  templateId,
  templateSource,
  initialStatus = 'Draft',
  initialDescription = '',
  initialNodes = null,
  initialNodeDetails = null,
  onSaveAgent,
  onSaveTemplate,
  onClose,
  viewOnly = false,
}) {
  /* ─── URL-based slug params ─── */
  const { moduleSlug: urlModuleSlug, agentSlug: urlAgentSlug } = useParams() || {};

  const [agentId, setAgentId] = useState(() => propAgentId || crypto.randomUUID());
  const [agentModuleSlug, setAgentModuleSlug] = useState(urlModuleSlug || moduleContext);
  const [agentSlug, setAgentSlug] = useState(urlAgentSlug || '');
  const [derivedAppTitle, setDerivedAppTitle] = useState(appTitle || getModuleNav(moduleContext).title);

  /* ─── Loading / not-found state for URL-based loading ─── */
  const [isLoadingFromSlug, setIsLoadingFromSlug] = useState(!viewOnly && !!urlAgentSlug && !!urlModuleSlug);
  const [agentNotFound, setAgentNotFound] = useState(false);
  const [navId, setNavId] = useState(activeNavId);
  const [nodeList, setNodeList] = useState(() => initialNodes || []);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [nodeDetails, setNodeDetails] = useState(() => {
    const base = initialNodeDetails || {};
    const startNode = base[START_NODE_ID];
    const pageTitleStr = (typeof pageTitle === 'string' ? pageTitle : '') || '';
    if (!startNode || !startNode.agentName) {
      return {
        ...base,
        [START_NODE_ID]: {
          goals: '',
          outcomes: '',
          locations: [],
          ...(startNode || {}),
          agentName: startNode?.agentName || pageTitleStr,
        },
      };
    }
    return base;
  });
  const [agentStatus, setAgentStatus] = useState(initialStatus || 'Draft');

  /* ─── Load agent from URL slugs — re-runs whenever the URL params change ─── */
  useEffect(() => {
    if (viewOnly || !urlAgentSlug || !urlModuleSlug) return;

    function applyAgent(agent) {
      setAgentId(agent.id);
      setAgentModuleSlug(agent.moduleSlug || urlModuleSlug);
      setAgentSlug(agent.agentSlug || urlAgentSlug);
      setDerivedAppTitle(getModuleNav(agent.moduleContext || urlModuleSlug).title);
      setNodeList(agent.nodes || []);
      setNodeDetails(() => {
        const base = agent.nodeDetails || {};
        const startNode = base[START_NODE_ID];
        return {
          ...base,
          [START_NODE_ID]: {
            goals: '', outcomes: '', locations: [],
            ...(startNode || {}),
            agentName: startNode?.agentName || agent.name || '',
          },
        };
      });
      setAgentStatus(agent.status || 'Draft');
      setSelectedNodeId(null);
      setDrawerOpen(false);
    }

    // Check cache first — instant load, no spinner
    const cached = getCachedAgent(urlAgentSlug, urlModuleSlug);
    if (cached) {
      setAgentNotFound(false);
      applyAgent(cached);
      setIsLoadingFromSlug(false);
      return;
    }

    // Cache miss — fetch from Firestore
    setAgentNotFound(false);
    setIsLoadingFromSlug(true);
    getAgentBySlug(urlModuleSlug, urlAgentSlug)
      .then((agent) => {
        if (!agent) { setAgentNotFound(true); return; }
        applyAgent(agent);
      })
      .catch(() => setAgentNotFound(true))
      .finally(() => setIsLoadingFromSlug(false));
  }, [urlAgentSlug, urlModuleSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Share modal ─── */
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const handleShare = useCallback(async () => {
    setHeaderMenuOpen(false);
    clearTimeout(saveTimerRef.current);
    const { agentId: id, agentName: name, agentDesc: desc, moduleContext: mod, sectionContext: sec, agentStatus: status, nodeList: nodes, nodeDetails: details, moduleSlug: msSlug, agentSlug: asSlug } = latestRef.current;
    await saveAgent(id, { id, name: name || 'Untitled agent', description: desc, status, moduleContext: mod, sectionContext: sec, moduleSlug: msSlug, agentSlug: asSlug, nodes, nodeDetails: details });
    setShareModalOpen(true);
  }, []);

  /* ─── Header three-dots menu ─── */
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef(null);
  useEffect(() => {
    if (!headerMenuOpen) return;
    const handler = (e) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target)) {
        setHeaderMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [headerMenuOpen]);
  /* ─── Agent name is derived from nodeDetails (single source of truth) ─── */
  const agentName = nodeDetails[START_NODE_ID]?.agentName || (typeof pageTitle === 'string' ? pageTitle : '') || '';
  const [agentDesc] = useState(initialDescription || '');
  const isTemplateMode = !!templateId && initialStatus !== 'Running';

  /* ─── Always-fresh ref so publish never reads stale closure values ─── */
  const latestRef = useRef({});
  useEffect(() => {
    latestRef.current = { agentId, agentName, agentDesc, moduleContext: agentModuleSlug || moduleContext, sectionContext, agentStatus, nodeList, nodeDetails, templateId, templateSource, moduleSlug: agentModuleSlug, agentSlug };
  }, [agentId, agentName, agentDesc, moduleContext, sectionContext, agentStatus, nodeList, nodeDetails, templateId, templateSource, agentModuleSlug, agentSlug]);

  /* ─── Auto-save to Firestore (debounced 1.5 s) ─── */
  const saveTimerRef = useRef(null);
  useEffect(() => {
    clearTimeout(saveTimerRef.current);
    if (!agentId || !agentName || viewOnly || isTemplateMode) return;
    saveTimerRef.current = setTimeout(() => {
      const { agentId: id, agentName: name, agentDesc: desc, moduleContext: mod, sectionContext: sec, agentStatus: status, nodeList: nodes, nodeDetails: details, moduleSlug: msSlug, agentSlug: asSlug } = latestRef.current;
      saveAgent(id, { id, name, description: desc, status, moduleContext: mod, sectionContext: sec, moduleSlug: msSlug, agentSlug: asSlug, nodes, nodeDetails: details });
    }, 1500);
    return () => clearTimeout(saveTimerRef.current);
  }, [agentName, nodeList, nodeDetails, agentId, moduleContext, sectionContext, agentStatus, isTemplateMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildTemplatePayload = useCallback(() => {
    const { agentName: name, agentDesc: desc, moduleContext: mod, sectionContext: sec, nodeList: nodes, nodeDetails: details, templateSource: source } = latestRef.current;
    const finalName = (name || details?.[START_NODE_ID]?.agentName || '').trim();
    if (!finalName) return null;
    return {
      id: templateId,
      title: finalName,
      description: (desc || initialDescription || '').trim(),
      moduleContext: mod,
      sectionContext: sec,
      source: source || 'custom',
      nodes,
      nodeDetails: details,
    };
  }, [initialDescription, templateId]);

  const buildAgentPayload = useCallback((status = 'Running') => {
    const { agentId: id, agentName: name, agentDesc: desc, moduleContext: mod, sectionContext: sec, nodeList: nodes, nodeDetails: details, moduleSlug: msSlug, agentSlug: asSlug } = latestRef.current;
    const finalName = (name || details?.[START_NODE_ID]?.agentName || '').trim();
    if (!finalName) return null;
    return {
      id,
      name: finalName,
      description: (desc || '').trim(),
      status,
      moduleContext: mod,
      sectionContext: sec,
      moduleSlug: msSlug,
      agentSlug: asSlug,
      templateId,
      nodes,
      nodeDetails: details,
    };
  }, [templateId]);

  const handleSaveTemplate = useCallback(async () => {
    clearTimeout(saveTimerRef.current);
    const payload = buildTemplatePayload();
    if (!payload) return;
    try {
      await onSaveTemplate?.(payload);
      onClose?.();
    } catch (e) {
      console.error('Template save failed', e);
    }
  }, [buildTemplatePayload, onClose, onSaveTemplate]);

  const handlePublish = useCallback(async () => {
    clearTimeout(saveTimerRef.current);
    const payload = buildAgentPayload('Running');
    if (!payload) return;
    try {
      await saveAgent(payload.id, payload);
      setAgentStatus('Running');
    } catch (e) {
      console.error('Publish failed', e);
    }
    onSaveAgent?.(true, payload);
  }, [buildAgentPayload, onSaveAgent]);

  const handleSaveAndPublish = useCallback(async () => {
    clearTimeout(saveTimerRef.current);
    const templatePayload = buildTemplatePayload();
    const agentPayload = buildAgentPayload('Running');
    if (!templatePayload || !agentPayload) return;
    try {
      await onSaveTemplate?.(templatePayload);
      await saveAgent(agentPayload.id, agentPayload);
      setAgentStatus('Running');
    } catch (e) {
      console.error('Save and publish failed', e);
      return;
    }
    onSaveAgent?.(true, agentPayload);
  }, [buildAgentPayload, buildTemplatePayload, onSaveAgent, onSaveTemplate]);

  /* ─── Download handler ─── */
  const handleExport = useCallback(() => {
    const payload = {
      name: agentName,
      description: agentDesc,
      moduleContext,
      exportedAt: new Date().toISOString(),
      nodes: nodeList,
      nodeDetails,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agentName.replace(/\s+/g, '-').toLowerCase() || 'agent'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [agentName, agentDesc, moduleContext, nodeList, nodeDetails]);

  /* ─── Live node sync: RHS → canvas ─── */
  const handleNodeFieldChange = useCallback((nodeId, field, value) => {
    setNodeDetails((prev) => {
      const nodeDet = prev[nodeId] || {};
      const updated = { ...prev, [nodeId]: { ...nodeDet, [field]: value } };
      // When a branch path's name changes, sync it into the parent's branches array
      // so buildFlow picks up the new label for the canvas chip
      if (field === 'branchName' && nodeDet.isBranchPath && nodeDet.parentId) {
        const parentId = nodeDet.parentId;
        const parentDet = prev[parentId] || {};
        updated[parentId] = {
          ...parentDet,
          branches: (parentDet.branches || []).map((b) =>
            b.id === nodeId ? { ...b, name: value } : b
          ),
        };
      }
      if (field === 'branches') {
        value.forEach((branch) => {
          if (!updated[branch.id]) {
            updated[branch.id] = {
              branchName: branch.name,
              description: '',
              conditions: [],
              parentId: nodeId,
              isBranchPath: true,
              isFallback: !!branch.isFallback,
              nodes: [],
            };
          } else {
            updated[branch.id] = {
              ...updated[branch.id],
              branchName: branch.name,
              parentId: nodeId,
              isBranchPath: true,
              isFallback: !!branch.isFallback,
            };
          }
        });
      }
      Object.entries(updated).forEach(([key, details]) => {
        if (!details?.nodes) return;
        updated[key] = {
          ...details,
          nodes: details.nodes.map((node) => {
            if (node.id !== nodeId) return node;
            const nodeUpdates = {};
            if (['triggerName', 'taskName', 'name', 'nodeName', 'branchName'].includes(field)) {
              nodeUpdates.title = value;
            }
            if (field === 'description') nodeUpdates.subtitle = value;
            return { ...node, data: { ...node.data, ...nodeUpdates } };
          }),
        };
      });
      return updated;
    });
    // Mirror name/description changes into the canvas node body
    setNodeList((prev) =>
      prev.map((n) => {
        if (n.id !== nodeId) return n;
        const updates = {};
        if (['triggerName', 'taskName', 'name', 'nodeName', 'branchName'].includes(field)) {
          updates.title = value;
        }
        if (field === 'description') updates.subtitle = value;
        return { ...n, data: { ...n.data, ...updates } };
      })
    );
  }, []);

  /* ─── Node management ─── */

  const handleDeleteNode = useCallback((nodeId) => {
    setNodeList((prev) => {
      const updated = prev.filter((n) => n.id !== nodeId);
      return updated.map((n, i) => ({
        ...n,
        data: { ...n.data, stepNumber: i + 1 },
      }));
    });
    setNodeDetails((prev) => {
      const copy = { ...prev };
      Object.values(copy).forEach((details) => {
        if (details?.nodes) {
          details.nodes = details.nodes.filter((node) => node.id !== nodeId);
        }
      });
      Object.keys(copy).forEach((key) => {
        if (key === nodeId || copy[key]?.parentId === nodeId) {
          delete copy[key];
        }
      });
      return copy;
    });
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
      setDrawerOpen(false);
    }
  }, [selectedNodeId]);

  const handleAddBranchPath = useCallback((branchNodeId) => {
    const newPathId = `${branchNodeId}-path-${Date.now()}`;
    setNodeDetails((prev) => {
      const nodeD = prev[branchNodeId] || {};
      const existing = nodeD.branches || [];
      const nonFallback = existing.filter((b) => !b.isFallback);
      const fallback = existing.filter((b) => b.isFallback);
      const pathNumber = nonFallback.length + 1;
      const newPath = { id: newPathId, name: `Branch ${pathNumber}` };
      return {
        ...prev,
        [branchNodeId]: {
          ...nodeD,
          branches: [...nonFallback, newPath, ...fallback],
        },
        [newPathId]: {
          branchName: newPath.name,
          description: '',
          conditions: [],
          parentId: branchNodeId,
          isBranchPath: true,
        },
      };
    });
  }, []);

  const handleDeleteBranchPath = useCallback((branchPathId) => {
    setNodeDetails((prev) => {
      const copy = { ...prev };
      const parentId = copy[branchPathId]?.parentId;
      if (parentId) {
        copy[parentId] = {
          ...copy[parentId],
          branches: (copy[parentId]?.branches || []).filter((b) => b.id !== branchPathId),
        };
      }
      const childNodes = copy[branchPathId]?.nodes || [];
      childNodes.forEach((node) => { delete copy[node.id]; });
      delete copy[branchPathId];
      return copy;
    });
    if (selectedNodeId === branchPathId) {
      setSelectedNodeId(null);
      setDrawerOpen(false);
    }
  }, [selectedNodeId]);

  const startAgentName = nodeDetails[START_NODE_ID]?.agentName || pageTitle;
  const startData = { title: startAgentName, subtitle: 'All locations' };
  const { nodes: rawNodes, edges } = buildFlow(nodeList, startData, nodeDetails);

  const nodes = rawNodes.map((n) => {
    if (n.id === START_NODE_ID || n.id === END_NODE_ID) return n;
    if (n.type === 'branchPath') {
      return { ...n, data: { ...n.data, onDelete: () => handleDeleteBranchPath(n.id) } };
    }
    if (n.type === 'branchEnd') return n;
    const extra = { onDelete: () => handleDeleteNode(n.id) };
    if (n.type === 'branch') extra.onAddBranch = () => handleAddBranchPath(n.id);
    return { ...n, data: { ...n.data, ...extra } };
  });

  const branchChildNodes = Object.values(nodeDetails).flatMap((details) => details?.nodes || []);
  const selectedNode = nodeList.find((n) => n.id === selectedNodeId) ||
    branchChildNodes.find((n) => n.id === selectedNodeId);

  const handleNodesReorder = useCallback((newIdOrder) => {
    setNodeList((prev) => {
      const byId = Object.fromEntries(prev.map((n) => [n.id, n]));
      const reordered = newIdOrder.map((id) => byId[id]).filter(Boolean);
      return reordered.map((n, i) => ({ ...n, data: { ...n.data, stepNumber: i + 1 } }));
    });
  }, []);

  const handleDropNode = useCallback(({ type, label, description, afterNodeId, branchPathId }) => {
    const id = nextId();
    const newNode = makeNodeConfig(id, type, label, description);
    const details = makeNodeDetails(type, label);

    if (branchPathId) {
      setNodeDetails((prev) => {
        const branchPath = prev[branchPathId] || {};
        const existingNodes = branchPath.nodes || [];
        const index = afterNodeId ? existingNodes.findIndex((node) => node.id === afterNodeId) : -1;
        const nextNodes = index !== -1
          ? [...existingNodes.slice(0, index + 1), newNode, ...existingNodes.slice(index + 1)]
          : [newNode, ...existingNodes];
        return {
          ...prev,
          [branchPathId]: {
            ...branchPath,
            nodes: nextNodes.map((node, i) => ({
              ...node,
              data: { ...node.data, stepNumber: i + 1 },
            })),
          },
          [id]: details,
        };
      });
      return;
    }

    setNodeList((prev) => {
      let updated;
      if (afterNodeId) {
        const idx = prev.findIndex((n) => n.id === afterNodeId);
        updated = idx !== -1
          ? [...prev.slice(0, idx + 1), newNode, ...prev.slice(idx + 1)]
          : [...prev, newNode];
      } else {
        updated = [...prev, newNode];
      }
      return updated.map((n, i) => ({ ...n, data: { ...n.data, stepNumber: i + 1 } }));
    });

    let extraDetails = {};

    if (type === 'branch') {
      const path1Id = `${id}-path-1`;
      const path2Id = `${id}-path-2`;
      const fallbackId = `${id}-path-fallback`;
      Object.assign(details, {
        basedOn: 'conditions',
        branches: [
          { id: path1Id, name: 'Branch 1' },
          { id: path2Id, name: 'Branch 2' },
          { id: fallbackId, name: 'No conditions met', isFallback: true },
        ],
      });
      extraDetails = {
        [path1Id]: { branchName: 'Branch 1', description: '', conditions: [], parentId: id, isBranchPath: true, nodes: [] },
        [path2Id]: { branchName: 'Branch 2', description: '', conditions: [], parentId: id, isBranchPath: true, nodes: [] },
        [fallbackId]: { branchName: 'No conditions met', description: '', conditions: [], parentId: id, isBranchPath: true, isFallback: true, nodes: [] },
      };
    }

    setNodeDetails((prev) => ({
      ...prev,
      [id]: details,
      ...extraDetails,
    }));
  }, []);

  const handleNodeClick = useCallback((node) => {
    if (node.type === 'end' || node.type === 'branchEnd') return;
    setSelectedNodeId(node.id);
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedNodeId(null);
  }, []);

  const currentDetails = selectedNodeId ? (nodeDetails[selectedNodeId] || {}) : {};

  /* ─── Shared onFieldChange for the active node ─── */
  const activeFieldChange = useCallback(
    (field, value) => handleNodeFieldChange(selectedNodeId, field, value),
    [selectedNodeId, handleNodeFieldChange]
  );

  const renderRHSPanel = () => {
    if (!selectedNodeId) return null;

    if (selectedNodeId === START_NODE_ID) {
      const startDetails = nodeDetails[START_NODE_ID] || {
        agentName: pageTitle,
        goals: 'Respond to customer reviews promptly and professionally, maintaining brand voice and addressing specific customer feedback.',
        outcomes: 'Improved customer satisfaction scores, faster response times, and consistent brand messaging across all review platforms.',
        locations: [],
      };
      return (
        <RHS
          variant="agentDetails"
          title="Agent details"
          viewOnly={viewOnly}
          bodyProps={{
            values: startDetails,
            onChange: (field, value) => {
              setNodeDetails((prev) => ({
                ...prev,
                [START_NODE_ID]: { ...(prev[START_NODE_ID] || startDetails), [field]: value },
              }));
            },
          }}
          onClose={handleCloseDrawer}
          onSave={handleCloseDrawer}
        />
      );
    }

    if (currentDetails.isBranchPath) {
      return (
        <RHS
          variant="branch"
          title="Branch"
          viewOnly={viewOnly}
          bodyProps={{ initialValues: currentDetails, onFieldChange: activeFieldChange }}
          onClose={handleCloseDrawer}
          onSave={handleCloseDrawer}
        />
      );
    }

    if (!selectedNode) return null;
    const { flowType, data } = selectedNode;

    if (flowType === 'trigger' && data.subtype === 'Schedule-based') {
      return (
        <ScheduleBased
          onClose={handleCloseDrawer}
          onSave={(values) => {
            setNodeDetails((prev) => ({
              ...prev,
              [selectedNodeId]: { ...(prev[selectedNodeId] || {}), ...values },
            }));
            handleCloseDrawer();
          }}
          onPreview={() => {}}
          onExpand={() => {}}
          triggerName={currentDetails.triggerName ?? ''}
          description={currentDetails.description ?? ''}
          onFieldChange={activeFieldChange}
          frequencyOptions={['Hourly', 'Daily', 'Weekly', 'Monthly']}
          dayOptions={['1 day', '2 days', '3 days', '7 days', '14 days', '30 days']}
          timeOptions={['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM']}
          defaultFrequency={currentDetails.frequency || 'Daily'}
          defaultDay={currentDetails.day || '7 days'}
          defaultTime={currentDetails.time || '9:00 AM'}
        />
      );
    }

    if (flowType === 'trigger') {
      return (
        <RHS
          variant="entityTrigger"
          title="Trigger"
          viewOnly={viewOnly}
          bodyProps={{ initialValues: currentDetails, onFieldChange: activeFieldChange }}
          onClose={handleCloseDrawer}
          onSave={handleCloseDrawer}
        />
      );
    }

    if (flowType === 'branch') {
      return (
        <RHS
          variant="controlBranch"
          title="Branch details"
          viewOnly={viewOnly}
          bodyProps={{
            initialValues: { ...currentDetails, branchNodeId: selectedNodeId },
            onFieldChange: activeFieldChange,
            onDeleteBranch: (branchId) => handleDeleteBranchPath(branchId),
          }}
          onClose={handleCloseDrawer}
          onSave={handleCloseDrawer}
        />
      );
    }

    if (flowType === 'delay') {
      return (
        <RHS
          variant="delay"
          title="Delay"
          viewOnly={viewOnly}
          bodyProps={{ initialValues: currentDetails, onFieldChange: activeFieldChange }}
          onClose={handleCloseDrawer}
          onSave={handleCloseDrawer}
        />
      );
    }

    if (flowType === 'parallel') {
      return (
        <RHS
          variant="parallel"
          title="Parallel tasks"
          viewOnly={viewOnly}
          bodyProps={{ initialValues: currentDetails, onFieldChange: activeFieldChange }}
          onClose={handleCloseDrawer}
          onSave={handleCloseDrawer}
        />
      );
    }

    if (flowType === 'loop') {
      return (
        <RHS
          variant="loop"
          title="Loop"
          viewOnly={viewOnly}
          bodyProps={{ initialValues: currentDetails, onFieldChange: activeFieldChange }}
          onClose={handleCloseDrawer}
          onSave={handleCloseDrawer}
        />
      );
    }

    if (data.hasAiIcon) {
      return (
        <RHS
          variant="llmTask"
          title="LLM Task"
          viewOnly={viewOnly}
          bodyProps={{ initialValues: currentDetails, onFieldChange: activeFieldChange }}
          onClose={handleCloseDrawer}
          onSave={handleCloseDrawer}
        />
      );
    }

    return (
      <RHS
        variant="entityTask"
        title="Task"
        viewOnly={viewOnly}
        bodyProps={{ initialValues: currentDetails, onFieldChange: activeFieldChange }}
        onClose={handleCloseDrawer}
        onSave={handleCloseDrawer}
      />
    );
  };

  /* ─── Header actions: Publish + three-dots menu (or view-only badge) ─── */
  const headerActions = viewOnly ? (
    <div className="ab-view-badge">
      <span className="material-symbols-outlined">visibility</span>
      View only
    </div>
  ) : (
    <div className="ab-header-actions">
      <Button
        theme="primary"
        label={isTemplateMode ? 'Save template' : 'Publish'}
        onClick={isTemplateMode ? handleSaveTemplate : handlePublish}
      />
      <div className="ab-header-more" ref={headerMenuRef}>
        <button
          className="ab-header-more-btn"
          type="button"
          onClick={() => setHeaderMenuOpen((m) => !m)}
          title="More options"
        >
          <span className="material-symbols-outlined">more_vert</span>
        </button>
        {headerMenuOpen && (
          <div className="ab-header-menu">
            {isTemplateMode && (
              <button
                className="ab-header-menu-item"
                type="button"
                onClick={() => { setHeaderMenuOpen(false); handleSaveAndPublish(); }}
              >
                <span className="material-symbols-outlined">rocket_launch</span>
                Save and publish
              </button>
            )}
            <button
              className="ab-header-menu-item"
              type="button"
              onClick={handleShare}
            >
              <span className="material-symbols-outlined">share</span>
              Share
            </button>
            <button
              className="ab-header-menu-item"
              type="button"
              onClick={() => { setHeaderMenuOpen(false); handleExport(); }}
            >
              <span className="material-symbols-outlined">download</span>
              Download
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const editableName = viewOnly ? agentName : (
    <input
      className="ab-name-input"
      value={agentName}
      placeholder="Untitled agent"
      onChange={(e) => {
        const val = e.target.value;
        setNodeDetails((prev) => ({
          ...prev,
          [START_NODE_ID]: { ...(prev[START_NODE_ID] || {}), agentName: val },
        }));
      }}
      onClick={(e) => e.stopPropagation()}
    />
  );

  /* ─── Loading / not-found guards ─── */
  if (isLoadingFromSlug) {
    return (
      <div className="ab-loading">
        <div className="ab-spinner" />
        <span>Loading agent…</span>
      </div>
    );
  }

  if (agentNotFound) {
    return (
      <div className="ab-not-found">
        <EmptyStates title="Agent not found" description="This link is no longer valid or the agent has been deleted." />
      </div>
    );
  }

  return (
    <AppShell
      appTitle={derivedAppTitle}
      pageTitle={editableName}
      activeNavId={navId}
      onNavChange={viewOnly ? undefined : setNavId}
      showBack={!!onClose}
      onBack={onClose}
      pageActions={headerActions}
    >
      <div className="agent-builder-wrapper">
        {viewOnly && (
          <div className="ab-view-banner">
            <span className="material-symbols-outlined">visibility</span>
            <span>You&apos;re viewing a shared workflow. Editing is disabled.</span>
            <a
              className="ab-view-banner__link"
              href={`mailto:?subject=Request edit access – ${agentName}`}
            >
              Request edit access
            </a>
          </div>
        )}

        <div className="agent-builder">
          <div className="agent-builder__lhs">
            <LHSDrawer defaultTab="Create manually" triggerOpen tasksOpen={false} controlsOpen={false} viewOnly={viewOnly} />
          </div>

          <div className={`agent-builder__canvas${drawerOpen ? ' agent-builder__canvas--with-rhs' : ''}`}>
            <FlowCanvas
              nodes={nodes}
              edges={edges}
              onNodeClick={handleNodeClick}
              onDropNode={viewOnly ? undefined : handleDropNode}
              onNodesReorder={viewOnly ? undefined : handleNodesReorder}
              selectedNodeId={selectedNodeId}
              orientation="vertical"
              viewOnly={viewOnly}
            />
          </div>

          {drawerOpen && (
            <div key={selectedNodeId} className="agent-builder__rhs">
              {renderRHSPanel()}
            </div>
          )}
        </div>
      </div>

      {/* ─── Share modal ─── */}
      {shareModalOpen && (
        <ShareModal
          shareUrl={agentSlug && agentModuleSlug
            ? `${window.location.origin}/view/${agentModuleSlug}/${agentSlug}`
            : `${window.location.origin}/view/${agentId}`}
          onClose={() => setShareModalOpen(false)}
        />
      )}

    </AppShell>
  );
}
