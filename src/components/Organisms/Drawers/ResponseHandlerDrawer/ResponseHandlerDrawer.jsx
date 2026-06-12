import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import CommonSideDrawer from '@birdeye/elemental/core/atoms/CommonSideDrawer/index.js';
import Button from '@birdeye/elemental/core/atoms/Button/index.js';
import VariableSelectionModal from '../../Modals/VariableSelectionModal/VariableSelectionModal';
import { DataTypeIcon } from '../../../Molecules/Inputs/VariableChip/VariableChip';
import styles from './ResponseHandlerDrawer.module.css';

let _uid = 0;
const uid = () => `seg${++_uid}`;

function parseSegments(str) {
  if (!str) return [{ id: uid(), type: 'text', value: '' }];
  const result = [];
  const re = /\{([^}]+)\}/g;
  let cursor = 0, m;
  while ((m = re.exec(str)) !== null) {
    if (m.index > cursor) result.push({ id: uid(), type: 'text', value: str.slice(cursor, m.index) });
    result.push({ id: uid(), type: 'variable', value: m[1] });
    cursor = m.index + m[0].length;
  }
  if (cursor < str.length) result.push({ id: uid(), type: 'text', value: str.slice(cursor) });
  if (!result.length || result[result.length - 1].type === 'variable') {
    result.push({ id: uid(), type: 'text', value: '' });
  }
  return result;
}

/* Memoized text span — content lives in DOM, React only sets it on mount */
const TextSeg = memo(function TextSeg({ segId, initialText, spanRefs, onFocus, onKeyDown }) {
  return (
    <span
      ref={(el) => {
        spanRefs.current[segId] = el;
        if (el && el.textContent === '' && initialText) {
          el.textContent = initialText;
        }
      }}
      contentEditable
      suppressContentEditableWarning
      className={styles.textSeg}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      data-seg-id={segId}
    />
  );
});

function VarTag({ value, onDelete }) {
  return (
    <span className={styles.varTag}>
      <span className={styles.varTagSwatch}>
        <DataTypeIcon />
      </span>
      <span className={styles.varTagLabel}>{value}</span>
      <button
        type="button"
        className={styles.varTagDelete}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onDelete}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>close</span>
      </button>
    </span>
  );
}

export default function ResponseHandlerDrawer({ isOpen, tool, onClose, onSave }) {
  const [segments, setSegments] = useState(() => parseSegments(tool?.responseText ?? ''));
  const [responseHandling, setResponseHandling] = useState(tool?.responseHandling ?? 'direct');
  const [showVarModal, setShowVarModal] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const activeSegIdxRef = useRef(0);
  const spanRefs = useRef({});

  useEffect(() => {
    if (isOpen && tool) {
      spanRefs.current = {};
      setSegments(parseSegments(tool.responseText ?? ''));
      setResponseHandling(tool.responseHandling ?? 'direct');
      setEditorKey((k) => k + 1);
      activeSegIdxRef.current = 0;
    }
  }, [isOpen, tool]);

  const serialize = useCallback(() => {
    return segments.map((s) =>
      s.type === 'variable' ? `{${s.value}}` : (spanRefs.current[s.id]?.textContent ?? s.value)
    ).join('');
  }, [segments]);

  const handleSave = () => {
    onSave?.({ ...tool, responseText: serialize(), responseHandling });
  };

  const focusSegEnd = useCallback((segId) => {
    requestAnimationFrame(() => {
      const el = spanRefs.current[segId];
      if (!el) return;
      el.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(el);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    });
  }, []);

  const removeVariable = useCallback((varIdx) => {
    setSegments((prev) => {
      const next = [...prev];
      const before = varIdx > 0 && next[varIdx - 1]?.type === 'text' ? next[varIdx - 1] : null;
      const after = varIdx < next.length - 1 && next[varIdx + 1]?.type === 'text' ? next[varIdx + 1] : null;
      let focusId;
      if (before && after) {
        const merged = {
          id: uid(),
          type: 'text',
          value: (spanRefs.current[before.id]?.textContent ?? before.value) + (spanRefs.current[after.id]?.textContent ?? after.value),
        };
        next.splice(varIdx - 1, 3, merged);
        activeSegIdxRef.current = varIdx - 1;
        focusId = merged.id;
      } else {
        next.splice(varIdx, 1);
        const newIdx = Math.max(0, varIdx - 1);
        activeSegIdxRef.current = newIdx;
        focusId = next[newIdx]?.id;
      }
      if (focusId) focusSegEnd(focusId);
      return next;
    });
  }, [focusSegEnd]);

  const handleVariableSelect = useCallback((variable) => {
    setShowVarModal(false);
    setSegments((prev) => {
      const idx = activeSegIdxRef.current;
      const next = [...prev];
      const seg = next[idx];
      const currentText = seg?.type === 'text'
        ? (spanRefs.current[seg.id]?.textContent ?? seg.value)
        : '';

      const varSeg = { id: uid(), type: 'variable', value: variable };
      const trailSeg = { id: uid(), type: 'text', value: '' };

      let insertAt;
      if (!seg || seg.type !== 'text') {
        insertAt = seg ? idx + 1 : next.length;
        next.splice(insertAt, 0, varSeg, trailSeg);
        activeSegIdxRef.current = insertAt + 1;
      } else {
        next.splice(idx, 1, { ...seg, value: currentText }, varSeg, trailSeg);
        activeSegIdxRef.current = idx + 2;
      }

      focusSegEnd(trailSeg.id);
      return next;
    });
  }, [focusSegEnd]);

  const makeTextSegHandlers = useCallback((i, seg) => ({
    onFocus: () => { activeSegIdxRef.current = i; },
    onKeyDown: (e) => {
      if (e.key === 'Enter') { e.preventDefault(); }
      if (e.key === 'Backspace') {
        const el = spanRefs.current[seg.id];
        if (!el || el.textContent !== '') return;
        if (i > 0 && segments[i - 1]?.type === 'variable') {
          e.preventDefault();
          removeVariable(i - 1);
        }
      }
    },
  }), [segments, removeVariable]);

  const dropdownStyle = {
    position: 'fixed',
    top: 80,
    right: 660,
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

        <div className={styles.body}>
          {/* Response text */}
          <div className={styles.fieldGroup}>
            <span className={styles.sectionLabel}>Response text <span className={styles.required}>*</span></span>
            <div key={editorKey} className={styles.richEditor}>
              <div className={styles.richContent}>
                {segments.map((seg, i) =>
                  seg.type === 'variable' ? (
                    <VarTag key={seg.id} value={seg.value} onDelete={() => removeVariable(i)} />
                  ) : (
                    <TextSeg
                      key={seg.id}
                      segId={seg.id}
                      initialText={seg.value}
                      spanRefs={spanRefs}
                      {...makeTextSegHandlers(i, seg)}
                    />
                  )
                )}
              </div>
              <button
                type="button"
                className={styles.varBtnInner}
                onClick={() => setShowVarModal((v) => !v)}
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
