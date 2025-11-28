import React, { useState, useEffect } from 'react';
import { db } from './fire'; // Pastikan file fire.js ada dan export db benar
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc,
  query, 
  orderBy,
  where,
  getDocs
} from 'firebase/firestore';

import { 
  LayoutDashboard, Wallet, PiggyBank, BookOpen, LogOut, 
  Plus, CreditCard, PlayCircle, CheckCircle, XCircle, 
  AlertCircle, Trash2, Eye, EyeOff, ExternalLink, ShieldCheck
} from 'lucide-react';

/**
 * ==================================================================================
 * 1. UTILITIES & HELPERS
 * ==================================================================================
 */

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
};

const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return dateString;
  }
};

// STATIC DATA
const INVESTMENT_PRODUCTS = [
  { id: '1', name: 'Reksadana Pasar Uang', returnRate: 5, duration: '1 Tahun', minAmount: 100000, risk: 'Rendah' },
  { id: '2', name: 'Obligasi UMKM', returnRate: 8, duration: '3 Tahun', minAmount: 1000000, risk: 'Sedang' },
  { id: '3', name: 'Saham Blue Chip', returnRate: 12, duration: '5 Tahun', minAmount: 5000000, risk: 'Tinggi' },
];

const EDUCATION_CONTENT = [
  { id: 1, title: 'Dasar Pembukuan Keuangan UMKM', desc: 'Pelajari cara mencatat arus kas masuk dan keluar.', url: 'https://www.youtube.com/results?search_query=cara+pembukuan+keuangan+umkm+sederhana' },
  { id: 2, title: 'Strategi Digital Marketing Low Budget', desc: 'Cara promosi di sosmed tanpa biaya mahal.', url: 'https://www.youtube.com/results?search_query=strategi+digital+marketing+umkm+pemula' },
  { id: 3, title: 'Tips Memisahkan Uang Pribadi & Usaha', desc: 'Solusi agar dompet tidak campur aduk.', url: 'https://www.youtube.com/results?search_query=cara+memisahkan+uang+pribadi+dan+usaha' },
  { id: 4, title: 'Inspirasi Kisah Sukses UMKM', desc: 'Belajar dari pengalaman pengusaha lain.', url: 'https://www.youtube.com/results?search_query=kisah+sukses+pengusaha+umkm+indonesia' },
  { id: 5, title: 'Cara Foto Produk Pakai HP', desc: 'Foto produk profesional modal HP.', url: 'https://www.youtube.com/results?search_query=tutorial+foto+produk+katalog+pakai+hp' },
  { id: 6, title: 'Manajemen Stok Barang', desc: 'Trik agar stok gudang tetap rapi.', url: 'https://www.youtube.com/results?search_query=tips+manajemen+stok+barang+toko+kecil' }
];

/**
 * ==================================================================================
 * 2. UI COMPONENTS
 * ==================================================================================
 */
