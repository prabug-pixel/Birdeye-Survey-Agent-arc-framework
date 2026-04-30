import React, { useState, useRef, useEffect } from 'react';
import FormInput from '@birdeye/elemental/core/atoms/FormInput/index.js';
import TextArea from '@birdeye/elemental/core/atoms/TextArea/index.js';
import SingleSelect from '@birdeye/elemental/core/atoms/SingleSelect/index.js';
import SystemPromptInput from '../../../Molecules/Inputs/SystemPromptInput/SystemPromptInput';
import UserPromptInput from '../../../Molecules/Inputs/UserPromptInput/UserPromptInput';
import OutputFields from '../../../Molecules/Inputs/OutputFields/OutputFields';
import VariableChip, { CHIP_TYPES, DataTypeIcon } from '../../../Molecules/Inputs/VariableChip/VariableChip';
import styles from './LLMTaskBody.module.css';

const LLM_MODEL_OPTIONS = [
  { value: 'Fast', label: 'Fast' },
  { value: 'Balanced', label: 'Balanced' },
  { value: 'Standard', label: 'Standard' },
  { value: 'Advanced', label: 'Advanced' },
  { value: 'Thinking', label: 'Thinking' },
];

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const normalizeChips = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) =>
    typeof item === 'string' ? { value: item, type: 'variable' } : item
  );
};

