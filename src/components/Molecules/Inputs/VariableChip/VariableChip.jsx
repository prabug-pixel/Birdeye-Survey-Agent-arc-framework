import React, { useState, useRef, useEffect } from 'react';
import styles from './VariableChip.module.css';

export function DataTypeIcon() {
  return (
    <svg width="16" height="15" viewBox="5 5.5 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.24889 13.2505C7.46549 13.4287 7.64002 13.6525 7.76 13.906C8.06667 14.5385 8.06667 15.3116 8.06667 16.0616C8.06667 17.6148 8.13056 18.3616 9.6 18.3616C9.73556 18.3616 9.86556 18.4155 9.96141 18.5113C10.0573 18.6072 10.1111 18.7372 10.1111 18.8727C10.1111 19.0083 10.0573 19.1383 9.96141 19.2342C9.86556 19.33 9.73556 19.3839 9.6 19.3839C8.48322 19.3839 7.72678 18.9916 7.35111 18.2172C7.04444 17.5847 7.04444 16.8117 7.04444 16.0616C7.04444 14.5085 6.98056 13.7616 5.51111 13.7616C5.37556 13.7616 5.24555 13.7078 5.1497 13.6119C5.05385 13.5161 5 13.3861 5 13.2505C5 13.115 5.05385 12.985 5.1497 12.8891C5.24555 12.7933 5.37556 12.7394 5.51111 12.7394C6.98056 12.7394 7.04444 11.9925 7.04444 10.4394C7.04444 9.69063 7.04444 8.9163 7.35111 8.2838C7.72806 7.50947 8.4845 7.11719 9.60128 7.11719C9.73683 7.11719 9.86684 7.17104 9.96269 7.26689C10.0585 7.36274 10.1124 7.49274 10.1124 7.6283C10.1124 7.76385 10.0585 7.89386 9.96269 7.98971C9.86684 8.08556 9.73683 8.13941 9.60128 8.13941C8.13183 8.13941 8.06794 8.88627 8.06794 10.4394C8.06794 11.1882 8.06794 11.9625 7.76128 12.595C7.64093 12.8486 7.46595 13.0725 7.24889 13.2505ZM20.8235 12.7394C19.3541 12.7394 19.2902 11.9925 19.2902 10.4394C19.2902 9.69063 19.2902 8.9163 18.9835 8.2838C18.6078 7.50947 17.8514 7.11719 16.7346 7.11719C16.5991 7.11719 16.4691 7.17104 16.3732 7.26689C16.2773 7.36274 16.2235 7.49274 16.2235 7.6283C16.2235 7.76385 16.2773 7.89386 16.3732 7.98971C16.4691 8.08556 16.5991 8.13941 16.7346 8.13941C18.2041 8.13941 18.2679 8.88627 18.2679 10.4394C18.2679 11.1882 18.2679 11.9625 18.5746 12.595C18.6946 12.8485 18.8691 13.0724 19.0857 13.2505C18.8691 13.4287 18.6946 13.6525 18.5746 13.906C18.2679 14.5385 18.2679 15.3116 18.2679 16.0616C18.2679 17.6148 18.2041 18.3616 16.7346 18.3616C16.5991 18.3616 16.4691 18.4155 16.3732 18.5113C16.2773 18.6072 16.2235 18.7372 16.2235 18.8727C16.2235 19.0083 16.2773 19.1383 16.3732 19.2342C16.4691 19.33 16.5991 19.3839 16.7346 19.3839C17.8514 19.3839 18.6078 18.9916 18.9835 18.2172C19.2902 17.5847 19.2902 16.8117 19.2902 16.0616C19.2902 14.5085 19.3541 13.7616 20.8235 13.7616C20.9591 13.7616 21.0891 13.7078 21.1849 13.6119C21.2808 13.5161 21.3346 13.3861 21.3346 13.2505C21.3346 13.115 21.2808 12.985 21.1849 12.8891C21.0891 12.7933 20.9591 12.7394 20.8235 12.7394Z" fill="#1976D2" />
      <path d="M14.4142 12.0861L13 13.5003L11.5858 14.9145M11.5858 12.0861L14.4142 14.9145" stroke="#1976D2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="158 5 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M166 13.6188L163.151 16.4675C163.059 16.5598 162.959 16.6042 162.853 16.6008C162.747 16.5974 162.645 16.5474 162.549 16.4508C162.452 16.3542 162.404 16.251 162.404 16.1412C162.404 16.0314 162.452 15.9282 162.549 15.8316L165.381 12.9995L162.532 10.1508C162.44 10.0585 162.395 9.95637 162.399 9.8444C162.402 9.73245 162.452 9.62818 162.549 9.5316C162.645 9.43501 162.748 9.38672 162.858 9.38672C162.968 9.38672 163.071 9.43501 163.168 9.5316L166 12.3803L168.849 9.5316C168.941 9.43929 169.043 9.39207 169.155 9.38994C169.267 9.38779 169.371 9.43501 169.468 9.5316C169.564 9.62818 169.613 9.73138 169.613 9.8412C169.613 9.95102 169.564 10.0542 169.468 10.1508L166.619 12.9995L169.468 15.8483C169.56 15.9406 169.607 16.0399 169.609 16.1463C169.612 16.2527 169.564 16.3542 169.468 16.4508C169.371 16.5474 169.268 16.5957 169.158 16.5957C169.048 16.5957 168.945 16.5474 168.849 16.4508L166 13.6188Z" fill="#303030" />
    </svg>
  );
}

