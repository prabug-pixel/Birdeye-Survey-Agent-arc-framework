import React, { useState, useEffect, useRef, useCallback } from 'react';
import CommonSideDrawer from '@birdeye/elemental/core/atoms/CommonSideDrawer/index.js';
import Button from '@birdeye/elemental/core/atoms/Button/index.js';
import VariableSelectionModal from '../../Modals/VariableSelectionModal/VariableSelectionModal';
import styles from './ResponseHandlerDrawer.module.css';

export default function ResponseHandlerDrawer({ isOpen, tool, onClose, onSave }) {
  const [responseText, setResponseText] = useState(tool?.responseText ?? '');
  const [responseHandling, setResponseHandling] = useState(tool?.responseHandling ?? 'direct');
  const [showVarModal, setShowVarModal] = useState(false);
  const textareaRef = useRef(null);
  const cursorPosRef = useRef(0);
  const varBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen && tool) {
      setResponseText(tool.responseText ?? '');
      setResponseHandling(tool.responseHandling ?? 'direct');
    }
  }, [isOpen, tool]);

  const handleSave = () => {
    onSave?.({ ...tool, responseText, responseHandling });
  };

  const saveCursor = () => {
    if (textareaRef.current) {
      cursorPosRef.current = textareaRef.current.selectionStart ?? responseText.length;
    }
  };

  const handleVariableSelect = useCallback((variable) => {
    const insert = `{${variable}}`;
    const pos = cursorPosRef.current;
    const before = responseText.slice(0, pos);
    const after = responseText.slice(pos);
    const newText = before + insert + after;
    setResponseText(newText);
    cursorPosRef.current = pos + insert.length;
    setShowVarModal(false);
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(cursorPosRef.current, cursorPosRef.current);
      }
    });
  }, [responseText]);

  const varBtnRect = varBtnRef.current?.getBoundingClientRect();
  const dropdownStyle = varBtnRect ? {
    position: 'fixed',
    top: varBtnRect.bottom + 4,
    left: varBtnRect.left,
  } : undefined;

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
        {/* Header — same pattern as CustomToolBuilder */}
        <div className="ctb__header">
          <div className="ctb__header-left">
            <button className="ctb__back-btn" type="button" onClick={onClose} aria-label="Back">
              <span className="material-symbols-outlined">arrow_left_alt</span>
            </button>
            <span className="ctb__header-title">Response handler</span>
          </div>
          <div className="ctb__header-actions">
            <Button theme="primary" label="Save" onClick={handleSave} />
          </div>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Response text */}
          <div className={styles.fieldGroup}>
            <span className={styles.sectionLabel}>Response text</span>
            <div className={styles.textareaWrap}>
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                name="responseText"
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                onSelect={saveCursor}
                onClick={saveCursor}
                onKeyUp={saveCursor}
                rows={6}
              />
              <button
                ref={varBtnRef}
                type="button"
                className={styles.varBtn}
                onClick={() => {
                  saveCursor();
                  setShowVarModal((v) => !v);
                }}
                title="Insert variable"
              >
                {'{x}'}
              </button>
            </div>
            {showVarModal && (
              <VariableSelectionModal
                isOpen
                onClose={() => setShowVarModal(false)}
                onVariableSelect={handleVariableSelect}
                dropdown
                dropdownStyle={dropdownStyle}
              />
            )}
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
