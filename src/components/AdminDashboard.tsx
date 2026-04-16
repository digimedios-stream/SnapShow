import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogOut, Plus, Image as ImageIcon, Video, MessageSquare, Settings, ExternalLink, Trash2, Sparkles, Link as LinkIcon, Share2, Check, Download, Loader2, Printer, RefreshCw, Monitor, Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingsPanel } from './SettingsPanel';
import { ThemeOnboarding } from './ThemeOnboarding';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const AdminDashboard = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [onboardingFinished, setOnboardingFinished] = useState<boolean | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingFlyer, setIsGeneratingFlyer] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    
    fetchContent(selectedEventId);

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel(`admin_changes_${selectedEventId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'content_items',
        filter: `event_id=eq.${selectedEventId}` 
      }, () => {
        fetchContent(selectedEventId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedEventId]);

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

  const handleDeleteEvent = async (id: string, name: string) => {
    if (!confirm(`⚠️ ¿ESTÁS SEGURO?\n\nEsto borrará permanentemente el evento "${name.toUpperCase()}", todas sus fotos, videos y configuraciones.\n\nEsta acción no se puede deshacer.`)) return;
    
    try {
      await supabase.from('event_settings').delete().eq('event_id', id);
      await supabase.from('content_items').delete().eq('event_id', id);
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      alert('✅ Evento eliminado completamente.');
      if (selectedEventId === id) setSelectedEventId(null);
      fetchInitialData();
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const handleApprove = async (id: string) => {
    await supabase.from('content_items').update({ is_approved: true }).eq('id', id);
    if (previewItem?.id === id) setPreviewItem(null);
  };

  const openPopOut = () => {
    if (selectedEventId) {
      window.open(`/screen?id=${selectedEventId}`, 'ProjectionScreen', 'width=1280,height=720');
    }
  };

  const handleCreateEvent = async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: newEvent, error: eventError } = await supabase.from('events').insert({ name, client_id: user.id }).select().single();
    if (eventError) { alert('Error: ' + eventError.message); return; }
    await supabase.from('event_settings').insert({ event_id: newEvent.id, onboarding_completed: false });
    fetchInitialData();
  };

  const handleUpload = async (file: File) => {
    if (!selectedEventId) return;
    setIsUploading(true);
    
    const isVideo = file.type.startsWith('video/');
    const bucket = isVideo ? 'videos' : 'images';
    const fileExt = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${selectedEventId}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('content_items').insert({
        event_id: selectedEventId,
        type: isVideo ? 'video' : 'image',
        content_url: publicUrl,
        is_approved: false
      });

      if (dbError) throw dbError;
      
      fetchContent(selectedEventId);
    } catch (err: any) {
      console.error('Error uploading:', err);
      alert('Error al subir: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddMessage = async (text: string) => {
    if (!selectedEventId) return;
    await supabase.from('content_items').insert({
      event_id: selectedEventId,
      type: 'message',
      text_content: text,
      is_approved: false
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

  const handleDownloadFlyer = async () => {
    if (!selectedEventId) return;
    setIsGeneratingFlyer(true);
    
    const eventName = events.find(e => e.id === selectedEventId)?.name || 'Evento';
    const guestUrl = `${window.location.origin}/guest?id=${selectedEventId}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(guestUrl)}`;

    try {
      const flyer = document.createElement('div');
      flyer.style.position = 'fixed';
      flyer.style.left = '-9999px';
      flyer.style.top = '0';
      flyer.style.width = '794px'; // A4 width at 96 DPI
      flyer.style.height = '1123px'; // A4 height at 96 DPI
      flyer.style.backgroundColor = 'white';
      flyer.style.color = 'black';
      flyer.style.fontFamily = "'Inter', Arial, sans-serif";
      flyer.style.display = 'flex';
      flyer.style.flexDirection = 'column';
      flyer.style.zIndex = '-1000';

      const flyerContent = (isFlipped: boolean) => `
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; position: relative; ${isFlipped ? 'transform: rotate(180deg);' : ''}">
          <div style="border: 6px solid black; padding: 30px 20px; width: 65%; height: 90%; display: flex; flex-direction: column; align-items: center; justify-content: space-between; box-sizing: border-box;">
            <div style="text-align: center; width: 100%;">
              <h1 style="font-size: 38px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: -1.5px; line-height: 0.9;">SnapShow</h1>
              <p style="font-size: 11px; font-weight: 800; color: #666; margin-top: 5px; letter-spacing: 1px; text-transform: uppercase;">Digimedios Apps - 2026</p>
              
              <div style="margin-top: 25px; padding: 0 10px;">
                <p style="font-size: 26px; font-weight: 900; color: #000; line-height: 1.1; text-transform: uppercase; letter-spacing: -0.5px;">${eventName}</p>
              </div>
            </div>
            
            <div style="border: 4px solid black; padding: 10px; background: white; margin: 15px 0;">
              <img src="${qrUrl}" style="width: 170px; height: 170px; display: block;" crossorigin="anonymous" />
            </div>

            <div style="text-align: center;">
              <p style="font-size: 13px; font-weight: 900; margin-bottom: 6px; letter-spacing: 0.5px; text-transform: uppercase;">¡SUBE TUS FOTOS Y VIDEOS!</p>
              <div style="font-size: 10px; color: #333; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; background: #f0f0f0; padding: 3px 10px; border-radius: 4px;">
                Escanéa • Elige • ¡Listo!
              </div>
            </div>

            <footer style="width: 100%; border-top: 1px solid #eee; padding-top: 12px; margin-top: 10px;">
              <p style="font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #ccc; text-align: center;">SnapShow Event System</p>
            </footer>
          </div>
        </div>
      `;

      flyer.innerHTML = `
        <!-- Pestaña de Base Superior -->
        <div style="height: 100px; border-bottom: 1px dashed #eee; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #ddd; font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
          <span>PESTAÑA DE SOPORTE A</span>
          <span style="font-size: 7px;">(Doblar hacia adentro)</span>
        </div>

        <!-- Cara A (Invertida) -->
        ${flyerContent(true)}

        <!-- Línea de Doblez Central -->
        <div style="height: 0; border-top: 1px dashed #ccc; position: relative;">
          <span style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); background: white; padding: 0 10px; font-size: 8px; font-weight: bold; color: #999; text-transform: uppercase; letter-spacing: 1px;">Lomo del Flyer (Doble aquí)</span>
        </div>

        <!-- Cara B (Normal) -->
        ${flyerContent(false)}

        <!-- Pestaña de Base Inferior -->
        <div style="height: 100px; border-top: 1px dashed #eee; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #ddd; font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
          <span>PESTAÑA DE SOPORTE B</span>
          <span style="font-size: 7px;">(Doblar hacia adentro)</span>
        </div>
      `;

      document.body.appendChild(flyer);
      
      // Esperar a que el QR cargue y fuentes procesen
      await new Promise(resolve => setTimeout(resolve, 2000));

      const canvas = await html2canvas(flyer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      pdf.save(`Piramide-QR-${eventName}.pdf`);
      
      document.body.removeChild(flyer);
    } catch (err) {
      console.error('Error:', err);
      alert('Error al generar la pirámide PDF.');
    } finally {
      setIsGeneratingFlyer(false);
    }
  };

  const currentEvent = events.find(e => e.id === selectedEventId);
  const getOnboardingStatus = () => {
    if (!currentEvent?.event_settings) return false;
    const settings = currentEvent.event_settings;
    return Array.isArray(settings) ? settings[0]?.onboarding_completed === true : settings?.onboarding_completed === true;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {currentEvent && onboardingFinished === false && (
        <ThemeOnboarding eventId={currentEvent.id} initialName={currentEvent.name} onComplete={() => { setOnboardingFinished(true); window.location.reload(); }} />
      )}

      <aside className="w-64 border-r border-white/10 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-8 px-2 text-indigo-400">
          <Sparkles size={20} />
          <h2 className="text-xl font-bold tracking-tight">SnapShow</h2>
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
          {events.map((event) => (
             <div key={event.id} className="group flex items-center gap-1">
               <button onClick={() => setSelectedEventId(event.id)} className={`flex-1 text-left px-4 py-3 rounded-xl transition-all ${selectedEventId === event.id ? 'bg-indigo-500/20 text-indigo-400 font-bold' : 'hover:bg-white/5 text-white/60'}`}>
                 <span className="truncate block w-32">{event.name}</span>
               </button>
               {isAdmin && (
                 <button onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id, event.name); }} className="p-2 text-white/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
               )}
             </div>
          ))}
          {isAdmin && (
            <button onClick={() => { const name = prompt('Nombre del nuevo evento:'); if (name) handleCreateEvent(name); }} className="w-full mt-4 border border-dashed border-white/10 p-4 rounded-xl text-white/20 hover:text-indigo-400 flex items-center justify-center gap-2 group italic text-xs capitalize"><Plus size={14} /> Nuevo Evento</button>
          )}
        </nav>
        <button onClick={() => supabase.auth.signOut()} className="mt-6 flex items-center gap-2 px-4 py-2 text-white/40 hover:text-red-400 border-t border-white/5 pt-6 font-bold text-xs uppercase tracking-widest"><LogOut size={16} /> Salir</button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {!selectedEventId ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto">
            <div className="p-8 bg-indigo-500/5 rounded-full mb-8 animate-pulse"><Sparkles className="text-indigo-500" size={64} /></div>
            <h2 className="text-4xl font-black mb-4 tracking-tighter">SnapShow v3.0</h2>
            <p className="text-lg text-white/40 mb-10">Selecciona o crea un evento para comenzar a gestionar el contenido en vivo.</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <header className="flex justify-between items-center mb-12">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{currentEvent?.name}</h1>
                <p className="text-white/40 text-[10px] uppercase font-black tracking-widest mt-1">Dash Control</p>
              </div>
              <div className="flex gap-3">
                <button onClick={openPopOut} className="flex items-center gap-2 glass px-4 py-2 text-purple-400 font-bold text-sm hover:bg-white/5 transition-all"><Monitor size={16} /> Pantalla</button>
                <button 
                  onClick={() => {
                    const url = `${window.location.origin}/screen?id=${selectedEventId}`;
                    navigator.clipboard.writeText(url);
                    alert('✅ Link copiado para vMix / OBS');
                  }} 
                  className="flex items-center gap-2 glass px-4 py-2 text-blue-400 font-bold text-sm hover:bg-white/5 transition-all"
                >
                  <LinkIcon size={16} /> Link OBS
                </button>
                <button onClick={handleDownloadFlyer} disabled={isGeneratingFlyer} className="flex items-center gap-2 glass px-4 py-2 text-amber-500 font-bold text-sm hover:bg-white/5 transition-all">
                  {isGeneratingFlyer ? <Loader2 className="animate-spin" /> : <Printer size={16} />} Flyer QR
                </button>
                <button onClick={handleResetCycle} className="flex items-center gap-2 glass px-4 py-2 text-white/60 font-bold text-sm"><RefreshCw size={16} /> Reiniciar</button>
                <button onClick={handleDownloadAll} disabled={isDownloading} className="flex items-center gap-2 glass px-4 py-2 text-green-400 font-bold text-sm">
                  {isDownloading ? <Loader2 className="animate-spin" /> : <Download size={16} />} ZIP
                </button>
                <button onClick={() => setIsSettingsOpen(true)} className="glass px-3 py-2 text-white/40 hover:text-white"><Settings size={18} /></button>
              </div>
            </header>

            <div className="flex gap-4 mb-12">
               <label className={`flex-1 py-4 bg-amber-500 text-black rounded-2xl font-black flex items-center justify-center gap-3 cursor-pointer hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/10 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                 {isUploading ? <Loader2 className="animate-spin" size={20} /> : <ImageIcon size={20} />} 
                 {isUploading ? 'SUBIENDO...' : 'SUBIR FOTO'}
                 <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUpload(file); }} />
               </label>
               <label className={`flex-1 py-4 bg-indigo-500 text-white rounded-2xl font-black flex items-center justify-center gap-3 cursor-pointer hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/10 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                 {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Video size={20} />}
                 {isUploading ? 'SUBIENDO...' : 'SUBIR VÍDEO'}
                 <input type="file" accept="video/*" className="hidden" disabled={isUploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUpload(file); }} />
               </label>
               <button onClick={() => { const msg = prompt('Su mensaje:'); if (msg) handleAddMessage(msg); }} disabled={isUploading} className="flex-1 py-4 bg-green-500 text-black rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg shadow-green-500/10 hover:bg-green-400 transition-all disabled:opacity-50">
                 <MessageSquare size={20} /> MENSAJE
               </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-6 font-mono tracking-tighter">Contenido del Evento ({contentItems.length})</h3>
              {contentItems.map((item) => (
                <div key={item.id} className="glass group p-4 flex items-center gap-4 hover:border-white/20 transition-all border border-white/5 rounded-3xl">
                  <div onClick={() => setPreviewItem(item)} className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center overflow-hidden border border-white/10 cursor-zoom-in relative group/thumb">
                    {item.type === 'image' && <img src={item.content_url} className="w-full h-full object-cover opacity-80 group-hover/thumb:opacity-100" />}
                    {item.type === 'video' && <video src={item.content_url} className="w-full h-full object-cover opacity-80" />}
                    {item.type === 'message' && <MessageSquare className="text-green-500" size={24} />}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center"><Play size={20} className="text-white fill-white" /></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate text-lg">{item.type === 'message' ? item.text_content : item.type === 'image' ? '📸 FOTO DE INVITADO' : '🎥 VÍDEO DE INVITADO'}</p>
                    <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest mt-1">
                      <span className="text-white/40">Vistas: <span className={item.display_count >= 3 ? 'text-indigo-400' : 'text-green-500'}>{item.display_count || 0}</span> / 3</span>
                      <span className={!item.is_approved ? 'text-amber-500' : item.display_count >= 3 ? 'text-white/20' : 'text-green-500'}>● {!item.is_approved ? 'Por aprobar' : item.display_count >= 3 ? 'Finalizado' : 'Activo'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!item.is_approved && <button onClick={() => handleApprove(item.id)} className="px-5 py-3 bg-green-500 text-black rounded-xl font-black text-[10px] hover:bg-green-400 flex items-center gap-2 uppercase tracking-tighter"><Check size={14} /> LANZAR</button>}
                    <button onClick={() => { if(confirm('¿Borrar?')) { supabase.from('content_items').delete().eq('id', item.id).then(() => fetchContent(selectedEventId!)); } }} className="p-3 bg-white/5 text-white/20 rounded-xl hover:bg-red-500/20 hover:text-red-500"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {isSettingsOpen && selectedEventId && <SettingsPanel eventId={selectedEventId} onClose={() => setIsSettingsOpen(false)} />}

      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewItem(null)} className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-4xl max-h-full bg-white/5 rounded-[40px] overflow-hidden border border-white/10 shadow-2xl flex flex-col">
               <button onClick={() => setPreviewItem(null)} className="absolute top-6 right-6 z-10 p-3 bg-black/50 text-white rounded-full"><X size={24} /></button>
               <div className="flex-1 flex items-center justify-center bg-black/20 p-4">
                  {previewItem.type === 'image' && <img src={previewItem.content_url} className="max-w-full max-h-[70vh] object-contain rounded-2xl" />}
                  {previewItem.type === 'video' && <video src={previewItem.content_url} className="max-w-full max-h-[70vh] object-contain rounded-2xl" controls autoPlay />}
                  {previewItem.type === 'message' && <div className="p-12 text-center"><h2 className="text-4xl font-black">{previewItem.text_content}</h2></div>}
               </div>
               <div className="p-8 border-t border-white/10 bg-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-white/40 uppercase text-xs font-black tracking-widest mb-1">Estado</p>
                    <p className="font-bold text-xl uppercase tracking-tighter italic">{previewItem.is_approved ? '✅ Publicado' : '⏳ Pendiente'}</p>
                  </div>
                  <div className="flex gap-4">
                    {!previewItem.is_approved && <button onClick={() => { handleApprove(previewItem.id); setPreviewItem(null); }} className="px-8 py-4 bg-green-500 text-black rounded-2xl font-black hover:bg-green-400 transition-all flex items-center gap-2"><Check /> LANZAR AHORA</button>}
                    <button onClick={() => { if(confirm('¿Borrar?')) { supabase.from('content_items').delete().eq('id', previewItem.id).then(() => { fetchContent(selectedEventId!); setPreviewItem(null); }); } }} className="px-8 py-4 bg-white/10 text-red-500/60 rounded-2xl font-black hover:bg-red-500/20"><Trash2 /></button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
