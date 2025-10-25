import { useState } from 'react'
import './App.css'
import CallDurationChart from './components/CallDurationChart';
import SadPathAnalysisChart from './components/SadPathAnalysisChart';
import ChartDataEditor from './components/ChartDataEditor';

const initialSadPathData = [
  { name: 'Verbal Aggression', value: 100 },
  { name: 'Customer Hostility', value: 200 },
  { name: 'Assistant did not speak French', value: 300 },
  { name: 'Unsupported Language', value: 150 },
  { name: 'Assistant did not speak Spanish', value: 250 },
  { name: 'User refused to confirm identity', value: 100 },
  { name: 'Caller Identification', value: 120 },
  { name: 'Incorrect caller identity', value: 80 },
];

function App() {
  const [sadPathData, setSadPathData] = useState(initialSadPathData);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  return (
    <div className="App">
      <h1>Call Analytics Dashboard</h1>
      <div className="email-input-container">
        <label htmlFor="userEmail">Enter your email to save/load custom data:</label>
        <input
          id="userEmail"
          type="email"
          value={userEmail || ''}
          onChange={(e) => setUserEmail(e.target.value)}
          placeholder="your.email@example.com"
        />
      </div>
      <div className="charts-container">
        <CallDurationChart />
        <SadPathAnalysisChart data={sadPathData} />
      </div>
      <div className="editor-container">
        <ChartDataEditor
          chartName="Sad Path Analysis"
          initialData={initialSadPathData}
          onDataChange={setSadPathData}
          userEmail={userEmail}
        />
      </div>
    </div>
  );
}

export default App;
