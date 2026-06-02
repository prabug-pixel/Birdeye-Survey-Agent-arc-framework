import React, { useState } from 'react';
import ToolSelectionDrawer from './ToolSelectionDrawer';

export default {
  title: 'Agent Builder/Organisms/Drawer/ToolSelectionDrawer',
  component: ToolSelectionDrawer,
  parameters: { layout: 'fullscreen' },
};

function DrawerWrapper() {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div style={{ height: '100vh', background: 'rgba(33,33,33,0.24)' }}>
      <ToolSelectionDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onToolSelect={(tool) => console.log('Selected tool:', tool)}
      />
    </div>
  );
}

export const Default = {
  render: () => <DrawerWrapper />,
};
