import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Send, CheckCircle2, Loader2, Image as ImageIcon, Video, MessageSquare, X, RotateCw, Play, Trash2, Check } from 'lucide-react';

type ViewState = 'menu' | 'camera' | 'gallery' | 'message' | 'preview';

export const GuestUpload = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id');
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>('menu');
  
  // Camera & Media States
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [capturedMedia, setCapturedMedia] = useState<{ blob: Blob; url: string; type: 'image' | 'video' } | null>(null);
  
  // Form States
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    async function fetchEvent() {
      if (!eventId) {
        setLoading(false);
        return;
      }
      
      // Cargamos el evento Y sus ajustes (Importante para el branding)
      const { data } = await supabase
        .from('events')
        .select('*, settings:event_settings(*)')
        .eq('id', eventId)
        .single();
        
      if (data) {
        setEventData(data);
      }
      setLoading(false);
    }
    fetchEvent();
  }, [eventId]);

  const settings = Array.isArray(eventData?.settings) ? eventData?.settings[0] : eventData?.settings;
  const themeColor = settings?.theme_id || 'indigo';
  const bgVariant = settings?.background_variant || 'aurora';

  // --- Camera Logic ---
  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setCurrentView('camera');
    } catch (err) {
      setError('No se pudo acceder a la cámara. Revisa los permisos.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  useEffect(() => {
    if (currentView === 'camera') startCamera();
    else stopCamera();
  }, [facingMode, currentView]);

  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setCapturedMedia({ blob, url, type: 'image' });
        setCurrentView('preview');
      }
    }, 'image/jpeg', 0.8);
  };

  const startRecording = () => {
    if (!stream) return;
    const chunks: BlobPart[] = [];
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      setCapturedMedia({ blob, url, type: 'video' });
      setCurrentView('preview');
    };

    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);

    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= 6) {
          stopRecording();
          return 6;
        }
        return prev + 0.1;
      });
    }, 100);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  // --- Upload Logic ---
  const handleFinalUpload = async () => {
    if (!capturedMedia || !eventId) return;
    setUploading(true);
    setError(null);

    try {
      const fileExt = capturedMedia.type === 'video' ? 'mp4' : 'jpg';
      const fileName = `${Math.random()}.${fileExt}`;
      const bucket = capturedMedia.type === 'video' ? 'videos' : 'images';
      const filePath = `${eventId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, capturedMedia.blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('content_items').insert({
        event_id: eventId,
        type: capturedMedia.type,
        content_url: publicUrl,
        sort_order: Date.now()
      });

      if (dbError) throw dbError;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setCapturedMedia(null);
        setCurrentView('menu');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    const url = URL.createObjectURL(file);
    setCapturedMedia({ blob: file, url, type: type as any });
    setCurrentView('preview');
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !eventId) return;
    setUploading(true);
    try {
      await supabase.from('content_items').insert({
        event_id: eventId,
        type: 'message',
        text_content: message.trim(),
        sort_order: Date.now()
      });
      setSuccess(true);
      setMessage('');
      setTimeout(() => { setSuccess(false); setCurrentView('menu'); }, 3000);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>;

  return (
    <div className={`min-h-screen bg-${bgVariant} text-white flex flex-col font-sans relative overflow-hidden transition-colors duration-700`}>
      {/* Background Glow & Orbs */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-${themeColor}-500/10 rounded-full blur-[120px] animate-float`} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[120px] animate-float-delayed" />
      </div>

      <main className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full">
        {/* Header */}
        <header className="text-center mb-8 pt-4">
          <h1 className="text-3xl font-black text-gradient tracking-tight">{eventData?.name || 'SnapShow'}</h1>
          <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-bold">Invitado de Honor</p>
        </header>

        <AnimatePresence mode="wait">
          {/* MENU VIEW */}
          {currentView === 'menu' && (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              <button 
                onClick={() => setCurrentView('camera')}
                className={`w-full glass-card p-8 flex flex-col items-center gap-4 hover:border-${themeColor}-500/40 transition-all active:scale-95`}
              >
                <div className={`w-20 h-20 bg-${themeColor}-500/20 rounded-3xl flex items-center justify-center text-${themeColor}-400`}>
                  <Camera size={40} />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-black">Hacer Selfie</h3>
                  <p className="text-white/40 text-sm">Foto o Video en vivo</p>
                </div>
              </button>

              <div className="grid grid-cols-2 gap-4">
                <label className="glass-card p-6 flex flex-col items-center gap-3 cursor-pointer hover:bg-white/5 active:scale-95 transition-all text-center">
                  <input type="file" className="hidden" accept="image/*,video/*" onChange={handleGalleryUpload} />
                  <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-400 uppercase">
                    <ImageIcon size={28} />
                  </div>
                  <span className="font-bold text-sm">Galería</span>
                </label>

                <button 
                  onClick={() => setCurrentView('message')}
                  className="glass-card p-6 flex flex-col items-center gap-3 hover:bg-white/5 active:scale-95 transition-all text-center"
                >
                  <div className="p-4 bg-green-500/10 rounded-2xl text-green-400">
                    <MessageSquare size={28} />
                  </div>
                  <span className="font-bold text-sm">Mensaje</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* CAMERA VIEW */}
          {currentView === 'camera' && (
            <motion.div 
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50 flex flex-col"
            >
              <div className="relative flex-1 bg-[#111]">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} 
                />
                
                {/* Overlay Controls */}
                <div className="absolute top-6 left-0 w-full px-6 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent pt-4 pb-12">
                  <button onClick={() => setCurrentView('menu')} className="p-2 bg-black/40 rounded-full"><X /></button>
                  <button onClick={toggleCamera} className="p-2 bg-black/40 rounded-full"><RotateCw /></button>
                </div>

                {isRecording && (
                   <div className="absolute top-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                     <div className="px-4 py-1 bg-red-600 rounded-full text-xs font-bold animate-pulse">REC</div>
                     <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-red-600 transition-all duration-100" style={{ width: `${(recordingTime/6)*100}%` }} />
                     </div>
                   </div>
                )}
              </div>

              <div className="h-44 bg-black flex flex-col items-center justify-center gap-6 px-12">
                <div className="flex items-center gap-12">
                  <button 
                    onClick={takePhoto}
                    disabled={isRecording}
                    className="flex flex-col items-center gap-1 text-white/40 disabled:opacity-20"
                  >
                    <div className="w-16 h-16 border-4 border-white rounded-full flex items-center justify-center p-1">
                      <div className="w-full h-full bg-white rounded-full" />
                    </div>
                    <span className="text-[10px] font-bold uppercase">Foto</span>
                  </button>

                  <button 
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className={`w-20 h-20 border-4 ${isRecording ? 'border-red-600 scale-110' : 'border-white/20'} rounded-full flex items-center justify-center p-1 transition-all`}>
                      <div className={`w-full h-full ${isRecording ? 'bg-red-600' : 'bg-white'} rounded-full`} />
                    </div>
                    <span className="text-[10px] font-bold uppercase">{isRecording ? 'Sueltas' : 'Mantén Video'}</span>
                  </button>
                </div>
                <p className="text-white/20 text-[10px] font-bold uppercase tracking-wider">Toca para Foto • Mantén para Video (6s)</p>
              </div>
            </motion.div>
          )}

          {/* PREVIEW VIEW */}
          {currentView === 'preview' && capturedMedia && (
            <motion.div 
              key="preview"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="fixed inset-0 bg-black z-[60] flex flex-col p-6"
            >
              <div className="flex-1 rounded-3xl overflow-hidden bg-white/5 border border-white/10 relative shadow-2xl">
                {capturedMedia.type === 'image' ? (
                  <img src={capturedMedia.url} className="w-full h-full object-cover" />
                ) : (
                  <video src={capturedMedia.url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                )}
                <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                  <h3 className="text-xl font-black">¿Te gusta?</h3>
                  <button onClick={() => setCurrentView('menu')} className="p-2 bg-black/40 rounded-full"><X size={20} /></button>
                </div>
              </div>

              <div className="h-32 flex items-center gap-4">
                <button 
                  onClick={() => { setCapturedMedia(null); setCurrentView('camera'); }}
                  className="flex-1 py-5 bg-white/5 hover:bg-white/10 rounded-2xl font-bold flex items-center justify-center gap-2 border border-white/10"
                >
                  <RotateCw size={20} /> Repetir
                </button>
                <button 
                  onClick={handleFinalUpload}
                  disabled={uploading}
                  className={`flex-[2] py-5 bg-${themeColor}-600 hover:bg-${themeColor}-500 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-${themeColor}-600/30 disabled:opacity-50 transition-all`}
                >
                  {uploading ? <Loader2 className="animate-spin" /> : <><Check size={24} /> ¡ENVIAR!</>}
                </button>
              </div>
            </motion.div>
          )}

          {/* MESSAGE VIEW */}
          {currentView === 'message' && (
            <motion.div 
              key="message"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 mb-2">
                <button onClick={() => setCurrentView('menu')} className="p-2 bg-white/5 rounded-xl"><X size={20} /></button>
                <h3 className="text-xl font-bold">Escribir Mensaje</h3>
              </div>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                autoFocus
                className="w-full h-48 bg-white/5 border border-white/10 rounded-3xl p-6 text-xl focus:outline-none focus:border-green-500/50 transition-all resize-none placeholder:text-white/10"
                placeholder="Dedica unas palabras..."
              />
              <button 
                onClick={handleSendMessage}
                disabled={!message.trim() || uploading}
                className="w-full py-6 bg-green-600 hover:bg-green-500 rounded-3xl font-black text-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {uploading ? <Loader2 className="animate-spin" /> : <><Send /> ENVIAR</>}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Overlay */}
        <AnimatePresence>
          {success && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-black mb-6 shadow-2xl shadow-green-500/40">
                <Check size={50} />
              </div>
              <h2 className="text-4xl font-black mb-2 italic">¡ENVIADO!</h2>
              <p className="text-white/60 text-lg">Tu momento está en camino a la gran pantalla.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold flex items-center gap-2">
            <X size={16} /> {error}
          </div>
        )}
      </main>

      <footer className="p-8 text-center text-white/10 font-bold uppercase tracking-widest text-[10px]">
        SnapShow System &bull; {new Date().getFullYear()}
      </footer>
    </div>
  );
};
