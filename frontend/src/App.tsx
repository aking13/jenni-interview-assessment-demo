import React from 'react';
import TextEditor from './components/TextEditor';
import { logger } from './utils/logger';

const App: React.FC = () => {
  React.useEffect(() => {
    logger.info('App component mounted');
    return () => {
      logger.info('App component unmounted');
    };
  }, []);

  return (
    <div className="container">
      <h1>Textme Editor</h1>
      <TextEditor initialText="" placeholder="Start typing or paste your text here..." />
    </div>
  );
};

export default App;
