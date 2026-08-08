import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogOut, Users, Activity, Plus, ExternalLink, ShieldCheck, Database, Calendar, MessageCircle, UserX, UserCheck, Smartphone, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const SuperAdminDashboard = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalClients: 0, activeEvents: 0, totalMedia: 0 });
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Formulario Nuevo Cliente
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newMaxEvents, setNewMaxEvents] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Verificar Rol
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'superadmin') {
        navigate('/admin'); // Si no es superadmin, echarlo al dashboard normal
        return;
      }

      // 2. Traer Clientes
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'superadmin');
        
      if (profilesData) setClients(profilesData);

      // 3. Traer Estadísticas Globales
      const { count: eventsCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
      const { count: mediaCount } = await supabase.from('content_items').select('*', { count: 'exact', head: true });
      
      setStats({
        totalClients: profilesData?.length || 0,
        activeEvents: eventsCount || 0,
        totalMedia: mediaCount || 0
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('admin_create_user', {
        email: newEmail,
        password: newPassword,
        full_name: newName,
        phone: newPhone,
        max_events: newMaxEvents
      });

      if (error) {
        if (error.message.includes('function admin_create_user does not exist')) {
            throw new Error("La función SQL no existe. ¿Ejecutaste el script supabase_migration.sql en tu dashboard de Supabase?");
        }
        throw error;
      }
      
      alert('✅ Cliente creado con éxito. Ya puedes pasarle sus credenciales por WhatsApp.');
      setIsCreating(false);
      fetchDashboardData();
      
      setNewEmail(''); setNewPassword(''); setNewName(''); setNewPhone(''); setNewMaxEvents(1);
    } catch (error: any) {
      alert('Error al crear cliente: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleClientStatus = async (id: string, currentStatus: boolean) => {
    if (!confirm(`¿Seguro que quieres ${currentStatus ? 'suspender' : 'activar'} a este cliente?`)) return;
    const { error } = await supabase.from('profiles').update({ is_active: !currentStatus }).eq('id', id);
    if (error) alert('Error: ' + error.message);
    else fetchDashboardData();
  };

  const updatePaymentStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('profiles').update({ payment_status: newStatus }).eq('id', id);
    if (error) alert('Error actualizando pago: ' + error.message);
    else fetchDashboardData();
  };

  const handleWhatsApp = (phone: string, name: string, email: string, isNew: boolean = false) => {
    if (!phone) {
      alert('El cliente no tiene un teléfono configurado.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    
    let message = `¡Hola ${name}! Somos del equipo de SnapShow.`;
    if (isNew) {
      message += `\n\nTu cuenta ha sido creada con éxito. Aquí tienes tus accesos:\n\n*Panel:* https://www.snapshow.com.ar/login\n*Usuario:* ${email}\n*Contraseña:* [La que te asignamos]\n\nCualquier duda, estamos a tu disposición.`;
    } else {
      message += `\n\nEste es un recordatorio sobre el estado de tu cuenta/pagos. Por favor, contáctanos cuando puedas.`;
    }
    
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading && clients.length === 0) return <div className="h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>;

  return (
    <div className="min-h-screen bg-[#050506] text-white flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/5 bg-[#0a0a0a]/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">SnapShow SuperAdmin</h1>
              <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-bold">Panel Global de Gestión</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all text-xs font-bold uppercase">
            <LogOut size={14} /> Salir
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-12">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-6 rounded-[24px] border border-white/5 flex items-center gap-6">
            <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400"><Users size={32} /></div>
            <div>
              <p className="text-4xl font-black">{stats.totalClients}</p>
              <p className="text-xs text-white/40 uppercase font-bold tracking-widest mt-1">Clientes Registrados</p>
            </div>
          </div>
          <div className="glass p-6 rounded-[24px] border border-white/5 flex items-center gap-6">
            <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-400"><Activity size={32} /></div>
            <div>
              <p className="text-4xl font-black">{stats.activeEvents}</p>
              <p className="text-xs text-white/40 uppercase font-bold tracking-widest mt-1">Eventos Totales</p>
            </div>
          </div>
          <div className="glass p-6 rounded-[24px] border border-white/5 flex items-center gap-6">
            <div className="p-4 bg-pink-500/10 rounded-2xl text-pink-400"><Database size={32} /></div>
            <div>
              <p className="text-4xl font-black">{stats.totalMedia}</p>
              <p className="text-xs text-white/40 uppercase font-bold tracking-widest mt-1">Archivos en Servidor</p>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black flex items-center gap-3"><Users className="text-indigo-400" /> Directorio de Clientes</h2>
            <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30 active:scale-95">
              <Plus size={18} /> Dar Alta a Cliente
            </button>
          </div>

          <div className="glass rounded-[32px] border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/40">Cliente</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/40">Contacto</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/40">Límite Eventos</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/40">Estado Pago</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/40">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {clients.map(client => (
                    <tr key={client.id} className={`hover:bg-white/[0.02] transition-colors ${!client.is_active ? 'opacity-50 grayscale' : ''}`}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 flex items-center justify-center font-black text-lg">
                            {client.full_name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-white">{client.full_name || 'Sin Nombre'}</p>
                            <p className="text-xs text-white/40 mt-0.5">{client.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{client.phone || '-'}</span>
                          {client.phone && (
                            <button onClick={() => handleWhatsApp(client.phone, client.full_name, client.email, false)} className="p-1.5 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors" title="Enviar recordatorio por WhatsApp">
                              <MessageCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold">
                          <Calendar size={12} className="text-white/40" />
                          <span>Max: {client.max_events || 1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <select
                          value={client.payment_status || 'pending'}
                          onChange={(e) => updatePaymentStatus(client.id, e.target.value)}
                          className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border appearance-none cursor-pointer outline-none ${
                            client.payment_status === 'paid' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                            client.payment_status === 'overdue' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                            'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          }`}
                        >
                          <option value="pending">⏳ Pendiente</option>
                          <option value="paid">✅ Pagado</option>
                          <option value="overdue">⚠️ Vencido</option>
                        </select>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => toggleClientStatus(client.id, client.is_active)}
                            className={`p-2 rounded-xl transition-all ${client.is_active ? 'bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-400' : 'bg-red-500/20 text-red-400 hover:bg-green-500/20 hover:text-green-400'}`}
                            title={client.is_active ? "Suspender cuenta" : "Reactivar cuenta"}
                          >
                            {client.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>
                          
                          <button 
                            onClick={() => {
                              localStorage.setItem('impersonate_client_id', client.id);
                              localStorage.setItem('impersonate_client_name', client.full_name);
                              navigate('/admin');
                            }}
                            className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition-all"
                            title="Entrar como este cliente"
                          >
                            <ExternalLink size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {clients.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-white/40 italic">No hay clientes registrados aún.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* Modal Crear Cliente */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreating(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg bg-[#141415] rounded-[32px] p-8 border border-white/10 shadow-2xl">
              <h3 className="text-2xl font-black mb-6">Nuevo Cliente</h3>
              <form onSubmit={handleCreateClient} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-white/60 uppercase tracking-widest ml-1 mb-1 block">Nombre / Empresa</label>
                  <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Ej: DJ Martín" />
                </div>
                <div>
                  <label className="text-xs font-bold text-white/60 uppercase tracking-widest ml-1 mb-1 block">Email (Usuario)</label>
                  <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="cliente@email.com" />
                </div>
                <div>
                  <label className="text-xs font-bold text-white/60 uppercase tracking-widest ml-1 mb-1 block">Contraseña Temporal</label>
                  <input type="text" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Min. 6 caracteres" minLength={6} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest ml-1 mb-1 block">WhatsApp</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                      <input type="tel" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Ej: 549112345678" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest ml-1 mb-1 block">Límite Eventos</label>
                    <input type="number" required min="1" value={newMaxEvents} onChange={e => setNewMaxEvents(parseInt(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors" />
                  </div>
                </div>
                <div className="pt-6 flex gap-3">
                  <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-colors">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black transition-colors flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />} Crear Cuenta
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
