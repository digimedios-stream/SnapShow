import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogOut, Plus, Image as ImageIcon, Video, MessageSquare, Settings, ExternalLink, Trash2, Sparkles, Link as LinkIcon, Share2, Check, Download, Loader2, Printer, RefreshCw, Monitor, Play, X, AlertTriangle, ShieldCheck, ShieldOff, Zap, ArrowLeft, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import { SettingsPanel } from './SettingsPanel';
import { ThemeOnboarding } from './ThemeOnboarding';
import { LiveMonitor } from './LiveMonitor';
import { usePWAInstall } from '../hooks/usePWAInstall';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const AdminDashboard = () => {
  const navigate = useNavigate();
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
  const [isMonitorVisible, setIsMonitorVisible] = useState(false);
  const [showFinished, setShowFinished] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [autoApprove, setAutoApprove] = useState(false);
  const [showAutoApproveWarning, setShowAutoApproveWarning] = useState(false);
  const [togglingAutoApprove, setTogglingAutoApprove] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isInstallable, installPWA } = usePWAInstall();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    
    fetchContent(selectedEventId);
    fetchAutoApprove(selectedEventId);

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

  const fetchAutoApprove = async (eventId: string) => {
    const { data } = await supabase
      .from('event_settings')
      .select('auto_approve')
      .eq('event_id', eventId)
      .maybeSingle();
    setAutoApprove(data?.auto_approve === true);
  };

  const handleToggleAutoApprove = async (enable: boolean) => {
    if (enable) {
      setShowAutoApproveWarning(true);
      return;
    }
    // Desactivar es seguro, no necesita advertencia
    setTogglingAutoApprove(true);
    await supabase
      .from('event_settings')
      .update({ auto_approve: false })
      .eq('event_id', selectedEventId);
    setAutoApprove(false);
    setTogglingAutoApprove(false);
  };

  const confirmAutoApprove = async () => {
    setTogglingAutoApprove(true);
    // 1. Activar auto_approve en settings
    await supabase
      .from('event_settings')
      .update({ auto_approve: true })
      .eq('event_id', selectedEventId);
    
    // 2. Aprobar automáticamente todos los pendientes (incluye null y false)
    await supabase
      .from('content_items')
      .update({ is_approved: true })
      .eq('event_id', selectedEventId)
      .or('is_approved.eq.false,is_approved.is.null');
    
    setAutoApprove(true);
    setShowAutoApproveWarning(false);
    setTogglingAutoApprove(false);
    if (selectedEventId) fetchContent(selectedEventId);
  };

  const fetchInitialData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // Check user role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role || 'client';

    let targetClientId = user.id;

    if (userRole === 'superadmin') {
      const impersonateId = localStorage.getItem('impersonate_client_id');
      if (!impersonateId) {
        navigate('/superadmin');
        return;
      }
      targetClientId = impersonateId;
      setIsAdmin(true); // Is impersonating
    } else {
      setIsAdmin(false);
    }

    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('client_id', targetClientId)
      .order('created_at', { ascending: false });
    
    if (data) {
      setEvents(data);
      if (data.length > 0) {
        const targetId = selectedEventId || data[0].id;
        setSelectedEventId(targetId);
        const { data: settings } = await supabase.from('event_settings').select('onboarding_completed').eq('event_id', targetId).maybeSingle();
        setOnboardingFinished(settings?.onboarding_completed === true);
      }
    }
  };

  const fetchEventsForAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    let targetClientId = user.id;
    if (profile?.role === 'superadmin') {
      const impersonateId = localStorage.getItem('impersonate_client_id');
      if (impersonateId) targetClientId = impersonateId;
    }

    const { data } = await supabase.from('events').select('*').eq('client_id', targetClientId).order('created_at', { ascending: false });
    
    if (data) setEvents(data);
    if (data && data.length > 0 && !selectedEventId) {
      setSelectedEventId(data[0].id);
    }
  };

  const handleResetCycle = async () => {
    if (!confirm('¿Quieres reiniciar el contador de vistas? Todas las fotos volverán a aparecer en el carrusel.')) return;
    await supabase.from('content_items').update({ display_count: 0 }).eq('event_id', selectedEventId);
    if (selectedEventId) fetchContent(selectedEventId);
    alert('✅ Ciclo reiniciado. Todo el contenido volverá a mostrarse.');
  };


  const handleDeleteAllMedia = async () => {
    const confirm1 = confirm('⚠️ ¡ATENCIÓN! Estás a punto de eliminar PERMANENTEMENTE todas las fotos, videos y mensajes de este evento.');
    if (!confirm1) return;
    
    const confirm2 = confirm('🛑 Esta acción NO se puede deshacer. ¿Ya descargaste los archivos en tu PC? Te recomendamos usar el botón ZIP antes de borrar.\n\n¿BORRAR TODO DE TODAS FORMAS?');
    if (!confirm2) return;

    try {
      setIsDownloading(true); // Usamos este estado para bloquear la UI

      // 1. Limpiar Storage (Buckets: images y videos)
      const buckets = ['images', 'videos'];
      for (const bucket of buckets) {
        const { data: files, error: listError } = await supabase.storage.from(bucket).list(selectedEventId!);
        
        if (listError) {
          console.error(`Error listando bucket ${bucket}:`, listError);
          continue;
        }

        if (files && files.length > 0) {
          const pathsToDelete = files.map(f => `${selectedEventId}/${f.name}`);
          await supabase.storage.from(bucket).remove(pathsToDelete);
        }
      }

      // 2. Borrar de la base de datos
      const { error } = await supabase
        .from('content_items')
        .delete()
        .eq('event_id', selectedEventId);

      if (error) throw error;

      alert('✅ Todo el contenido ha sido eliminado permanentemente.');
      if (selectedEventId) fetchContent(selectedEventId);
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
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
      // First delete dependent items (though RLS might handle some, it's better to be explicit in the client)
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
    
    let fileToUpload: File | Blob = file;
    const isVideo = file.type.startsWith('video/');
    
    if (!isVideo && file.type.startsWith('image/')) {
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: 'image/webp'
        };
        fileToUpload = await imageCompression(file, options);
      } catch (error) {
        console.error('Error compressing image:', error);
      }
    }

    const bucket = isVideo ? 'videos' : 'images';
    const fileExt = isVideo ? (file.name.split('.').pop() || 'mp4') : 'webp';
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${selectedEventId}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileToUpload);

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
  const maxDisplays = 3; // Valor por defecto simple para evitar errores de renderizado complejo

  const getOnboardingStatus = () => {
    if (!currentEvent?.event_settings) return false;
    const settings = currentEvent.event_settings;
    return Array.isArray(settings) ? settings[0]?.onboarding_completed === true : settings?.onboarding_completed === true;
  };

  return (
    <div className="h-screen bg-[#0a0a0a] text-white flex overflow-hidden">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {currentEvent && onboardingFinished === false && (
        <ThemeOnboarding eventId={currentEvent.id} initialName={currentEvent.name} onComplete={() => { setOnboardingFinished(true); window.location.reload(); }} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-[#0a0a0a] border-r border-white/10 p-6 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-center gap-0 mb-10 px-2">
          {/* Logo (Símbolo) */}
          <img src="/hero_phone.png" alt="Logo" style={{ height: '72px' }} className="w-auto object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]" />
          {/* Logotipo (Texto) */}
          <img src="/logo_text.png" alt="SnapShow" style={{ height: '72px', marginLeft: '-12px' }} className="w-auto object-contain" />
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto pr-2">
          {events.map((event) => (
             <div key={event.id} className="group flex items-center gap-1">
               <button onClick={() => setSelectedEventId(event.id)} className={`flex-1 text-left px-4 py-3 rounded-xl transition-all ${selectedEventId === event.id ? 'bg-indigo-500/20 text-indigo-400 font-bold' : 'hover:bg-white/5 text-white/60'}`}>
                 <span className="truncate block w-32">{event.name}</span>
               </button>
                {(isAdmin || event.client_id === userId) && (
                 <button onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id, event.name); }} className="p-2 text-white/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
               )}
             </div>
          ))}
          <button onClick={() => { const name = prompt('Nombre del nuevo evento:'); if (name) handleCreateEvent(name); }} className="w-full mt-4 border border-dashed border-white/10 p-4 rounded-xl text-white/20 hover:text-indigo-400 flex items-center justify-center gap-2 group italic text-xs capitalize transition-all active:scale-95"><Plus size={14} /> Nuevo Evento</button>
        </nav>

        {isInstallable && (
          <button onClick={installPWA} className="mt-6 flex justify-center items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transition-all border border-indigo-400/30">
            <Download size={16} /> Instalar App
          </button>
        )}

        {isAdmin && localStorage.getItem('impersonate_client_id') && (
          <button onClick={() => {
            localStorage.removeItem('impersonate_client_id');
            localStorage.removeItem('impersonate_client_name');
            navigate('/superadmin');
          }} className="mt-6 flex items-center gap-2 px-4 py-2 text-indigo-400 hover:text-indigo-300 border-t border-white/5 pt-6 font-bold text-xs uppercase tracking-widest">
            <ArrowLeft size={16} /> Volver a SuperAdmin
          </button>
        )}
        <button onClick={() => supabase.auth.signOut()} className={`${isAdmin && localStorage.getItem('impersonate_client_id') ? 'mt-2 border-none pt-0' : 'mt-6 border-t border-white/5 pt-6'} flex items-center gap-2 px-4 py-2 text-white/40 hover:text-red-400 font-bold text-xs uppercase tracking-widest`}><LogOut size={16} /> Salir</button>
        
        <footer className="mt-8 pt-8 pb-4 text-center px-6 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
          <div className="space-y-1.5">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/60 drop-shadow-lg">
              © SnapShow <span className="text-indigo-500">2026</span>
            </p>
            <div className="flex items-center justify-center gap-2 opacity-80">
              <span className="h-[1px] w-6 bg-white/10" />
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.4em]">
                Premium <span className="text-white/60">Experience</span>
              </p>
              <span className="h-[1px] w-6 bg-white/10" />
            </div>
            <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mt-4">
              POWERED BY <span className="text-indigo-400">DIGIMEDIOS APPS</span>
            </p>
          </div>
        </footer>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <img src="/logo_text.png" alt="SnapShow" className="h-8 object-contain" />
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 glass rounded-xl"><Menu size={20} /></button>
        </div>

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
              <div className="flex flex-wrap gap-2 md:gap-3">
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
                <button onClick={handleResetCycle} className="flex items-center gap-2 glass px-4 py-2 text-white/60 font-bold text-sm hover:bg-white/5 transition-all" title="Reiniciar ciclo de visualización"><RefreshCw size={16} /> Reiniciar</button>
                <button onClick={handleDownloadAll} disabled={isDownloading} className="flex items-center gap-2 glass px-4 py-2 text-green-400 font-bold text-sm hover:bg-white/5 transition-all">
                  {isDownloading ? <Loader2 className="animate-spin" /> : <Download size={16} />} ZIP
                </button>
                <button onClick={handleDeleteAllMedia} disabled={isDownloading} className="flex items-center gap-2 glass px-4 py-2 text-red-400 font-bold text-sm hover:bg-red-500/10 transition-all border-red-500/20" title="Borrar todo permanentemente">
                  <Trash2 size={16} /> Borrar Todo
                </button>
                <button 
                  onClick={() => setIsMonitorVisible(!isMonitorVisible)} 
                  className={`flex items-center gap-2 glass px-4 py-2 font-bold text-sm transition-all ${isMonitorVisible ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'text-indigo-400 hover:bg-white/5'}`}
                >
                  <Monitor size={16} /> {isMonitorVisible ? 'Cerrar Monitor' : 'Abrir Monitor'}
                </button>
                <button onClick={() => setIsSettingsOpen(true)} className="glass px-3 py-2 text-white/40 hover:text-white"><Settings size={18} /></button>
              </div>
            </header>

            {/* Auto-Approve Toggle Card */}
            <div 
              className={`mb-8 p-4 rounded-2xl border transition-all duration-500 flex items-center justify-between gap-4 ${
                autoApprove 
                  ? 'bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-500/5' 
                  : 'bg-white/[0.02] border-white/10'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-all duration-500 ${
                  autoApprove 
                    ? 'bg-amber-500/20 text-amber-400' 
                    : 'bg-white/5 text-white/30'
                }`}>
                  {autoApprove ? <Zap size={22} /> : <ShieldCheck size={22} />}
                </div>
                <div>
                  <p className={`text-sm font-bold tracking-tight transition-colors duration-300 ${autoApprove ? 'text-amber-300' : 'text-white/60'}`}>
                    {autoApprove ? '⚡ AUTO-APROBACIÓN ACTIVA' : '🛡️ REVISIÓN DE CONTENIDO'}
                  </p>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">
                    {autoApprove ? 'El contenido se publica sin revisión previa' : 'Todo el contenido requiere aprobación manual'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleToggleAutoApprove(!autoApprove)}
                disabled={togglingAutoApprove}
                className={`relative w-14 h-7 rounded-full transition-all duration-500 flex-shrink-0 ${
                  autoApprove 
                    ? 'bg-amber-500 shadow-lg shadow-amber-500/40' 
                    : 'bg-white/10'
                } ${togglingAutoApprove ? 'opacity-50' : 'cursor-pointer'}`}
              >
                <motion.div
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={`absolute top-0.5 w-6 h-6 rounded-full shadow-md ${
                    autoApprove 
                      ? 'left-[30px] bg-white' 
                      : 'left-0.5 bg-white/60'
                  }`}
                />
              </button>
            </div>

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
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 font-mono tracking-tighter">
                  Contenido del Evento ({contentItems.filter(it => (it.display_count || 0) < maxDisplays).length})
                </h3>
                <button 
                  onClick={() => setShowFinished(!showFinished)}
                  className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${showFinished ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'border-white/10 text-white/20 hover:text-white/40'}`}
                >
                  {showFinished ? '● Ocultar Finalizados' : '○ Ver Finalizados'}
                </button>
              </div>
              
              {contentItems
                .filter(item => showFinished || (item.display_count || 0) < maxDisplays)
                .map((item) => (
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
                      <span className="text-white/40">Vistas: <span className={(item.display_count || 0) >= maxDisplays ? 'text-indigo-400' : 'text-green-500'}>{item.display_count || 0}</span> / {maxDisplays}</span>
                      <span className={!item.is_approved ? 'text-amber-500' : (item.display_count || 0) >= maxDisplays ? 'text-white/20' : 'text-green-500'}>
                        ● {!item.is_approved ? 'Por aprobar' : (item.display_count || 0) >= maxDisplays ? 'Finalizado' : 'Activo'}
                      </span>
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

      <AnimatePresence>
        {isMonitorVisible && selectedEventId && (
          <LiveMonitor eventId={selectedEventId} onClose={() => setIsMonitorVisible(false)} />
        )}
      </AnimatePresence>

      {/* Auto-Approve Warning Modal */}
      <AnimatePresence>
        {showAutoApproveWarning && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowAutoApproveWarning(false)} 
              className="absolute inset-0 bg-black/90 backdrop-blur-xl" 
            />
            <motion.div 
              initial={{ scale: 0.85, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="relative w-full max-w-md bg-[#141414] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl"
            >
              {/* Header glow */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
              
              <div className="p-8 text-center">
                {/* Warning Icon */}
                <div className="relative mx-auto w-20 h-20 mb-6">
                  <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-20 h-20 bg-amber-500/10 border-2 border-amber-500/40 rounded-full flex items-center justify-center">
                    <AlertTriangle className="text-amber-400" size={36} />
                  </div>
                </div>

                <h3 className="text-2xl font-black tracking-tight mb-2">
                  ¿Desactivar la revisión?
                </h3>
                <p className="text-white/40 text-sm leading-relaxed mb-2">
                  Todo el contenido subido por los invitados
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
                  <span className="text-amber-400 text-sm font-bold">📸 Fotos</span>
                  <span className="text-white/20">•</span>
                  <span className="text-amber-400 text-sm font-bold">🎥 Videos</span>
                  <span className="text-white/20">•</span>
                  <span className="text-amber-400 text-sm font-bold">✍️ Mensajes</span>
                </div>
                <p className="text-white/40 text-sm leading-relaxed">
                  aparecerá <span className="text-amber-400 font-bold">DIRECTAMENTE</span> en la pantalla de proyección sin tu aprobación previa.
                </p>

                {contentItems.filter(i => !i.is_approved).length > 0 && (
                  <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-[11px] text-white/50">
                      <span className="text-amber-400 font-bold">{contentItems.filter(i => !i.is_approved).length}</span> items pendientes serán aprobados automáticamente.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-6 pt-0 flex gap-3">
                <button 
                  onClick={() => setShowAutoApproveWarning(false)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold text-white/60 transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmAutoApprove}
                  disabled={togglingAutoApprove}
                  className="flex-1 py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-2xl font-black text-white transition-all active:scale-95 shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {togglingAutoApprove ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                  Sí, desactivar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
