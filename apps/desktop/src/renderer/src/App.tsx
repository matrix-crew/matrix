import React from 'react';

/**
 * Main App component for Maxtix desktop application
 *
 * This is the root React component that renders the desktop UI.
 * It serves as the entry point for the renderer process UI hierarchy.
 */
const App: React.FC = () => {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Maxtix</h1>
        <p className="mt-4 text-lg text-gray-600">
          Automated multi-source, multi-session AI agent system
        </p>
      </div>
    </div>
  );
};

export default App;
