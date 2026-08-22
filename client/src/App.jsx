import { useState } from 'react';
import PipelinePage from './pages/Pipeline.jsx';
import StoriesPage from './pages/Stories.jsx';
import ComingSoonPage from './pages/ComingSoon.jsx';
import './styles/app.css';

const TABS = [
  { id: 'pipeline', label: 'Pipeline', component: PipelinePage },
  { id: 'stories', label: 'Story Bank', component: StoriesPage },
  {
    id: 'skills',
    label: 'Skills',
    component: () => (
      <ComingSoonPage
        title="Behavioral Skills"
        blurb="Self-assessment rubric with rating history — Milestone 3."
      />
    ),
  },
  {
    id: 'technical',
    label: 'Technical Prep',
    component: () => (
      <ComingSoonPage
        title="Technical Prep"
        blurb="Topic tracker with confidence ratings and review dates — Milestone 5."
      />
    ),
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    component: () => (
      <ComingSoonPage
        title="Dashboard"
        blurb="Unified home view aggregating all four areas — Milestone 6."
      />
    ),
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('pipeline');
  const Active = TABS.find((t) => t.id === activeTab)?.component ?? PipelinePage;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__mark mono">✈</span>
          <div>
            <h1>Job Dashboard</h1>
            <p className="app-header__tagline mono">DEPARTURES · INTERVIEW PIPELINE</p>
          </div>
        </div>
        <nav className="app-nav mono" aria-label="Main sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`app-nav__item${activeTab === tab.id ? ' is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="app-main">
        <Active />
      </main>
    </div>
  );
}
