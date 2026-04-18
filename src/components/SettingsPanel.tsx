import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Save, Clock, Palette, QrCode, Image as ImageIcon, Upload, Loader2, Check } from 'lucide-react';

interface SettingsPanelProps {
  eventId: string;
  onClose: () => void;
}

export const SettingsPanel = ({ eventId, onClose }: SettingsPanelProps) => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, [eventId]);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('event_settings')
      .select('*')
      .eq('event_id', eventId)
      .single();
    
    if (data) {
      setSettings(data);
    } else if (error) {
      console.error('Error fetching settings:', error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    
    // Usamos upsert para asegurar que si no existe la fila, se cree
    const { error } = await supabase
      .from('event_settings')
      .upsert({
        event_id: eventId, // Es vital incluir el event_id para el upsert
        slide_duration: settings.slide_duration,
        background_animation: settings.background_animation,
        show_qr: settings.show_qr,
        show_logo: settings.show_logo,
        qr_url: settings.qr_url,
        logo_url: settings.logo_url
      }, { onConflict: 'event_id' });
    
    if (error) {
      console.error('Error de Supabase:', error);
      alert('Error de base de datos: ' + error.message);
    } else {
      setSaving(false);
      // Forzamos un aviso de éxito
      alert('✅ ¡Configuración guardada correctamente!');
      onClose();
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !eventId) return;

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${eventId}/logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
      setSettings({ ...settings, logo_url: publicUrl, show_logo: true });
    } catch (err: any) {
      alert('Error al subir logo: ' + err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) return (
    <div className="fixed inset-y-0 right-0 w-80 bg-[#0f0f0f] border-l border-white/10 z-50 flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500" />
    </div>
  );

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-[#0f0f0f] border-l border-white/10 shadow-2xl z-50 flex flex-col font-sans">
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Palette className="text-indigo-400" size={20} />
            Ajustes del Evento
          </h3>
          <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Version 2.1 • Pro</span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Toggle Sections */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setSettings({ ...settings, show_qr: !settings.show_qr })}
            className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 items-center ${settings.show_qr ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-white/5 border-white/5 text-white/40'}`}
          >
            <QrCode size={20} />
            <span className="text-xs font-bold uppercase">Código QR</span>
            <div className={`text-[10px] px-2 py-0.5 rounded-full ${settings.show_qr ? 'bg-indigo-500 text-white' : 'bg-white/10'}`}>
              {settings.show_qr ? 'ON' : 'OFF'}
            </div>
          </button>

          <button 
            onClick={() => setSettings({ ...settings, show_logo: !settings.show_logo })}
            className={`p-4 rounded-2xl border transition-all flex flex-col gap-2 items-center ${settings.show_logo ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' : 'bg-white/5 border-white/5 text-white/40'}`}
          >
            <ImageIcon size={20} />
            <span className="text-xs font-bold uppercase">Logo</span>
            <div className={`text-[10px] px-2 py-0.5 rounded-full ${settings.show_logo ? 'bg-purple-500 text-white' : 'bg-white/10'}`}>
              {settings.show_logo ? 'ON' : 'OFF'}
            </div>
          </button>
        </div>

        {/* Logo Upload Section */}
        {settings.show_logo && (
           <div className="space-y-3 p-4 bg-white/5 rounded-2xl border border-white/5">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Cargar Logo Personalizado</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-black rounded-lg border border-white/10 flex items-center justify-center overflow-hidden">
                  {settings.logo_url ? <img src={settings.logo_url} className="w-full h-full object-contain" /> : <ImageIcon size={20} className="text-white/20" />}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
                >
                  {uploadingLogo ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  Cambiar
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </div>
           </div>
        )}

        {/* Background Animation Selection */}
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-white/40 tracking-widest flex items-center gap-2">
            <Palette size={14} /> Animación de Fondo
          </label>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'aurora', label: 'Aurora', color: 'from-blue-600 to-purple-600' },
              { id: 'lights', label: 'Neón', color: 'bg-blue-500/20 border-blue-500/50' },
              { id: 'gold', label: 'Festivo', color: 'from-amber-600 to-yellow-400' },
              { id: 'bokeh', label: 'Burbujas', color: 'bg-slate-700' },
              { id: 'stars', label: 'Estrellas', color: 'bg-[#020617]' },
              { id: 'mesh', label: 'Mesh', color: 'from-indigo-600 via-purple-600 to-pink-600' },
              { id: 'none', label: 'Limpio', color: 'bg-zinc-800' },
            ].map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSettings({ ...settings, background_animation: theme.id })}
                className={`group relative h-20 rounded-xl border transition-all overflow-hidden flex flex-col items-center justify-center gap-1 ${settings.background_animation === theme.id ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-white/10 hover:border-white/20'}`}
              >
                <div className={`absolute inset-0 opacity-40 bg-gradient-to-br ${theme.color} ${theme.id === 'lights' || theme.id === 'bokeh' || theme.id === 'stars' || theme.id === 'none' ? theme.color : ''}`} />
                <span className="relative z-10 text-[10px] font-black uppercase tracking-tighter text-white">{theme.label}</span>
                {settings.background_animation === theme.id && <div className="relative z-10 w-1 h-1 bg-white rounded-full animate-ping" />}
              </button>
            ))}
          </div>

          <label className="text-[10px] font-black uppercase text-white/40 tracking-widest mt-4 block">Videos de Fondo (HD)</label>
          <div className="grid grid-cols-5 gap-2">
            {[...Array(10)].map((_, i) => {
              const val = `video_${i + 1}`;
              return (
                <button
                  key={val}
                  onClick={() => setSettings({ ...settings, background_animation: val })}
                  className={`aspect-square rounded-lg border flex items-center justify-center transition-all ${settings.background_animation === val ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/40 scale-110' : 'bg-white/5 border-white/5 text-white/20 hover:bg-white/10'}`}
                >
                  <span className="text-xs font-black">{i + 1}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Slide Duration */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-white/40 tracking-widest flex items-center gap-2">
            <Clock size={14} /> Duración de diapositiva
          </label>
          <div className="flex items-center gap-3">
            <input 
              type="range" min="1" max="20"
              value={settings.slide_duration}
              onChange={(e) => setSettings({ ...settings, slide_duration: parseInt(e.target.value) })}
              className="flex-1 accent-indigo-500"
            />
            <span className="w-12 text-center font-bold text-indigo-400 bg-indigo-500/10 rounded-lg py-1">{settings.slide_duration}s</span>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-white/10 bg-black/40">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" /> : <><Check size={20} /> GUARDAR CONFIGURACIÓN</>}
        </button>
      </div>
    </div>
  );
};
