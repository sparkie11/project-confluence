import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface ChartDataEditorProps {
  chartName: string;
  initialData: any[];
  onDataChange: (newData: any[]) => void;
}

const ChartDataEditor: React.FC<ChartDataEditorProps> = ({ chartName, initialData, onDataChange }) => {
  const [email, setEmail] = useState<string>('');
  const [isEmailSubmitted, setIsEmailSubmitted] = useState<boolean>(false);
  const [customValues, setCustomValues] = useState<string>(JSON.stringify(initialData, null, 2));
  const [previousValues, setPreviousValues] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (isEmailSubmitted) {
      loadCustomValues();
    }
  }, [isEmailSubmitted]);

  const loadCustomValues = async () => {
    const { data, error } = await supabase
      .from('chart_data')
      .select('values')
      .eq('email', email)
      .eq('chart_name', chartName)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error loading custom values:', error);
      setMessage('Error loading previous data.');
    } else if (data) {
      setPreviousValues(JSON.stringify(data.values, null, 2));
      setMessage('Previous custom values loaded. Do you want to overwrite?');
    } else {
      setPreviousValues(null);
      setMessage('No previous custom values found for this email.');
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailSubmitted(true);
  };

  const handleSaveValues = async () => {
    try {
      const parsedValues = JSON.parse(customValues);
      const { data: existingData, error: existingError } = await supabase
        .from('chart_data')
        .select('id')
        .eq('email', email)
        .eq('chart_name', chartName)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('chart_data')
          .update({ values: parsedValues })
          .eq('email', email)
          .eq('chart_name', chartName);
        if (error) throw error;
        setMessage('Custom values updated successfully!');
      } else {
        // Insert new record
        const { error } = await supabase
          .from('chart_data')
          .insert([{ email, chart_name: chartName, values: parsedValues }]);
        if (error) throw error;
        setMessage('Custom values saved successfully!');
      }
      onDataChange(parsedValues);
      setPreviousValues(customValues);
    } catch (error: any) {
      console.error('Error saving custom values:', error.message);
      setMessage(`Error saving values: ${error.message}`);
    }
  };

  const handleOverwriteConfirm = () => {
    handleSaveValues();
  };

  if (!isEmailSubmitted) {
    return (
      <div className="chart-editor">
        <h3>Enter your email to customize {chartName}</h3>
        <form onSubmit={handleEmailSubmit}>
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Submit Email</button>
        </form>
      </div>
    );
  }

  return (
    <div className="chart-editor">
      <h3>Customize {chartName}</h3>
      <textarea
        value={customValues}
        onChange={(e) => setCustomValues(e.target.value)}
        rows={10}
        cols={50}
      />
      <button onClick={handleSaveValues}>Save Custom Values</button>
      {message && <p>{message}</p>}
      {previousValues && previousValues !== customValues && (
        <div>
          <p>Previous values:</p>
          <textarea value={previousValues} rows={5} cols={50} readOnly />
          <button onClick={handleOverwriteConfirm}>Confirm Overwrite</button>
        </div>
      )}
    </div>
  );
};

export default ChartDataEditor;