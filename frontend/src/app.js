import React, { useState } from 'react';
import './index.css'; // This line imports the CSS file that is also needed.

function App() {
  const [diagnosis, setDiagnosis] = useState('');

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <div className="w-full max-w-lg space-y-6">
        <h1 className="text-3xl font-bold text-center text-green-800">☕ Coffee Doctor </h1>
        <p className="text-center text-gray-600">Diagnose your coffee plant's health.</p>
        
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Diagnosis Result</h2>
          {diagnosis ? (
            <p className="text-gray-700">{diagnosis}</p>
          ) : (
            <p className="text-gray-500">Upload an image to get a diagnosis.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