export const CHIP_TYPES = [
  { type: 'variable', label: 'Variable', icon: null },
  { type: 'attachment', label: 'Attachment', icon: 'attach_file' },
  { type: 'link', label: 'Link URL', icon: 'link' },
  { type: 'address', label: 'Brand', icon: 'home' },
  { type: 'product', label: 'Industry', icon: 'deployed_code' },
];

// All renderable swatch icons by type. Includes types that don't appear in the
// user-facing picker (e.g. 'tool', which is inserted via ToolSelectionDrawer).
const SWATCH_ICON_BY_TYPE = {
  variable: null,
  attachment: 'attach_file',
  link: 'link',
  address: 'home',
  product: 'deployed_code',
  tool: 'build',
};

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function SwatchIcon({ type }) {
  if (!type || type === 'variable') return <DataTypeIcon />;
  const icon = SWATCH_ICON_BY_TYPE[type];
  if (!icon) return <DataTypeIcon />;
  return (
    <span className={`material-symbols-outlined ${styles[`icon${cap(type)}`] || ''}`}>
      {icon}
    </span>
  );
}

export default function VariableChip({ value, type = 'variable', onChange, onDelete, onSwatchClick, autoFocus = false, fullWidth = false }) {
  const [editing, setEditing] = useState(autoFocus);
  const [draft, setDraft] = useState(value ?? '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) {
      onChange?.(trimmed);
      setEditing(false);
    } else {
      onDelete?.();
    }
  };

  const cancel = () => {
    if (!value) {
      onDelete?.();
    } else {
      setDraft(value);
      setEditing(false);
    }
  };

  const chipClass = [
    styles.chip,
    styles[`chip${cap(type)}`] || '',
    editing ? styles.chipEditing : '',
    fullWidth ? styles.chipFullWidth : '',
  ].filter(Boolean).join(' ');

  const swatchClass = [
    styles.chipSwatch,
    styles[`swatch${cap(type)}`] || '',
    onSwatchClick ? styles.swatchClickable : '',
  ].filter(Boolean).join(' ');

  if (editing) {
    return (
      <span className={chipClass}>
        <span
          className={swatchClass}
          onClick={(e) => { e.stopPropagation(); onSwatchClick?.(); }}
        >
          <SwatchIcon type={type} />
        </span>
        <input
          ref={inputRef}
          className={styles.chipInput}
          value={draft}
          placeholder="variable"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commit(); }
            if (e.key === 'Escape') { e.preventDefault(); cancel(); }
          }}
        />
      </span>
    );
  }

  return (
    <span className={chipClass}>
      <span
        className={swatchClass}
        onClick={(e) => { e.stopPropagation(); onSwatchClick?.(); }}
      >
        <SwatchIcon type={type} />
      </span>
      <span
        className={`${styles.chipLabel} ${fullWidth ? styles.chipLabelWrap : ''}`}
        onClick={() => setEditing(true)}
      >
        {value}
      </span>
      <button
        className={styles.deleteBtn}
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
      >
        <CloseIcon />
      </button>
    </span>
  );
}
