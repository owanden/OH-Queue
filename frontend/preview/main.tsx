import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../src/App';
import '../src/index.css';
import './style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <aside className="preview-banner" aria-label="Browser preview information">
      <strong>Office Hours Queue · Browser preview</strong>
      <p>Synthetic data in this tab only. No backend, sign-in, phone collection or messages. Reload resets the sample queue.</p>
      <p>Try Serve Next Student, switch to Guest, then add a sample student. Role controls are simulated.</p>
      <nav aria-label="Preview links">
        <button onClick={() => window.location.reload()}>Reset preview</button>
        <a href="../../#projects">Back to portfolio</a>
        <a href="https://github.com/owanden/OH-Queue/blob/main/docs/demo.md">Run the full-stack local demo</a>
        <a href="https://github.com/owanden/OH-Queue">Source</a>
      </nav>
    </aside>
    <App preview />
  </React.StrictMode>,
);
