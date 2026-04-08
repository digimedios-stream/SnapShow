import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogOut, Plus, Image as ImageIcon, Video, MessageSquare, Settings, ExternalLink, Trash2 } from 'lucide-react';

export const AdminDashboard = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [contentItems, setContentItems] = useState<any[]>([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchContent(selectedEventId);
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
      .order('sort_order', { ascending: true });
    if (data) setContentItems(data);
  };

  const openPopOut = () => {
    if (selectedEventId) {
      const url = `/screen?id=${selectedEventId}`;
      window.open(url, 'ProjectionScreen', 'width=1280,height=720');
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
      sort_order: contentItems.length
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
      sort_order: contentItems.length
    });

    fetchContent(selectedEventId);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const deleteItem = async (id: string) => {
    await supabase.from('content_items').delete().eq('id', id);
    if (selectedEventId) fetchContent(selectedEventId);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 p-6 flex flex-col">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gradient-primary">Eventos</h2>
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
          <button className="w-full flex items-center gap-2 px-4 py-2 text-white/40 hover:text-white transition-colors">
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
            <header className="flex justify-between items-center mb-12">
              <div>
                <h1 className="text-3xl font-bold text-gradient">{events.find(e => e.id === selectedEventId)?.name}</h1>
                <p className="text-white/40">Gestiona el contenido y la proyección en vivo</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={openPopOut}
                  className="flex items-center gap-2 glass px-6 py-2 hover:bg-white/10 transition-colors text-indigo-400"
                >
                  <ExternalLink size={18} /> Proyectar en HD
                </button>
                <button className="flex items-center gap-2 glass px-6 py-2 hover:bg-white/10 transition-colors">
                  <Settings size={18} /> Ajustes
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
                <div key={item.id} className="glass-card p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center overflow-hidden">
                    {item.type === 'message' ? <MessageSquare size={24} className="text-white/20" /> : <img src={item.content_url} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.type === 'message' ? item.text_content : 'Archivo multimedia'}</p>
                    <p className="text-sm text-white/40 capitalize">{item.type}</p>
                  </div>
                  <button onClick={() => deleteItem(item.id)} className="p-2 text-white/20 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
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
