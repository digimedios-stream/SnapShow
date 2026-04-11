import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogOut, Plus, Image as ImageIcon, Video, MessageSquare, Settings, ExternalLink, Trash2, Sparkles, Link as LinkIcon, Share2, Copy, Check } from 'lucide-react';
import { SettingsPanel } from './SettingsPanel';

export const AdminDashboard = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<any>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchContent(selectedEventId);

      // Real-time subscription for content updates
      const channel = supabase
        .channel(`admin_content_${selectedEventId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'content_items',
          // removing specific filter here to ensure deletes are always captured
        }, (payload: any) => {
          // Check if the change belongs to our current event
          if (payload.new?.event_id === selectedEventId || payload.old?.event_id === selectedEventId) {
            fetchContent(selectedEventId);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*');
    if (data) setEvents(data);
    if (data && data.length > 0 && !selectedEventId) {
      setSelectedEventId(data[0].id);
    }
  };

  const fetchContent = async (id: string) => {
    const { data } = await supabase
      .from('content_items')
      .select('*')
      .eq('event_id', id)
      .order('is_approved', { ascending: true }) // Unapproved first
      .order('type', { ascending: false })      // Videos first ('video' > 'message' > 'image')
      .order('sort_order', { ascending: false });
    if (data) setContentItems(data);
  };

  const handleApprove = async (id: string) => {
    await supabase
      .from('content_items')
      .update({ is_approved: true })
      .eq('id', id);
    if (previewItem?.id === id) setPreviewItem(null);
  };

  const openPopOut = () => {
    if (selectedEventId) {
      const url = `/screen?id=${selectedEventId}`;
      window.open(url, 'ProjectionScreen', 'width=1280,height=720');
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

  const handleUpload = async (file: File, type: 'image' | 'video') => {
    if (!selectedEventId) return;
    
    const bucket = type === 'image' ? 'images' : 'videos';
    const filePath = `${selectedEventId}/${Math.random()}-${file.name}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);
      
    if (uploadError) {
      alert('Error al subir: ' + uploadError.message);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

    await supabase.from('content_items').insert({
      event_id: selectedEventId,
      type: type,
      content_url: publicUrl,
      sort_order: contentItems.length,
      is_approved: true
    });

    fetchContent(selectedEventId);
  };

  const handleAddMessage = async () => {
    if (!selectedEventId) return;
    const msg = prompt('Escribe tu mensaje:');
    if (!msg) return;

    await supabase.from('content_items').insert({
      event_id: selectedEventId,
      type: 'message',
      text_content: msg,
      sort_order: contentItems.length,
      is_approved: true
    });

    fetchContent(selectedEventId);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleCreateEvent = async () => {
    const name = prompt('Nombre del nuevo evento:');
    if (!name) return;

    // Get the first client for now (in a real SaaS this would be user's client)
    const { data: clients } = await supabase.from('clients').select('id').limit(1);
    if (!clients || clients.length === 0) {
      alert('No se encontró un cliente asociado.');
      return;
    }

    const { data: newEvent, error } = await supabase.from('events').insert({
      name,
      client_id: clients[0].id,
      type: 'generic',
      is_active: true
    }).select().single();

    if (error) {
      alert('Error: ' + error.message);
      return;
    }

    // Create default settings for the new event
    await supabase.from('event_settings').insert({
      event_id: newEvent.id,
      slide_duration: 5,
      theme_id: 'default',
      background_animation: 'lights'
    });

    await fetchEvents();
    setSelectedEventId(newEvent.id);
  };

  const deleteItem = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar este contenido?')) return;
    await supabase.from('content_items').delete().eq('id', id);
    if (selectedEventId) fetchContent(selectedEventId);
    if (previewItem?.id === id) setPreviewItem(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-12">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-xl" 
            onClick={() => setPreviewItem(null)}
          />
          <div className="relative glass-card max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border-white/20">
            <button 
              onClick={() => setPreviewItem(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white/60 hover:text-white transition-all"
            >
              <Plus className="rotate-45" size={24} />
            </button>
            
            <div className="flex-1 bg-black/40 flex items-center justify-center overflow-hidden">
              {previewItem.type === 'video' ? (
                <video 
                  src={previewItem.content_url} 
                  controls 
                  autoPlay 
                  className="max-h-full w-auto"
                />
              ) : (
                <img 
                  src={previewItem.content_url} 
                  className="max-h-full w-auto object-contain"
                  alt="Full preview"
                />
              )}
            </div>

            <div className="p-6 bg-white/5 border-t border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xl font-bold">Previsualizar Contenido</p>
                <p className="text-white/40 capitalize">{previewItem.type}</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => deleteItem(previewItem.id)}
                  className="px-6 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold transition-all"
                >
                  Eliminar
                </button>
                {!previewItem.is_approved && (
                  <button 
                    onClick={() => handleApprove(previewItem.id)}
                    className="px-8 py-3 bg-green-500 text-black hover:bg-green-400 rounded-xl font-bold transition-all flex items-center gap-2"
                  >
                    <Check size={20} /> Aprobar Ahora
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Settings Panel */}
      {isSettingsOpen && selectedEventId && (
        <SettingsPanel 
          eventId={selectedEventId} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Sparkles size={20} />
          </div>
          <h2 className="text-xl font-bold text-gradient-primary tracking-tight">SnapShow</h2>
        </div>
        
        <nav className="flex-1 space-y-2">
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => setSelectedEventId(event.id)}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                selectedEventId === event.id ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'hover:bg-white/5'
              }`}
            >
              {event.name}
            </button>
          ))}
          <button 
            onClick={handleCreateEvent}
            className="w-full flex items-center gap-2 px-4 py-2 text-white/40 hover:text-white transition-colors"
          >
            <Plus size={18} /> Nuevo Evento
          </button>
        </nav>

        <button 
          onClick={handleSignOut}
          className="mt-auto flex items-center gap-2 px-4 py-2 text-white/40 hover:text-red-400 transition-colors"
        >
          <LogOut size={18} /> Salir
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {selectedEventId ? (
          <div className="max-w-5xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
              <div>
                <h1 className="text-3xl font-bold text-gradient">{events.find(e => e.id === selectedEventId)?.name}</h1>
                <p className="text-white/40">Gestiona el contenido y la proyección en vivo</p>
              </div>
              <div className="flex flex-wrap gap-4 items-center">
                {/* Dynamic QR Preview */}
                <div className="hidden lg:flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2 pr-4">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(`${window.location.origin}/guest?id=${selectedEventId}`)}`}
                    alt="QR Code"
                    className="w-12 h-12 rounded-lg bg-white p-1"
                  />
                  <div className="text-xs">
                    <p className="text-white/40 mb-0.5">Acceso Invitados</p>
                    <p className="font-mono text-[10px] text-white/20">Scan to upload</p>
                  </div>
                </div>

                <button 
                  onClick={copyGuestLink}
                  className="flex items-center gap-2 glass px-6 py-2 hover:bg-white/10 transition-colors text-indigo-400 font-medium"
                >
                  {copied ? <Check size={18} className="text-green-500" /> : <LinkIcon size={18} />}
                  {copied ? '¡Copiado!' : 'Link de Invitados'}
                </button>
                <button 
                  onClick={openPopOut}
                  className="flex items-center gap-2 glass px-6 py-2 hover:bg-white/10 transition-colors text-purple-400 font-medium"
                >
                  <ExternalLink size={18} /> Proyectar Screen
                </button>
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-2 glass px-4 py-2 hover:bg-white/10 transition-colors text-white/60"
                >
                  <Settings size={18} />
                </button>
              </div>
            </header>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <label className="glass-card p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-indigo-500/50">
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file, 'image');
                  }} 
                />
                <div className="p-3 bg-indigo-500/10 rounded-full text-indigo-400"><ImageIcon size={24} /></div>
                <span>Subir Foto</span>
              </label>

              <label className="glass-card p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-purple-500/50">
                <input 
                  type="file" 
                  className="hidden" 
                  accept="video/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file, 'video');
                  }} 
                />
                <div className="p-3 bg-purple-500/10 rounded-full text-purple-400"><Video size={24} /></div>
                <span>Subir Video</span>
              </label>

              <button 
                onClick={handleAddMessage}
                className="glass-card p-6 flex flex-col items-center gap-3"
              >
                <div className="p-3 bg-green-500/10 rounded-full text-green-400"><MessageSquare size={24} /></div>
                <span>Nuevo Mensaje</span>
              </button>
            </div>

            {/* Content List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Contenido del Carrusel</h3>
              {contentItems.map((item) => (
                <div key={item.id} className={`glass-card p-4 flex items-center gap-4 ${!item.is_approved ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
                  <div 
                    className="w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center overflow-hidden relative cursor-pointer group"
                    onClick={() => item.type !== 'message' && setPreviewItem(item)}
                  >
                    {item.type?.toLowerCase() === 'message' ? (
                      <MessageSquare size={24} className="text-white/20" />
                    ) : item.type?.toLowerCase() === 'video' ? (
                      <video 
                        src={`${item.content_url}#t=0.1`} 
                        className="w-full h-full object-cover bg-black" 
                        muted 
                        playsInline 
                        preload="metadata"
                      />
                    ) : (
                      <img 
                        src={item.content_url} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                      />
                    )}
                    {!item.is_approved && (
                      <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                        <span className="text-[8px] font-bold uppercase tracking-tighter bg-amber-500 text-black px-1 rounded">Pendiente</span>
                      </div>
                    )}
                    {item.type !== 'message' && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                         <Plus size={20} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium line-clamp-1">{item.type === 'message' ? item.text_content : 'Archivo multimedia'}</p>
                    <p className="text-sm text-white/40 capitalize">{item.type}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!item.is_approved && (
                      <button 
                        onClick={() => handleApprove(item.id)}
                        className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white rounded-lg transition-all"
                        title="Aprobar"
                      >
                        <Check size={18} />
                      </button>
                    )}
                    <button 
                      onClick={() => deleteItem(item.id)} 
                      className="p-2 text-white/20 hover:text-red-500 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {contentItems.length === 0 && (
                <div className="text-center py-12 glass rounded-2xl border-dashed">
                  <p className="text-white/20">No hay contenido aún. ¡Agrega algo arriba!</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-white/20">
            Selecciona un evento para comenzar
          </div>
        )}
      </main>
    </div>
  );
};
