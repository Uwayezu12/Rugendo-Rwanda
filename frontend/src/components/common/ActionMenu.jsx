import React, { useEffect, useRef, useState } from 'react';
import IconButton, { DotsIcon } from './IconButton.jsx';

export default function ActionMenu({ label, actions = [], align = 'right', disabled = false }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const visibleActions = actions.filter(Boolean);

  return (
    <div className="relative inline-flex" ref={menuRef}>
      <IconButton
        label={label}
        variant="neutral"
        disabled={disabled || visibleActions.length === 0}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        icon={<DotsIcon />}
      />

      {open && (
        <div
          role="menu"
          className={`absolute top-full z-20 mt-2 min-w-40 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800 ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
        >
          {visibleActions.map((action) => (
            <button
              key={action.key || action.label}
              type="button"
              role="menuitem"
              disabled={action.disabled}
              onClick={() => {
                setOpen(false);
                action.onClick?.();
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                action.danger
                  ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {action.icon && <span className="h-4 w-4 shrink-0">{action.icon}</span>}
              <span className="min-w-0 truncate">{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
