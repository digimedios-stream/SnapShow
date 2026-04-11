import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Save, Clock, Palette, QrCode, Image as ImageIcon } from 'lucide-react';

interface SettingsPanelProps {
  eventId: string;
  onClose: () => void;
}

export const SettingsPanel = ({ eventId, onClose }: SettingsPanelProps) => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [eventId]);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('event_settings')
      .select('*')
      .eq('event_id', eventId)
      .single();
    
    if (data) setSettings(data);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('event_settings')
      .update(settings)
      .eq('event_id', eventId);
    
    if (error) alert('Error al guardar: ' + error.message);
    setSaving(false);
    onClose();
  };

  if (loading) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-[#0f0f0f] border-l border-white/10 shadow-2xl z-50 flex flex-col">
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Palette className="text-indigo-400" size={20} />
          Ajustes del Evento
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Slide Duration */}
        <div className="space-y-3">
          <label className="text-sm text-white/40 flex items-center gap-2">
            <Clock size={16} /> Duración de diapositiva (seg)
          </label>
          <input 
            type="number" 
            value={settings.slide_duration}
            onChange={(e) => setSettings({ ...settings, slide_duration: parseInt(e.target.value) })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-indigo-500/50 focus:outline-none"
          />
        </div>

        {/* Background Animation */}
        <div className="space-y-3">
          <label className="text-sm text-white/40 flex items-center gap-2">
            <Palette size={16} /> Animación de Fondo
          </label>
          <select 
            value={settings.background_animation}
            onChange={(e) => setSettings({ ...settings, background_animation: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:border-indigo-500/50 focus:outline-none appearance-none"
          >
            <option value="lights">Luces Neón</option>
            <option value="bokeh">Burbujas (Bokeh)</option>
            <option value="particles" disabled>Partículas (Próximamente)</option>
            <option value="none">Sin fondo</option>
          </select>
        </div>

        {/* Visibility Toggles */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-sm">Mostrar Código QR</span>
            <button 
              onClick={() => setSettings({ ...settings, show_qr: !settings.show_qr })}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.show_qr ? 'bg-indigo-600' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.show_qr ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Mostrar Logo</span>
            <button 
              onClick={() => setSettings({ ...settings, show_logo: !settings.show_logo })}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.show_logo ? 'bg-indigo-600' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.show_logo ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </div>

        {/* QR & Logo URLs (Simplified for now) */}
        <div className="space-y-3 pt-4 border-t border-white/5">
          <label className="text-sm text-white/40 flex items-center gap-2">
            <QrCode size={16} /> URL del Código QR (Custom)
          </label>
          <input 
            type="text" 
            placeholder="Dejar vacío para auto-generar"
            value={settings.qr_url || ''}
            onChange={(e) => setSettings({ ...settings, qr_url: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-xs focus:border-indigo-500/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="p-6 border-t border-white/10">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
        >
          {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
          Guardar Cambios
        </button>
      </div>
    </div>
  );
};
