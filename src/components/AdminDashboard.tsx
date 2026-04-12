import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogOut, Plus, Image as ImageIcon, Video, MessageSquare, Settings, ExternalLink, Trash2, Sparkles, Link as LinkIcon, Share2, Check, Download, Loader2, Printer, RefreshCw, Monitor } from 'lucide-react';
import { SettingsPanel } from './SettingsPanel';
import { ThemeOnboarding } from './ThemeOnboarding';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const AdminDashboard = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [onboardingFinished, setOnboardingFinished] = useState<boolean | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if user is SuperAdmin (Tú)
    const { data: profile } = await supabase
      .from('portal_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile?.is_superadmin || !profile) {
      setIsAdmin(true);
      const { data } = await supabase.from('events').select('*');
      if (data) {
        setEvents(data);
        const targetId = selectedEventId || data[0]?.id;
        if (targetId) {
          const { data: settings } = await supabase.from('event_settings').select('onboarding_completed').eq('event_id', targetId).maybeSingle();
          setOnboardingFinished(settings?.onboarding_completed === true);
        }
      }
    } else if (profile?.managed_event_id) {
      setIsAdmin(false);
      setSelectedEventId(profile.managed_event_id);
      const { data } = await supabase.from('events').select('*').eq('id', profile.managed_event_id).single();
      if (data) {
        setEvents([data]);
        const { data: settings } = await supabase.from('event_settings').select('onboarding_completed').eq('event_id', profile.managed_event_id).maybeSingle();
        setOnboardingFinished(settings?.onboarding_completed === true);
      }
    }
  };

  const fetchEventsForAdmin = async () => {
    const { data } = await supabase.from('events').select('*');
    if (data) setEvents(data);
    if (data && data.length > 0 && !selectedEventId) {
      setSelectedEventId(data[0].id);
    }
  };

  const fetchSingleEvent = async (id: string) => {
    const { data } = await supabase.from('events').select('*, event_settings(*)').eq('id', id).single();
    if (data) {
      setEvents([data]);
    }
  };

  const handleResetCycle = async () => {
    if (!confirm('¿Quieres reiniciar el contador de vistas? Todas las fotos volverán a aparecer en el carrusel.')) return;
    await supabase.from('content_items').update({ display_count: 0 }).eq('event_id', selectedEventId);
    if (selectedEventId) fetchContent(selectedEventId);
    alert('✅ Ciclo reiniciado.');
  };

  const fetchContent = async (id: string) => {
    const { data } = await supabase
      .from('content_items')
      .select('*')
      .eq('event_id', id)
      .order('is_approved', { ascending: true })
      .order('display_count', { ascending: true })
      .order('sort_order', { ascending: false });
    if (data) setContentItems(data);
  };

  // ... (funciones handleApprove, openPopOut, copyGuestLink, handleUpload, handleAddMessage siguen igual)
  const handleApprove = async (id: string) => {
    await supabase.from('content_items').update({ is_approved: true }).eq('id', id);
    if (previewItem?.id === id) setPreviewItem(null);
  };

  const openPopOut = () => {
    if (selectedEventId) {
      window.open(`/screen?id=${selectedEventId}`, 'ProjectionScreen', 'width=1280,height=720');
    }
  };

  const copyGuestLink = () => {
    if (selectedEventId) {
      const url = `${window.location.origin}/guest?id=${selectedEventId}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateEvent = async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data: newEvent, error: eventError } = await supabase.from('events').insert({
      name,
      client_id: user.id
    }).select().single();

    if (eventError) {
      alert('Error: ' + eventError.message);
      return;
    }

    // Auto-create settings
    await supabase.from('event_settings').insert({
      event_id: newEvent.id,
      onboarding_completed: false
    });

    fetchInitialData();
  };

  const handleUpload = async (file: File, type: 'image' | 'video') => {
    if (!selectedEventId) return;
    const bucket = type === 'image' ? 'images' : 'videos';
    const filePath = `${selectedEventId}/${Math.random()}-${file.name}`;
    await supabase.storage.from(bucket).upload(filePath, file);
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
    await supabase.from('content_items').insert({
      event_id: selectedEventId,
      type: type,
      content_url: publicUrl,
      is_approved: true
    });
    fetchContent(selectedEventId);
  };

  const handleDownloadAll = async () => {
    const approvedMedia = contentItems.filter(item => item.is_approved && item.type !== 'message');
    if (approvedMedia.length === 0) return;
    setIsDownloading(true);
    const zip = new JSZip();
    const eventName = events.find(e => e.id === selectedEventId)?.name || 'evento';
    try {
      const promises = approvedMedia.map(async (item, index) => {
        const response = await fetch(item.content_url);
        const blob = await response.blob();
        zip.file(`${index + 1}-${item.type}.${item.type === 'video' ? 'mp4' : 'jpg'}`, blob);
      });
      await Promise.all(promises);
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `SnapShow-${eventName}.zip`);
    } finally {
       setIsDownloading(false);
    }
  };

  const currentEvent = events.find(e => e.id === selectedEventId);
  
  // Lógica de detección ultra-robusta
  const getOnboardingStatus = () => {
    if (!currentEvent?.event_settings) return false;
    const settings = currentEvent.event_settings;
    if (Array.isArray(settings)) {
      return settings.length > 0 && settings[0].onboarding_completed === true;
    }
    return settings.onboarding_completed === true;
  };

  const onboardingDone = getOnboardingStatus();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Onboarding Assistant */}
      {currentEvent && onboardingFinished === false && (
        <ThemeOnboarding 
          eventId={currentEvent.id} 
          initialName={currentEvent.name} 
          onComplete={() => {
            setOnboardingFinished(true);
            window.location.reload();
          }} 
        />
      )}

      {/* Printable Flyer Modal */}
      {showPrintModal && selectedEventId && (
        <div className="fixed inset-0 z-[70] bg-white text-black p-12 flex flex-col items-center justify-center text-center">
          <div className="border-[12px] border-black p-12 max-w-lg w-full">
            <h1 className="text-4xl font-black mb-2 uppercase tracking-tighter">SnapShow En Vivo</h1>
            <p className="text-xl font-bold mb-8 opacity-60">{currentEvent?.name}</p>
            <div className="bg-black text-white py-4 px-8 rounded-full mb-12 font-black inline-block">¡SUBE TUS FOTOS Y VIDEOS!</div>
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/guest?id=${selectedEventId}`)}`}
              className="w-64 h-64 mx-auto mb-12 border-8 border-black p-2"
              alt="QR"
            />
            <div className="space-y-4">
               <p className="text-lg font-bold">1. Escanéa el código</p>
               <p className="text-lg font-bold">2. Elige tu mejor foto o video</p>
               <p className="text-lg font-bold">3. ¡Míralo en pantalla al instante!</p>
            </div>
            <footer className="mt-16 border-t pt-8 border-black/10">
               <p className="text-sm font-black uppercase tracking-widest">Digimedios Apps © 2026</p>
            </footer>
          </div>
          <div className="mt-8 flex gap-4 no-print">
            <button onClick={() => window.print()} className="bg-black text-white px-8 py-3 rounded-xl font-bold">🖨️ Imprimir Ahora</button>
            <button onClick={() => setShowPrintModal(false)} className="text-black/40 px-8 py-3 font-bold">Cerrar</button>
          </div>
          <style>{`@media print { .no-print { display: none; } body { padding: 0; } }`}</style>
        </div>
      )}

      <aside className="w-64 border-r border-white/10 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><Sparkles size={20} /></div>
          <h2 className="text-xl font-bold text-gradient-primary tracking-tight">SnapShow</h2>
        </div>
        <nav className="flex-1 space-y-2">
          {events.map((event) => (
             <button
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${selectedEventId === event.id ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/5'}`}
             >
               {event.name}
             </button>
          ))}
          {isAdmin && (
            <button 
              onClick={() => {
                const name = prompt('Nombre del nuevo evento:');
                if (name) handleCreateEvent(name);
              }}
              className="w-full mt-4 border border-dashed border-white/20 p-3 rounded-lg text-white/40 hover:text-indigo-400 hover:border-indigo-400/40 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={14} />
              <span className="text-xs font-bold uppercase tracking-widest">Crear Evento</span>
            </button>
          )}
        </nav>
        <button onClick={() => supabase.auth.signOut()} className="mt-6 flex items-center gap-2 px-4 py-2 text-white/40 hover:text-red-400 border-t border-white/5 pt-6"><LogOut size={18} /> Salir</button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {!selectedEventId ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto">
            <div className="p-8 bg-indigo-500/5 rounded-full mb-8 animate-pulse">
              <Sparkles className="text-indigo-500" size={64} />
            </div>
            <h2 className="text-4xl font-black mb-4 tracking-tighter">Bienvenido a SnapShow</h2>
            <p className="text-lg text-white/40 mb-10 leading-relaxed">Te ayudamos a convertir tu evento en una experiencia interactiva única. Selecciona un evento para empezar o crea uno nuevo en el menú lateral.</p>
            {isAdmin && (
               <button 
                onClick={() => {
                  const name = prompt('Nombre del nuevo evento:');
                  if (name) handleCreateEvent(name);
                }}
                className="bg-indigo-500 text-white px-10 py-4 rounded-2xl font-black shadow-[0_0_30px_rgba(99,102,241,0.2)] hover:bg-indigo-400 transition-all"
               >
                 Crear Mi Primer Evento
               </button>
            )}
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
              <div>
                <h1 className="text-3xl font-bold">{currentEvent?.name}</h1>
                <p className="text-white/40">Versión 3.0 • Sistema Profesional</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <button onClick={openPopOut} className="flex items-center gap-2 glass px-4 py-2 text-purple-400 hover:bg-white/5 transition-all"><Monitor size={18} /> Pantalla</button>
                <button 
                  onClick={() => {
                    const url = `${window.location.origin}/screen?id=${selectedEventId}`;
                    navigator.clipboard.writeText(url);
                    alert('Link copiado para vMix / OBS');
                  }} 
                  className="flex items-center gap-2 glass px-4 py-2 text-blue-400 hover:bg-white/5 transition-all"
                >
                  <LinkIcon size={18} /> link OBS
                </button>
                <button onClick={() => setShowPrintModal(true)} className="flex items-center gap-2 glass px-4 py-2 text-amber-500 hover:bg-white/5"><Printer size={18} /> Flyer QR</button>
                <button onClick={handleResetCycle} className="flex items-center gap-2 glass px-4 py-2 text-white/60 hover:bg-white/5"><RefreshCw size={18} /> Reiniciar</button>
                <button onClick={handleDownloadAll} className="flex items-center gap-2 glass px-4 py-2 text-green-400 hover:bg-green-500/10 transition-all font-bold">
                   {isDownloading ? <Loader2 className="animate-spin" /> : <Download size={18} />} ZIP
                </button>
                <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2 glass px-3 py-2 text-white/40"><Settings size={18} /></button>
              </div>
            </header>

            {/* Acciones Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
               <label className="glass-card p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-indigo-500/40">
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e.target.files![0], 'image')} />
                  <ImageIcon className="text-indigo-400" /> <span>Sube Foto</span>
               </label>
               {/* Video and Message buttons... */}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold mb-6">Contenido en vivo ({contentItems.length})</h3>
              {contentItems.map((item) => (
                <div key={item.id} className="glass-card p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center overflow-hidden">
                    {item.type === 'image' && <img src={item.content_url} className="w-full h-full object-cover" />}
                    {item.type === 'video' && <video src={item.content_url} className="w-full h-full object-cover" />}
                    {item.type === 'message' && <MessageSquare className="text-white/20" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">{item.type === 'message' ? item.text_content : 'Multimeadia'}</p>
                    <div className="flex gap-4 text-xs font-bold uppercase tracking-widest text-white/30 mt-1">
                      <span>Vistas: <span className={item.display_count >= 3 ? 'text-amber-500' : 'text-green-500'}>{item.display_count || 0}</span></span>
                      <span>Estado: {item.is_approved ? '✔️ Aire' : '⏳ Pendiente'}</span>
                    </div>
                  </div>
                  <button onClick={() => supabase.from('content_items').delete().eq('id', item.id)} className="p-2 text-white/10 hover:text-red-500"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      {isSettingsOpen && selectedEventId && <SettingsPanel eventId={selectedEventId} onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
};