function ChipContainer({ chips, onChipChange, onChipDelete, addingNew, onStartAdd, onCancelAdd, onCommitAdd, onChangeChipType }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerFor, setPickerFor] = useState(null);
  const [pendingType, setPendingType] = useState('variable');
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  const openForAdd = () => {
    setPickerFor('add');
    setPickerOpen(true);
  };

  const openForChip = (i) => {
    setPickerFor(i);
    setPickerOpen(true);
  };

  const selectType = (type) => {
    setPickerOpen(false);
    if (pickerFor === 'add') {
      setPendingType(type);
      onStartAdd();
    } else if (typeof pickerFor === 'number') {
      onChangeChipType(pickerFor, type);
    }
    setPickerFor(null);
  };

  const hasChips = chips.length > 0 || addingNew;

  return (
    <div className={styles.chipContainer}>
      {hasChips && (
        <div className={styles.chipWrap}>
          {chips.map((chip, i) => (
            <VariableChip
              key={i}
              value={chip.value}
              type={chip.type}
              onChange={(v) => onChipChange(i, v)}
              onDelete={() => onChipDelete(i)}
              onSwatchClick={() => openForChip(i)}
            />
          ))}
          {addingNew && (
            <VariableChip
              value=""
              type={pendingType}
              autoFocus
              onChange={(v) => onCommitAdd(v, pendingType)}
              onDelete={onCancelAdd}
            />
          )}
        </div>
      )}
      <div className={styles.addRow} ref={pickerRef}>
        <button className={styles.addBtn} type="button" onClick={openForAdd}>
          <span className="material-symbols-outlined">add_circle</span>
          <span className={styles.addBtnLabel}>Add</span>
        </button>
        {pickerOpen && (
          <div className={styles.typePicker}>
            {CHIP_TYPES.map((ct) => (
              <button
                key={ct.type}
                className={styles.typePickerItem}
                type="button"
                onClick={() => selectType(ct.type)}
              >
                <span className={`${styles.typePickerSwatch} ${styles[`tpSwatch${cap(ct.type)}`] || ''}`}>
                  {ct.icon ? (
                    <span className={`material-symbols-outlined ${styles[`tpIcon${cap(ct.type)}`] || ''}`}>
                      {ct.icon}
                    </span>
                  ) : (
                    <DataTypeIcon />
                  )}
                </span>
                <span className={styles.typePickerLabel}>{ct.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LLMTaskBody({ initialValues = {}, onFieldChange }) {
  const [taskName, setTaskName] = useState(initialValues.taskName ?? '');
  const [description, setDescription] = useState(initialValues.description ?? '');
  const [llmModel, setLlmModel] = useState(initialValues.llmModel ?? 'Fast');
  const [systemPrompt, setSystemPrompt] = useState(initialValues.systemPrompt ?? '');
  const [userPrompt, setUserPrompt] = useState(initialValues.userPrompt ?? '');

  const [contextFields, setContextFields] = useState(normalizeChips(initialValues.contextFields));
  const [addingContext, setAddingContext] = useState(false);

  const [inputFields, setInputFields] = useState(normalizeChips(initialValues.inputFields));
  const [addingInput, setAddingInput] = useState(false);

  const [outputFields, setOutputFields] = useState(() => {
    const raw = initialValues.outputFields ?? [];
    return raw.map((item) => typeof item === 'string' ? { value: item, type: 'variable' } : item);
  });

  const emit = (field, val) => onFieldChange?.(field, val);

  const updateContextFields = (next) => { setContextFields(next); emit('contextFields', next); };
  const updateInputFields = (next) => { setInputFields(next); emit('inputFields', next); };
  const updateOutputFields = (next) => { setOutputFields(next); emit('outputFields', next); };

  return (
    <div className={styles.container}>
      <FormInput
        name="taskName"
        type="text"
        label="Task name"
        placeholder="Enter name"
        value={taskName}
        onChange={(e) => { setTaskName(e.target.value); emit('taskName', e.target.value); }}
        required
      />
      <TextArea
        name="description"
        label="Description"
        placeholder="Enter description"
        value={description}
        onChange={(e) => { setDescription(e.target.value); emit('description', e.target.value); }}
        required
        noFloatingLabel
      />

      <div className={styles.fieldGroup}>
        <div className={styles.labelRow}>
          <span className={styles.label}>LLM Model</span>
          <span className={`material-symbols-outlined ${styles.infoIcon}`}>info</span>
        </div>
        <SingleSelect
          name="llmModel"
          selected={llmModel}
          options={LLM_MODEL_OPTIONS}
          onChange={(opt) => { setLlmModel(opt.value); emit('llmModel', opt.value); }}
          placeholder="Select"
        />
      </div>

      <div className={styles.fieldGroup}>
        <div className={styles.labelRow}>
          <span className={styles.label}>Context</span>
          <span className={`material-symbols-outlined ${styles.infoIcon}`}>info</span>
        </div>
        <ChipContainer
          chips={contextFields}
          onChipChange={(i, v) => updateContextFields(contextFields.map((c, idx) => idx === i ? { ...c, value: v } : c))}
          onChipDelete={(i) => updateContextFields(contextFields.filter((_, idx) => idx !== i))}
          addingNew={addingContext}
          onStartAdd={() => setAddingContext(true)}
          onCancelAdd={() => setAddingContext(false)}
          onCommitAdd={(v, t) => { updateContextFields([...contextFields, { value: v, type: t || 'variable' }]); setAddingContext(false); }}
          onChangeChipType={(i, type) => updateContextFields(contextFields.map((c, idx) => idx === i ? { ...c, type } : c))}
        />
      </div>

      <div className={styles.fieldGroup}>
        <div className={styles.labelRow}>
          <span className={styles.label}>Input fields</span>
          <span className={`material-symbols-outlined ${styles.infoIcon}`}>info</span>
        </div>
        <ChipContainer
          chips={inputFields}
          onChipChange={(i, v) => updateInputFields(inputFields.map((c, idx) => idx === i ? { ...c, value: v } : c))}
          onChipDelete={(i) => updateInputFields(inputFields.filter((_, idx) => idx !== i))}
          addingNew={addingInput}
          onStartAdd={() => setAddingInput(true)}
          onCancelAdd={() => setAddingInput(false)}
          onCommitAdd={(v, t) => { updateInputFields([...inputFields, { value: v, type: t || 'variable' }]); setAddingInput(false); }}
          onChangeChipType={(i, type) => updateInputFields(inputFields.map((c, idx) => idx === i ? { ...c, type } : c))}
        />
      </div>

      <SystemPromptInput
        value={systemPrompt}
        onChange={(val) => { setSystemPrompt(val); emit('systemPrompt', val); }}
        required
      />

      <UserPromptInput
        value={userPrompt}
        onChange={(val) => { setUserPrompt(val); emit('userPrompt', val); }}
        required
      />

      <OutputFields
        fields={outputFields}
        onFieldsChange={updateOutputFields}
        showInfo
      />
    </div>
  );
}
