import React, { useState } from 'react';
import FormInput from '@birdeye/elemental/core/atoms/FormInput/index.js';
import TextArea from '@birdeye/elemental/core/atoms/TextArea/index.js';
import CustomToolBuilder from '../../Drawers/CustomToolBuilder/CustomToolBuilder.jsx';
import CustomToolViewer from '../../Drawers/CustomToolViewer/CustomToolViewer.jsx';
import ResponseHandlerDrawer from '../../Drawers/ResponseHandlerDrawer/ResponseHandlerDrawer.jsx';
import styles from './EntityTaskBody.module.css';

export default function EntityTaskBody({ initialValues = {}, onFieldChange }) {
  const [taskName, setTaskName] = useState(initialValues.taskName ?? '');
  const [description, setDescription] = useState(initialValues.description ?? '');

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingTool, setEditingTool] = useState(null);

  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewingTool, setViewingTool] = useState(null);

  const [isResponseHandlerOpen, setIsResponseHandlerOpen] = useState(false);
  const [responseHandlerTool, setResponseHandlerTool] = useState(null);

  const [customTools, setCustomTools] = useState(initialValues.customTools ?? []);

  const handleTaskName = (e) => {
    const val = e.target.value;
    setTaskName(val);
    onFieldChange?.('taskName', val);
  };

  const handleDescription = (e) => {
    const val = e.target.value;
    setDescription(val);
    onFieldChange?.('description', val);
  };

  const openCreate = () => {
    setEditingTool(null);
    setIsBuilderOpen(true);
  };

  const openViewer = (tool) => {
    if (tool.builtIn === 'response-handler') {
      setResponseHandlerTool(tool);
      setIsResponseHandlerOpen(true);
      return;
    }
    setViewingTool(tool);
    setIsViewerOpen(true);
  };

  const closeViewer = () => {
    setIsViewerOpen(false);
    setViewingTool(null);
  };

  const openEditFromViewer = (tool) => {
    setIsViewerOpen(false);
    setViewingTool(null);
    setEditingTool(tool);
    setIsBuilderOpen(true);
  };

  const openEditDirect = (tool) => {
    if (tool.builtIn === 'response-handler') {
      setResponseHandlerTool(tool);
      setIsResponseHandlerOpen(true);
      return;
    }
    setEditingTool(tool);
    setIsBuilderOpen(true);
  };

  const handleResponseHandlerSave = (updated) => {
    setCustomTools((prev) => {
      const next = prev.map((t) => (t.id === updated.id ? updated : t));
      onFieldChange?.('customTools', next);
      return next;
    });
    setIsResponseHandlerOpen(false);
    setResponseHandlerTool(null);
  };

  const handleBuilderClose = () => {
    setIsBuilderOpen(false);
    setEditingTool(null);
  };

  const handleBuilderSave = (tool) => {
    setCustomTools((prev) => {
      const idx = prev.findIndex((t) => t.id === tool.id);
      const next = idx >= 0
        ? prev.map((t) => (t.id === tool.id ? tool : t))
        : [...prev, tool];
      onFieldChange?.('customTools', next);
      return next;
    });
    setIsBuilderOpen(false);
    setEditingTool(null);
  };

  const handleDeleteTool = (id) => {
    setCustomTools((prev) => {
      const next = prev.filter((t) => t.id !== id);
      onFieldChange?.('customTools', next);
      return next;
    });
  };

  return (
    <>
      <div className={styles.formContainer}>
        <FormInput
          name="taskName"
          type="text"
          label="Task name"
          placeholder="Enter name"
          value={taskName}
          onChange={handleTaskName}
          required
        />
        <TextArea
          name="description"
          label="Description"
          placeholder="Enter description"
          value={description}
          onChange={handleDescription}
          noFloatingLabel
        />

        <div className={styles.toolsSection}>
          <div className={styles.sectionLabelWrapper}>
            <span className={styles.sectionLabelText}>Tools</span>
            <span className={`material-symbols-outlined ${styles.sectionLabelIcon}`}>info</span>
          </div>

          <div className={styles.addBox}>
            {customTools.length === 0 && (
              <button className={styles.addBtn} onClick={openCreate}>
                <span className={`material-symbols-outlined ${styles.addBtnIcon}`}>add_circle</span>
                <span className={styles.addBtnLabel}>Add</span>
              </button>
            )}

            {customTools.map((tool) => (
              <div key={tool.id} className={styles.toolRow}>
                <button
                  className={styles.toolRowMain}
                  type="button"
                  onClick={() => openViewer(tool)}
                >
                  <div className={styles.toolIconWrap}>
                    {tool.iconDataUrl ? (
                      <img src={tool.iconDataUrl} alt={tool.name} className={styles.toolIconImg} />
                    ) : (
                      <span className={`material-symbols-outlined ${styles.toolIconFallback}`}>build</span>
                    )}
                  </div>
                  <span className={styles.toolName}>{tool.name}</span>
                </button>
                <div className={styles.toolActions}>
                  <button
                    className={styles.iconBtn}
                    onClick={() => openEditDirect(tool)}
                    title="Edit tool"
                  >
                    <span className={`material-symbols-outlined ${styles.iconBtnIcon}`}>edit</span>
                  </button>
                  <button
                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                    onClick={() => handleDeleteTool(tool.id)}
                    title="Delete tool"
                  >
                    <span className={`material-symbols-outlined ${styles.iconBtnIcon}`}>delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CustomToolViewer
        isOpen={isViewerOpen}
        tool={viewingTool}
        onClose={closeViewer}
        onEditTool={openEditFromViewer}
      />

      <CustomToolBuilder
        isOpen={isBuilderOpen}
        initialTool={editingTool}
        onClose={handleBuilderClose}
        onSave={handleBuilderSave}
      />

      <ResponseHandlerDrawer
        isOpen={isResponseHandlerOpen}
        tool={responseHandlerTool}
        onClose={() => { setIsResponseHandlerOpen(false); setResponseHandlerTool(null); }}
        onSave={handleResponseHandlerSave}
      />
    </>
  );
}
