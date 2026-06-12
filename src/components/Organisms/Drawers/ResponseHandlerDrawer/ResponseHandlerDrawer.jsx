import React, { useState, useEffect } from 'react';
import CommonSideDrawer from '@birdeye/elemental/core/atoms/CommonSideDrawer/index.js';
import styles from './ResponseHandlerDrawer.module.css';

export default function ResponseHandlerDrawer({ isOpen, tool, onClose, onSave }) {
  const [responseText, setResponseText] = useState(tool?.responseText ?? '');
  const [responseHandling, setResponseHandling] = useState(tool?.responseHandling ?? 'direct');

  useEffect(() => {
    if (isOpen && tool) {
      setResponseText(tool.responseText ?? '');
      setResponseHandling(tool.responseHandling ?? 'direct');
    }
  }, [isOpen, tool]);

  const handleSave = () => {
    onSave?.({
      ...tool,
      responseText,
      responseHandling,
    });
  };

  const insertVariable = () => {
    setResponseText((prev) => prev + '{variable}');
  };

  return (
    <CommonSideDrawer
      isOpen={isOpen}
      title=""
      onClose={onClose}
      width="650px"
      shouldScroll={false}
      buttonPosition="right"
      headerRightContent={<span className={styles.drawerSuppress} />}
    >
      <div className={styles.outer}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.backBtn} type="button" onClick={onClose} aria-label="Back">
              <span className="material-symbols-outlined">arrow_left_alt</span>
            </button>
            <span className={styles.headerTitle}>Response handler</span>
          </div>
          <button className={styles.saveBtn} type="button" onClick={handleSave}>
            Save
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Response text */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Response text <span className={styles.required}>*</span>
            </label>
            <div className={styles.textareaWrap}>
              <textarea
                className={styles.textarea}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder=""
                rows={4}
              />
              <button
                type="button"
                className={styles.varBtn}
                onClick={insertVariable}
                title="Insert variable"
              >
                {'{x}'}
              </button>
            </div>
          </div>

          {/* Response handling */}
          <div className={styles.fieldGroup}>
            <span className={styles.sectionLabel}>Response handling</span>

            <label className={styles.radioRow}>
              <input
                type="radio"
                className={styles.radio}
                name="responseHandling"
                value="direct"
                checked={responseHandling === 'direct'}
                onChange={() => setResponseHandling('direct')}
              />
              <div className={styles.radioContent}>
                <span className={styles.radioTitle}>Post directly</span>
                <span className={styles.radioDesc}>
                  Responses are posted directly. For non-integrated sites, responses will show as suggestions only.
                </span>
              </div>
            </label>

            <label className={styles.radioRow}>
              <input
                type="radio"
                className={styles.radio}
                name="responseHandling"
                value="approval"
                checked={responseHandling === 'approval'}
                onChange={() => setResponseHandling('approval')}
              />
              <div className={styles.radioContent}>
                <span className={styles.radioTitle}>Post after approval</span>
                <span className={styles.radioDesc}>
                  Responses requires human approval before posting
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </CommonSideDrawer>
  );
}