const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 animate-in slide-in-from-right">
    {toasts.map(toast => (
      <div key={toast.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-md border ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
        {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
        <span className="text-sm font-medium">{toast.message}</span>
        <button onClick={() => removeToast(toast.id)} className="ml-4 hover:text-white"><XCircle size={14}/></button>
      </div>
    ))}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, ...props }) => {
  const variants = {
    primary: "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50",
    outline: "border border-slate-600 text-slate-300 hover:border-cyan-400 hover:text-cyan-400 bg-transparent"
  };
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '', title, icon: Icon }) => (
  <div className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl ${className}`}>
    {(title || Icon) && (
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="text-cyan-400" size={20} />}
          {title && <h3 className="text-white font-bold text-lg">{title}</h3>}
        </div>
      </div>
    )}
    {children}
  </div>
);

const Input = ({ label, type = "text", value, onChange, placeholder, className = "", min, name }) => (
  <div className={`mb-4 ${className}`}>
    {label && <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>}
    <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} min={min} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors placeholder:text-slate-600" />
  </div>
);

const PasswordInput = ({ label, value, onChange, placeholder, name }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-4">
      {label && <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>}
      <div className="relative">
        <input 
          name={name}
          type={show ? "text" : "password"} 
          value={value} 
          onChange={onChange} 
          placeholder={placeholder} 
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors placeholder:text-slate-600 pr-10" 
        />
        <button 
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
};

const Logo = ({ size = "text-2xl" }) => (
  <div className={`font-bold flex items-center gap-2 ${size} select-none`}>
    <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg shadow-purple-500/30">
      <span className="text-white font-black text-xl italic font-serif">F</span>
      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse ring-2 ring-slate-900"></div>
    </div>
    <div className="flex flex-col leading-none">
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">LifeFin</span>
      <span className="text-[10px] text-cyan-500 tracking-widest font-normal uppercase">Pro UMKM</span>
    </div>
  </div>
);

const SimpleChart = ({ data, color = "#22d3ee" }) => {
  if (!data || data.length < 2) return <div className="h-32 flex items-center justify-center text-slate-600 text-xs">Belum cukup data grafik</div>;
  const height = 100; const width = 300;
  const maxVal = Math.max(...data.map(d => d.value)) || 1;
  const minVal = Math.min(...data.map(d => d.value)) || 0;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.value - minVal) / (maxVal - minVal || 1)) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <div className="w-full h-32 relative overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <polyline fill="none" stroke={color} strokeWidth="3" points={points} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
        <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.2" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient>
        <polygon points={`0,${height} ${points} ${width},${height}`} fill="url(#gradient)" />
      </svg>
    </div>
  );
};

/**
 * ==================================================================================
 * 3. MAIN APP CONTROLLER
 * ==================================================================================
 */
const App = () => {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  
  const [isRegister, setIsRegister] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [savings, setSavings] = useState([]);
  const [loans, setLoans] = useState([]);
  const [myInvestments, setMyInvestments] = useState([]);

  const notify = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // --- FIREBASE LISTENERS ---
  useEffect(() => {
    if (!user) return; // Hanya jalankan jika login sukses

    try {
      // Menggunakan query sederhana (orderBy) yang biasanya aman
      const qTrx = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
      const unsubTrx = onSnapshot(qTrx, (snap) => setTransactions(snap.docs.map(d => ({ ...d.data(), id: d.id }))), (err) => console.log("Trx Error:", err));
      
      const unsubSav = onSnapshot(collection(db, "savings"), (snap) => setSavings(snap.docs.map(d => ({ ...d.data(), id: d.id }))));
      const unsubLoans = onSnapshot(collection(db, "loans"), (snap) => setLoans(snap.docs.map(d => ({ ...d.data(), id: d.id }))));
      const unsubInvest = onSnapshot(collection(db, "my_investments"), (snap) => setMyInvestments(snap.docs.map(d => ({ ...d.data(), id: d.id }))));

      return () => { unsubTrx(); unsubSav(); unsubLoans(); unsubInvest(); };
    } catch (e) {
      console.log("Error init listeners:", e);
    }
  }, [user]);

  // --- AUTH ACTIONS (THE REAL PROPER FIX) ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');
    const role = formData.get('role');

    if(!username || !password) {
      setAuthLoading(false);
      return notify('Username dan Password wajib diisi!', 'error');
    }

    try {
      const usersRef = collection(db, 'users');
      
      if (isRegister) {
        // REGISTER: Cek apakah username ada?
        const q = query(usersRef, where('username', '==', username));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          throw new Error('Username sudah terpakai!');
        }

        // Simpan user baru
        await addDoc(usersRef, { username, password, role, createdAt: new Date().toISOString() });
        notify('Registrasi Berhasil! Silakan Login.', 'success');
        setIsRegister(false);
      } else {
        // LOGIN PROPER (ANTI-STUCK):
        // 1. Cari berdasarkan Username SAJA (Ringan, tidak butuh index majemuk)
        const q = query(usersRef, where('username', '==', username));
        const snap = await getDocs(q);

        if (snap.empty) {
          throw new Error('Username tidak ditemukan! Silakan daftar.');
        }

        // 2. Ambil data user dari database
        const userData = snap.docs[0].data();

        // 3. Cek Password & Role di sisi Aplikasi (JAVASCRIPT)
        // Ini menghindari error index di Firebase
        if (userData.password !== password) {
           throw new Error('Password salah!');
        }
        
        if (userData.role !== role) {
           throw new Error(`Akun ini terdaftar sebagai ${userData.role}, bukan ${role}!`);
        }

        // 4. Jika lolos semua pengecekan
        setUser({ username, role });
        notify(`Login Sukses! Halo, ${username}`, 'success');
      }
    } catch (err) {
      console.error("Auth Error:", err);
      notify(err.message, 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  // --- APP ACTIONS WITH VALIDATION ---
  const addTransaction = async (trx) => {
    if (!trx.amount || isNaN(trx.amount) || trx.amount <= 0) return notify("Nominal harus positif!", "error");
    if (!trx.category) return notify("Kategori wajib diisi!", "error");
    await addDoc(collection(db, "transactions"), { ...trx, createdAt: new Date().toISOString() });
    notify('Transaksi tersimpan!', 'success');
  };

  const deleteTransaction = async (id) => {
    if(window.confirm('Hapus data ini?')) { await deleteDoc(doc(db, "transactions", id)); notify('Terhapus!', 'info'); }
  };

  const addSaving = async (sv) => {
    if (!sv.name) return notify("Nama target wajib diisi!", "error");
    if (!sv.target || sv.target <= 0) return notify("Target harus positif!", "error");
    await addDoc(collection(db, "savings"), sv); notify('Target dibuat!', 'success');
  };

  const addDeposit = async (id, amount) => {
    if (!amount || amount <= 0) return notify("Setoran harus positif!", "error");
    const target = savings.find(s => s.id === id);
    if (target) {
      await updateDoc(doc(db, "savings", id), { current: target.current + amount });
      await addTransaction({ date: new Date().toISOString().split('T')[0], type: 'expense', category: 'Tabungan', amount: amount, note: `Setor ke ${target.name}` });
      notify('Berhasil setor!', 'success');
    }
  };

  const applyLoan = async ({ amount, reason }) => {
    if (!amount || amount <= 0) return notify("Jumlah harus positif!", "error");
    if (!reason) return notify("Alasan wajib diisi!", "error");
    await addDoc(collection(db, "loans"), { amount, reason, status: 'Pending', date: new Date().toLocaleDateString('id-ID'), userName: user.username, userScore: 780 });
    notify('Pengajuan terkirim!', 'success');
  };

  const buyInvestment = async (inv, amount) => {
    if (!amount || amount < inv.minAmount) return notify(`Minimal investasi ${formatRupiah(inv.minAmount)}!`, "error");
    await addDoc(collection(db, "my_investments"), { name: inv.name, amount, returnRate: inv.returnRate, startDate: new Date().toLocaleDateString('id-ID') });
    await addTransaction({ date: new Date().toISOString().split('T')[0], type: 'expense', category: 'Investasi', amount: amount, note: `Beli ${inv.name}` });
    notify('Investasi berhasil!', 'success');
  };

  const handleLoanAction = async (id, status) => { await updateDoc(doc(db, "loans", id), { status }); notify(`Status: ${status}`, 'success'); };

  // --- RENDER ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]"/>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[120px]"/>
        
        <div className="w-full max-w-md z-10 animate-in zoom-in duration-500">
          <div className="mb-8 flex justify-center scale-125"><Logo /></div>
          <Card className="border-t-4 border-t-cyan-500 bg-slate-900/80 backdrop-blur-xl relative">
            <div className="absolute top-2 right-2 text-[10px] text-slate-600 bg-slate-900 px-2 py-1 rounded border border-slate-800">
              v1.29.25.12
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 text-center">{isRegister ? 'Daftar Akun Baru' : 'Login LifeFin'}</h2>
            <form onSubmit={handleAuth} className="space-y-4">
              <Input name="username" label="Username" placeholder="Masukkan username" />
              <PasswordInput name="password" label="Password" placeholder="Masukkan password" />
              <div className="flex gap-4 mb-4 p-3 bg-slate-950 rounded-lg border border-slate-800">
                 <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-900"><input type="radio" name="role" value="user" defaultChecked className="accent-cyan-500"/><span className="text-slate-300 text-sm font-medium">UMKM</span></label>
                 <div className="w-px bg-slate-800 h-6"></div>
                 <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-900"><input type="radio" name="role" value="admin" className="accent-purple-500"/><span className="text-slate-300 text-sm font-medium">Admin</span></label>
              </div>
              <Button type="submit" disabled={authLoading} className="w-full py-3 text-lg shadow-xl shadow-cyan-900/20">
                {authLoading ? 'Memeriksa Database...' : (isRegister ? 'Daftar Sekarang' : 'Masuk Dashboard')}
              </Button>
            </form>
            
            <div className="mt-4 text-center text-sm text-slate-500">
              {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'} 
              <button type="button" onClick={() => setIsRegister(!isRegister)} className="text-cyan-400 font-bold ml-1 hover:text-cyan-300 transition-colors underline decoration-dotted">
                {isRegister ? 'Login di sini' : 'Daftar Gratis'}
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <aside className="w-20 lg:w-64 bg-slate-900 border-r border-slate-800 fixed h-full z-20 hidden md:flex flex-col">
        <div className="p-6 flex justify-center lg:justify-start h-20 items-center"><div className="lg:hidden"><Logo size="text-xl"/></div><div className="hidden lg:block"><Logo/></div></div>
        <nav className="flex-1 px-3 space-y-1.5 mt-4">
          {[{ id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },{ id: 'pos', icon: CreditCard, label: 'Transaksi' },{ id: 'savings', icon: PiggyBank, label: 'Tabungan' },{ id: 'finance', icon: Wallet, label: 'Modal & Invest' },{ id: 'education', icon: BookOpen, label: 'Edukasi' }].map(item => (
            <button key={item.id} onClick={() => setActivePage(item.id)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group ${activePage === item.id ? 'bg-cyan-600/10 text-cyan-400 font-bold' : 'text-slate-400 hover:bg-slate-800'}`}>
              <item.icon className={`w-5 h-5 ${activePage === item.id ? 'text-cyan-400' : 'text-slate-500 group-hover:text-white'}`} /><span className="hidden lg:inline">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
           <button onClick={() => setUser(null)} className="w-full flex items-center justify-center lg:justify-start gap-3 text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10"><LogOut size={20} /><span className="hidden lg:inline font-medium">Keluar</span></button>
        </div>
      </aside>
      <main className="flex-1 md:ml-20 lg:ml-64 p-4 lg:p-8 max-w-7xl mx-auto w-full mb-20 md:mb-0">
        <header className="mb-8 hidden md:block"><h1 className="text-3xl font-bold text-white mb-1 capitalize">{activePage}</h1><p className="text-slate-400 text-sm">LifeFin System v4.0 (Live Connected)</p></header>
        {activePage === 'dashboard' && <div className="space-y-6 animate-in fade-in"><div className="grid grid-cols-1 md:grid-cols-4 gap-4"><Card className="border-l-4 border-l-cyan-500"><div>Total Omzet</div><div className="text-2xl font-bold text-white">{formatRupiah(transactions.filter(t=>t.type==='income').reduce((a,c)=>a+c.amount,0))}</div></Card><Card className="border-l-4 border-l-green-500"><div>Laba Bersih</div><div className="text-2xl font-bold text-green-400">{formatRupiah(transactions.filter(t=>t.type==='income').reduce((a,c)=>a+c.amount,0) - transactions.filter(t=>t.type==='expense').reduce((a,c)=>a+c.amount,0))}</div></Card><Card className="border-l-4 border-l-purple-500"><div>Tabungan</div><div className="text-2xl font-bold text-white">{formatRupiah(savings.reduce((a,c)=>a+c.current,0))}</div></Card><Card><div>Skor Kredit</div><div className="text-3xl font-black text-blue-400">780</div></Card></div><div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><Card title="Aktivitas" className="lg:col-span-3"><div className="space-y-3">{transactions.slice(0,5).map(t=><div key={t.id} className="flex justify-between p-3 bg-slate-950 rounded border border-slate-800"><div>{t.category}</div><div className={t.type==='income'?'text-green-400':'text-red-400'}>{formatRupiah(t.amount)}</div></div>)}</div></Card></div></div>}
        {activePage === 'pos' && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2"><Card title="Input Transaksi"><form onSubmit={e=>{e.preventDefault();const fd=new FormData(e.target);addTransaction({amount:parseInt(fd.get('amount')),category:fd.get('category'),type:fd.get('type'),date:new Date().toISOString().split('T')[0],note:fd.get('note')});e.target.reset();}} className="space-y-4 mt-4"><div className="grid grid-cols-2 gap-4"><label className="cursor-pointer"><input type="radio" name="type" value="income" defaultChecked className="peer hidden"/><div className="p-4 rounded-xl border border-slate-700 text-center peer-checked:bg-green-500/10 peer-checked:border-green-500 peer-checked:text-green-400 text-slate-500 font-bold">Pemasukan</div></label><label className="cursor-pointer"><input type="radio" name="type" value="expense" className="peer hidden"/><div className="p-4 rounded-xl border border-slate-700 text-center peer-checked:bg-red-500/10 peer-checked:border-red-500 peer-checked:text-red-400 text-slate-500 font-bold">Pengeluaran</div></label></div><Input name="amount" label="Nominal" type="number" placeholder="0" required/><Input name="category" label="Kategori" placeholder="Contoh: Nasi Goreng" required/><Input name="note" label="Catatan" placeholder="Opsional"/><Button type="submit" className="w-full">Simpan</Button></form></Card></div><Card title="Riwayat">{transactions.map(t=><div key={t.id} className="flex justify-between items-center p-3 rounded border border-slate-800 bg-slate-950/50 mb-2"><div><p className="text-white text-sm">{t.category}</p><p className="text-xs text-slate-500">{formatRupiah(t.amount)}</p></div><button onClick={()=>deleteTransaction(t.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={16}/></button></div>)}</Card></div>}
        {activePage === 'savings' && <div className="space-y-6"><div className="flex justify-between items-center"><h2 className="text-xl font-bold text-white">Tabungan Target</h2><Button onClick={()=>{const n=prompt('Nama Target:');if(!n)return;const t=prompt('Target (Rp):');if(!t||t<=0)return notify("Target salah!","error");addSaving({name:n,target:parseInt(t),current:0,deadline:new Date().toISOString()})}}><Plus size={16}/> Baru</Button></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{savings.map(s=><Card key={s.id}><div className="flex justify-between mb-4"><h3 className="font-bold text-white">{s.name}</h3><Button variant="secondary" className="py-1 px-2 text-xs" onClick={()=>{const a=prompt('Jumlah Setor:');if(!a||a<=0)return notify("Salah!","error");addDeposit(s.id,parseInt(a))}}>+ Setor</Button></div><div className="mb-2 flex justify-between text-sm"><span className="text-slate-300">{formatRupiah(s.current)}</span><span className="text-slate-500">of {formatRupiah(s.target)}</span></div><div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden"><div className="bg-gradient-to-r from-cyan-500 to-purple-600 h-3 rounded-full" style={{width:`${Math.min((s.current/s.target)*100,100)}%`}}></div></div></Card>)}</div></div>}
        {activePage === 'finance' && <div className="space-y-6"><Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700"><h3 className="text-white font-bold mb-4">Ajukan Modal</h3><form onSubmit={e=>{e.preventDefault();const fd=new FormData(e.target);applyLoan({amount:parseInt(fd.get('amount')),reason:fd.get('reason')});e.target.reset();}} className="flex gap-4 items-end"><div className="flex-1"><Input name="amount" label="Jumlah" type="number" placeholder="0"/></div><div className="flex-[2]"><Input name="reason" label="Tujuan" placeholder="Untuk apa?"/></div><div className="mb-4"><Button type="submit">Ajukan</Button></div></form></Card><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{INVESTMENT_PRODUCTS.map(inv=><Card key={inv.id} className="border-purple-500/20"><h3 className="font-bold text-white mb-2">{inv.name}</h3><div className="text-sm text-slate-400 mb-4"><p>Return: {inv.returnRate}%</p><p>Min: {formatRupiah(inv.minAmount)}</p></div><Button variant="outline" className="w-full text-sm" onClick={()=>{const a=prompt('Nominal Investasi:');if(!a||parseInt(a)<inv.minAmount)return notify("Kurang!","error");buyInvestment(inv,parseInt(a))}}>Investasi</Button></Card>)}</div></div>}
        {activePage === 'education' && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{EDUCATION_CONTENT.map(i=><Card key={i.id} className="group cursor-pointer hover:border-blue-500/50 transition-colors hover:bg-slate-900/80"><a href={i.url} target="_blank" rel="noopener noreferrer" className="block h-full"><div className="aspect-video bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-[1.02] transition-transform relative"><PlayCircle size={48} className="text-blue-500 opacity-80 group-hover:text-blue-400 group-hover:opacity-100 z-10"/><div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-[10px] text-white flex items-center gap-1"><ExternalLink size={10}/> YouTube</div></div><h3 className="text-white font-bold text-lg mb-2 group-hover:text-blue-400 transition-colors">{i.title}</h3><p className="text-slate-400 text-sm line-clamp-3">{i.desc}</p></a></Card>)}</div>}
      </main>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around p-3 z-50">{['dashboard','pos','savings','finance','education'].map(id=><button key={id} onClick={()=>setActivePage(id)} className={`p-2 rounded-lg ${activePage===id?'text-cyan-400':'text-slate-500'}`}><div className="w-6 h-6 bg-current rounded-full opacity-20"></div></button>)}</div>
    </div>
  );
};

export default App;