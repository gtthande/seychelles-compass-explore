import React from 'react';

const EnvDebug = () => {
  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    VITE_SITE_URL: import.meta.env.VITE_SITE_URL,
  };

  const hasUrl = !!envVars.VITE_SUPABASE_URL;
  const hasKey = !!envVars.VITE_SUPABASE_ANON_KEY;
  const keyLength = envVars.VITE_SUPABASE_ANON_KEY?.length || 0;

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Environment Debug</h4>
      <div>URL: {hasUrl ? '✅' : '❌'} {envVars.VITE_SUPABASE_URL}</div>
      <div>Key: {hasKey ? '✅' : '❌'} Length: {keyLength}</div>
      <div>Maps: {envVars.VITE_GOOGLE_MAPS_API_KEY ? '✅' : '❌'}</div>
      <div>Site: {envVars.VITE_SITE_URL}</div>
    </div>
  );
};

export default EnvDebug;
