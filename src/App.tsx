import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { AdminDashboard } from './components/AdminDashboard';
import { ProjectionScreen } from './components/ProjectionScreen';
import { Login } from './components/Login';
import { GuestUpload } from './components/GuestUpload';
import { Session } from '@supabase/supabase-js';

const ScreenWrapper = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id');

  if (!eventId) return <div className="h-screen w-screen bg-black text-white flex items-center justify-center">Error: ID de evento no proporcionado</div>;

  return <ProjectionScreen eventId={eventId} />;
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/admin" 
          element={session ? <AdminDashboard /> : <Navigate to="/login" replace />} 
        />
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/admin" replace />} />
        <Route path="/screen" element={<ScreenWrapper />} />
        <Route path="/guest" element={<GuestUpload />} />
        <Route path="/" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
