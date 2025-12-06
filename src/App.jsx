import React, { useState, useEffect, useRef } from 'react';
import { db } from './fire'; 
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
  AlertCircle, Trash2, Eye, EyeOff, ExternalLink, ShieldAlert,
  QrCode, Smartphone, Banknote, Landmark, Camera, ScanLine, 
  TrendingUp, Coins, Loader2, AlertTriangle,
  Settings, Users, CheckSquare, ArrowLeft, User, Download,
  ChevronRight, Activity, Search, Filter, Bell, FileText, UserCircle
} from 'lucide-react';

/**
 * ==================================================================================
 * 1. UTILITIES (SAFE MODE & FORMATTERS)
 * ==================================================================================
 */

const formatRupiah = (number) => {
  try {
    const val = Number(number) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  } catch (e) {
    return "Rp 0";
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString; 
    return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return "-";
  }
};

const downloadCSV = (data, filename) => {
  const csvContent = "data:text/csv;charset=utf-8," 
    + "Tanggal,Kategori,Tipe,Nominal,Metode,Catatan\n"
    + data.map(e => `${e.date},${e.category},${e.type},${e.amount},${e.paymentMethod},${e.note}`).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const INVESTMENT_PRODUCTS = [
  { id: '1', name: 'Reksadana Pasar Uang', returnRate: 5, duration: '1 Tahun', minAmount: 100000, risk: 'Rendah' },
  { id: '2', name: 'Obligasi UMKM', returnRate: 8, duration: '3 Tahun', minAmount: 1000000, risk: 'Sedang' },
  { id: '3', name: 'Saham Blue Chip', returnRate: 15, duration: '5 Tahun', minAmount: 5000000, risk: 'Tinggi' },
];

const EDUCATION_CONTENT = [
  { id: 1, title: 'Dasar Pembukuan Keuangan UMKM', desc: 'Pelajari cara mencatat arus kas masuk dan keluar.', url: 'https://www.youtube.com/results?search_query=cara+pembukuan+keuangan+umkm+sederhana' },
  { id: 2, title: 'Strategi Digital Marketing Low Budget', desc: 'Cara promosi di sosmed tanpa biaya mahal.', url: 'https://www.youtube.com/results?search_query=strategi+digital+marketing+umkm+pemula' },
  { id: 3, title: 'Tips Memisahkan Uang Pribadi & Usaha', desc: 'Solusi agar dompet tidak campur aduk.', url: 'https://www.youtube.com/results?search_query=cara+memisahkan+uang+pribadi+dan+usaha' },
];

const BANKS = ["BCA", "Mandiri", "BRI", "BNI", "BSI"];
const EWALLETS = ["GoPay", "OVO", "Dana", "ShopeePay", "LinkAja"];

const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'pos', icon: CreditCard, label: 'Kasir & LPay' },
  { id: 'savings', icon: PiggyBank, label: 'Tabungan' },
  { id: 'finance', icon: Wallet, label: 'Modal & Invest' },
  { id: 'education', icon: BookOpen, label: 'Edukasi' }
];

const ADMIN_NAV_ITEMS = [
  { id: 'admin_approval', icon: CheckSquare, label: 'Persetujuan' },
  { id: 'admin_monitoring', icon: Users, label: 'Monitoring UMKM' }, 
  { id: 'admin_settings', icon: Settings, label: 'Pengaturan Skor' }
];

/**
 * ==================================================================================
 * 2. UI COMPONENTS
 * ==================================================================================
 */
const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
    {toasts.map(toast => (
      <div key={toast.id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border bg-slate-800 border-slate-700 text-white animate-in slide-in-from-right`}>
        {toast.type === 'success' ? <CheckCircle size={18} className="text-green-400"/> : toast.type === 'warning' ? <AlertTriangle size={18} className="text-yellow-400"/> : <AlertCircle size={18} className="text-red-400"/>}
        <span className="text-sm font-medium">{toast.message}</span>
        <button onClick={() => removeToast(toast.id)} className="ml-auto text-slate-400 hover:text-white"><XCircle size={14}/></button>
      </div>
    ))}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, ...props }) => {
  const bgClass = variant === 'primary' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20' : 
                  variant === 'danger' ? 'bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20' :
                  'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700';
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95 ${bgClass} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '', title, headerAction }) => (
  <div className={`bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden ${className}`}>
    {title && (
      <div className="flex justify-between items-center mb-4 border-b border-slate-800/50 pb-2">
        <h3 className="text-white font-bold text-lg tracking-tight flex items-center gap-2">{title}</h3>
        {headerAction}
      </div>
    )}
    <div className="relative z-10">{children}</div>
  </div>
);

const Input = ({ label, type = "text", value, onChange, placeholder, className = "", min, name, autoFocus }) => (
  <div className={`mb-4 ${className}`}>
    {label && <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>}
    <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} min={min} autoFocus={autoFocus} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors placeholder:text-slate-600" />
  </div>
);

const PasswordInput = ({ label, value, onChange, placeholder, name }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-4">
      {label && <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>}
      <div className="relative">
        <input name={name} type={show ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 pr-10" />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
      </div>
    </div>
  );
};

const Logo = ({ size = "text-2xl" }) => (
  <div className={`font-bold flex items-center gap-2 ${size} select-none`}>
    <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg px-2 py-1 text-white shadow-lg shadow-purple-500/30">F</div>
    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">LifeFin</span>
  </div>
);

const SimpleChart = ({ data, color = "#22d3ee" }) => {
  if (!data || data.length < 2) return <div className="h-32 flex items-center justify-center text-slate-600 text-xs bg-slate-950/30 rounded-lg border border-dashed border-slate-800">Belum cukup data grafik</div>;
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
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" x2="0" y1="0" y2="1">
             <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
             <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polygon points={`0,${height} ${points} ${width},${height}`} fill={`url(#grad-${color})`} />
        <polyline fill="none" stroke={color} strokeWidth="3" points={points} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

// --- MODALS (QRIS, TRANSFER, ETC) ---
const ModalWrapper = ({ children, onClose, title }) => (
   <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
         <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><XCircle size={24}/></button>
         </div>
         {children}
      </div>
   </div>
);

const QrisGenerateModal = ({ amount, onClose }) => (
  <ModalWrapper onClose={onClose} title="LPay Payment">
      <p className="text-xs text-center text-slate-400 mb-4">Tunjukkan kode ini ke pelanggan</p>
      <div className="bg-white p-4 rounded-xl mb-6 flex items-center justify-center h-64 relative overflow-hidden mx-auto w-64">
         <QrCode size={200} className="text-slate-900"/>
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <Logo size="text-4xl text-black"/>
         </div>
      </div>
      <div className="text-3xl font-black text-center text-white mb-2">{formatRupiah(amount || 0)}</div>
      <div className="text-xs text-center text-slate-500 font-mono">Merchant ID: LF-{Math.floor(Math.random()*1000000)}</div>
  </ModalWrapper>
);

const QrisScannerModal = ({ onScanComplete, onClose }) => {
  useEffect(() => { const t = setTimeout(onScanComplete, 2500); return () => clearTimeout(t); }, []);
  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      <div className="p-4 flex justify-between items-center bg-black/50 backdrop-blur absolute top-0 w-full z-20">
         <h3 className="text-white font-bold flex gap-2"><QrCode/> Scan LPay</h3>
         <button onClick={onClose}><XCircle className="text-white"/></button>
      </div>
      <div className="flex-1 relative flex items-center justify-center bg-gray-900">
         <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 animate-pulse">
            <Camera size={48} className="mb-2"/>
            <p>Mencari kode QR...</p>
         </div>
         <div className="w-64 h-64 border-2 border-cyan-400 relative z-10 rounded-xl overflow-hidden shadow-[0_0_0_1000px_rgba(0,0,0,0.7)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 animate-[scan_1.5s_infinite_linear] shadow-[0_0_15px_rgba(34,211,238,0.8)]"></div>
         </div>
      </div>
    </div>
  );
};

const TransferProcessingModal = ({ onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] backdrop-blur">
       <div className="text-center">
          <Loader2 size={64} className="text-cyan-500 animate-spin mx-auto mb-6"/>
          <h2 className="text-2xl font-bold text-white mb-2">Memproses Transaksi...</h2>
          <p className="text-slate-400">Mohon jangan tutup halaman ini</p>
       </div>
    </div>
  );
};

// --- PROFILE MODAL ---
const ProfileModal = ({ user, onClose, onLogout }) => (
   <ModalWrapper onClose={onClose} title="Profil Saya">
      <div className="text-center mb-6">
         <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-white mb-3 shadow-lg shadow-cyan-500/20">
            {user.username?.charAt(0).toUpperCase()}
         </div>
         <h3 className="text-xl font-bold text-white">{user.username}</h3>
         <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400 uppercase border border-slate-700">{user.role}</span>
      </div>
      <div className="space-y-3">
         <div className="bg-slate-950 p-3 rounded-lg flex justify-between items-center border border-slate-800">
            <span className="text-slate-400 text-sm">Member Sejak</span>
            <span className="text-white font-mono text-sm">2024</span>
         </div>
         <div className="bg-slate-950 p-3 rounded-lg flex justify-between items-center border border-slate-800">
            <span className="text-slate-400 text-sm">Status Akun</span>
            <span className="text-green-400 text-sm font-bold flex items-center gap-1"><CheckCircle size={12}/> Aktif</span>
         </div>
      </div>
      <div className="mt-6 pt-6 border-t border-slate-800">
         <Button onClick={onLogout} variant="danger" className="w-full">Keluar Aplikasi</Button>
      </div>
   </ModalWrapper>
);

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
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Features State
  const [showProfile, setShowProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, income, expense
  
  // OTP State
  const [showOtp, setShowOtp] = useState(false);
  const [serverOtp, setServerOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [tempRegData, setTempRegData] = useState(null);
  
  // Admin State
  const [adminTab, setAdminTab] = useState('admin_approval');
  const [selectedUmkm, setSelectedUmkm] = useState(null); 
  const [usersList, setUsersList] = useState([]);

  // POS State
  const [transactionType, setTransactionType] = useState('income'); 
  const [paymentMethod, setPaymentMethod] = useState('cash'); 
  const [paymentProvider, setPaymentProvider] = useState(''); 
  const [showQrisGenerate, setShowQrisGenerate] = useState(false); 
  const [showQrisScanner, setShowQrisScanner] = useState(false); 
  const [currentTxData, setCurrentTxData] = useState(null); 
  const [showTransferProcessing, setShowTransferProcessing] = useState(false);

  // Data State
  const [transactions, setTransactions] = useState([]);
  const [savings, setSavings] = useState([]);
  const [loans, setLoans] = useState([]);
  const [myInvestments, setMyInvestments] = useState([]);

  // Score Config
  const [scoreConfig, setScoreConfig] = useState({ base: 300, trxWeight: 1, savingWeight: 50 });

  const notify = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // --- FIREBASE LISTENERS ---
  useEffect(() => {
    if (!user || isDemoMode) return;

    let unsub = [];
    try {
      // Fetch Users for Admin
      if (user.role === 'admin') {
        unsub.push(onSnapshot(collection(db, "users"), (snap) => {
          const safeUsers = snap.docs.map(d => ({...d.data(), id: d.id, username: d.data().username || 'Unknown'}));
          setUsersList(safeUsers);
        }));
      }

      unsub.push(onSnapshot(query(collection(db, "transactions"), orderBy("createdAt", "desc")), (snap) => {
         if(snap) setTransactions(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      }));
      
      unsub.push(onSnapshot(collection(db, "savings"), (s) => s && setSavings(s.docs.map(d => ({ ...d.data(), id: d.id })))));
      unsub.push(onSnapshot(collection(db, "loans"), (s) => s && setLoans(s.docs.map(d => ({ ...d.data(), id: d.id })))));
      unsub.push(onSnapshot(collection(db, "my_investments"), (s) => s && setMyInvestments(s.docs.map(d => ({ ...d.data(), id: d.id })))));

    } catch (e) { console.log("Listener error:", e); }
    
    return () => unsub.forEach(u => u && u());
  }, [user, isDemoMode]);

  // --- AUTH ACTIONS ---
  const handleAuth = async (e) => {
    e.preventDefault(); setAuthLoading(true);
    // OTP CHECK
    if (showOtp && isRegister) {
        if (otpInput !== serverOtp) { setAuthLoading(false); return notify('Kode OTP Salah!', 'error'); }
        try {
            await addDoc(collection(db, 'users'), { ...tempRegData, createdAt: new Date().toISOString() });
            notify('Akun Berhasil Dibuat!', 'success');
            setIsRegister(false); setShowOtp(false); setOtpInput(''); setTempRegData(null);
        } catch (err) { notify('Gagal buat akun', 'error'); } 
        finally { setAuthLoading(false); }
        return;
    }

    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');
    const role = formData.get('role');

    if(!username || !password) { setAuthLoading(false); return notify('Lengkapi data!', 'error'); }
    if(password.length < 8) { setAuthLoading(false); return notify('Password min 8 karakter!', 'error'); }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username)); 
      const snap = await getDocs(q);

      if (isRegister) {
        if (!snap.empty) throw new Error('Username sudah dipakai!');
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        setServerOtp(code);
        setTempRegData({ username, password, role });
        setTimeout(() => alert(`[SMS LifeFin] Kode OTP: ${code}`), 500);
        setShowOtp(true);
        notify('Cek kode OTP di alert browser', 'info');
      } else {
        if (snap.empty) throw new Error('User tidak ditemukan!');
        const userData = snap.docs[0].data();
        if (userData.password !== password) throw new Error('Password salah!');
        if (userData.role !== role) throw new Error(`Salah role! Ini akun ${userData.role}`);
        
        setIsDemoMode(false);
        setUser({ username, role });
        notify(`Selamat datang, ${username}`, 'success');
      }
    } catch (err) { notify(err.message, 'error'); } 
    finally { setAuthLoading(false); }
  };

  const handleDemoLogin = () => {
    setIsDemoMode(true);
    setUser({ username: "Tamu Demo", role: "user" });
    setTransactions([{id:'d1', amount:500000, category:'Demo Trx', type:'income', method: 'cash', paymentMethod: 'cash', paymentProvider: '-', date: new Date().toISOString(), createdAt: new Date().toISOString(), userName: 'Tamu Demo'}]);
    notify("Mode Demo Aktif", "info");
  };

  // --- LOGIC ACTIONS ---
  const saveTransactionToDb = async (txData, shouldReset = true) => {
    const finalData = { ...txData, userName: user.username }; 
    if (isDemoMode) { setTransactions(prev => [{...finalData, id: Date.now().toString()}, ...prev]); } 
    else { await addDoc(collection(db, "transactions"), finalData); }
    notify('Transaksi Berhasil!', 'success');
    if (shouldReset) { setPaymentMethod('cash'); setPaymentProvider(''); setTransactionType('income'); setCurrentTxData(null); }
  };

  const handlePosSubmit = async (e) => {
    e.preventDefault(); const formData = new FormData(e.target);
    if (transactionType === 'expense' && paymentMethod === 'qris') { setCurrentTxData(null); setShowQrisScanner(true); return; }
    
    const amountVal = parseInt(formData.get('amount'));
    const categoryVal = formData.get('category');
    const accountNumberVal = formData.get('accountNumber');

    if (!amountVal || amountVal <= 0) return notify("Nominal tidak valid", "error");
    if (!categoryVal) return notify("Kategori wajib diisi", "error");
    
    const isTransfer = paymentMethod === 'transfer' || paymentMethod === 'ewallet';
    if (isTransfer && !accountNumberVal) return notify("No Rekening wajib diisi", "error");

    const txData = { 
        amount: amountVal, category: categoryVal, type: transactionType, 
        date: new Date().toISOString().split('T')[0], note: formData.get('note') || '', 
        paymentMethod: paymentMethod || 'cash', paymentProvider: paymentProvider || '-', 
        accountNumber: accountNumberVal || '-', 
        transferStatus: isTransfer ? 'Pending' : 'Berhasil', 
        createdAt: new Date().toISOString() 
    };

    if (transactionType === 'income' && paymentMethod === 'qris') { setCurrentTxData(txData); setShowQrisGenerate(true); saveTransactionToDb(txData, false); } 
    else if (isTransfer) { setCurrentTxData(txData); setShowTransferProcessing(true); } 
    else { saveTransactionToDb(txData); }
    e.target.reset();
  };

  // --- FILTERED TRANSACTIONS LOGIC ---
  const getFilteredTransactions = () => {
    let data = transactions;
    // Filter by Type
    if (filterType !== 'all') {
        data = data.filter(t => t.type === filterType);
    }
    // Filter by Search
    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        data = data.filter(t => 
            t.category.toLowerCase().includes(lower) || 
            t.note.toLowerCase().includes(lower) ||
            t.amount.toString().includes(lower)
        );
    }
    return data;
  };

  // --- SCORE CALCULATION ---
  const filteredTrx = transactions; // Use all for score
  const totalIncome = filteredTrx.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = filteredTrx.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const profit = totalIncome - totalExpense;
  
  const calculateScore = () => {
    let score = scoreConfig.base;
    score += Math.min(Math.floor(totalIncome / 100000) * scoreConfig.trxWeight, 200);
    if (profit > 0) score += 100;
    score += Math.min(savings.length * scoreConfig.savingWeight, 150);
    return Math.min(score, 850);
  };

  // --- RENDER AUTH ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-200 font-sans">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <div className="w-full max-w-md">
           <div className="flex justify-center mb-8"><Logo size="text-4xl"/></div>
           <Card className="border-t-4 border-t-cyan-500">
             <h2 className="text-2xl font-bold text-center mb-4 text-white">{isRegister ? 'Daftar Akun' : 'Login LifeFin'}</h2>
             <form onSubmit={handleAuth} className="space-y-4">
               {showOtp ? (
                  <div className="text-center space-y-4">
                    <p>Masukkan kode OTP dari SMS</p>
                    <input type="text" value={otpInput} onChange={e=>setOtpInput(e.target.value)} className="bg-slate-950 border border-slate-700 rounded p-2 text-center text-2xl w-full" autoFocus/>
                    <Button type="submit" className="w-full">{authLoading ? 'Cek...' : 'Verifikasi'}</Button>
                    <button type="button" onClick={()=>setShowOtp(false)} className="text-xs text-slate-400">Kembali</button>
                  </div>
               ) : (
                 <>
                  <Input name="username" placeholder="Username" />
                  <PasswordInput name="password" placeholder="Password (Min 8 Char)" />
                  <div className="flex gap-2 mb-4">
                     <label className="flex-1 bg-slate-950 p-2 rounded cursor-pointer border border-slate-700 flex items-center justify-center gap-2"><input type="radio" name="role" value="user" defaultChecked/> UMKM</label>
                     <label className="flex-1 bg-slate-950 p-2 rounded cursor-pointer border border-slate-700 flex items-center justify-center gap-2"><input type="radio" name="role" value="admin" /> Admin</label>
                  </div>
                  <Button type="submit" disabled={authLoading} className="w-full">{authLoading ? 'Proses...' : (isRegister ? 'Daftar' : 'Masuk')}</Button>
                 </>
               )}
             </form>
             {!showOtp && <div className="mt-4 flex justify-between text-sm"><button onClick={handleDemoLogin} className="text-yellow-500">Mode Demo</button><button onClick={()=>setIsRegister(!isRegister)} className="text-cyan-400">{isRegister?'Login':'Daftar Baru'}</button></div>}
           </Card>
        </div>
      </div>
    );
  }

  // --- ADMIN VIEW ---
  if (user.role === 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col p-4">
           <div className="mb-8"><Logo/></div>
           <nav className="space-y-2 flex-1">
             {ADMIN_NAV_ITEMS.map(i => (
               <button key={i.id} onClick={()=>{setAdminTab(i.id); setSelectedUmkm(null);}} className={`w-full flex items-center gap-3 p-3 rounded-lg ${adminTab===i.id ? 'bg-purple-900/30 text-purple-400' : 'hover:bg-slate-800'}`}>
                 <i.icon size={20}/> {i.label}
               </button>
             ))}
           </nav>
           <button onClick={()=>setUser(null)} className="flex items-center gap-3 p-3 hover:text-red-400"><LogOut size={20}/> Keluar</button>
        </aside>
        <main className="flex-1 p-8 overflow-y-auto">
           <header className="mb-8"><h1 className="text-3xl font-bold text-white">Admin Panel</h1></header>
           
           {adminTab === 'admin_approval' && (
             <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card><h3 className="text-yellow-400 text-sm mb-1">Pending</h3><p className="text-2xl font-bold text-white">{loans.filter(l => l.status === 'Pending').length}</p></Card>
                  <Card><h3 className="text-green-400 text-sm mb-1">Approved</h3><p className="text-2xl font-bold text-white">{loans.filter(l => l.status === 'Approved').length}</p></Card>
               </div>
               <Card title="Antrian Pinjaman">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                      <thead className="bg-slate-950 text-xs uppercase"><tr><th className="p-3">User</th><th className="p-3">Jumlah</th><th className="p-3">Skor</th><th className="p-3">Status</th><th className="p-3">Aksi</th></tr></thead>
                      <tbody>
                        {loans.map(l => (
                          <tr key={l.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                            <td className="p-3 text-white">{l.userName}</td>
                            <td className="p-3">{formatRupiah(l.amount)}</td>
                            <td className="p-3 text-blue-400 font-bold">{l.userScore}</td>
                            <td className="p-3">{l.status}</td>
                            <td className="p-3 flex gap-2">
                              {l.status === 'Pending' && <><button onClick={async()=>{if(!isDemoMode)await updateDoc(doc(db,"loans",l.id),{status:'Approved'}); notify("Approved","success")}} className="bg-green-600 p-1 rounded text-white"><CheckCircle size={16}/></button><button onClick={async()=>{if(!isDemoMode)await updateDoc(doc(db,"loans",l.id),{status:'Rejected'}); notify("Rejected","success")}} className="bg-red-600 p-1 rounded text-white"><XCircle size={16}/></button></>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </Card>
             </div>
           )}

           {adminTab === 'admin_monitoring' && (
             <div className="space-y-6">
               {!selectedUmkm ? (
                 <div className="grid grid-cols-3 gap-4">
                   {usersList.filter(u => u.role === 'user').map(u => (
                     <div key={u.id} onClick={()=>setSelectedUmkm(u)} className="bg-slate-900 p-6 rounded-xl border border-slate-800 cursor-pointer hover:border-purple-500">
                       <div className="w-10 h-10 bg-purple-900 rounded-full flex items-center justify-center text-white font-bold mb-2">{(u.username || 'U').charAt(0).toUpperCase()}</div>
                       <h3 className="font-bold text-white">{u.username}</h3>
                     </div>
                   ))}
                   {usersList.length === 0 && <p className="text-slate-500 col-span-3 text-center">Belum ada user terdaftar.</p>}
                 </div>
               ) : (
                 <div>
                   <button onClick={()=>setSelectedUmkm(null)} className="mb-4 text-slate-400 flex items-center gap-2"><ArrowLeft size={16}/> Kembali</button>
                   <h2 className="text-2xl font-bold text-white mb-6">Detail: {selectedUmkm.username}</h2>
                   {/* Monitoring Chart Area */}
                   <div className="mb-6 h-48 bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                      <h4 className="text-sm text-slate-500 mb-2">Grafik Aktivitas User</h4>
                      <SimpleChart data={transactions.filter(t => t.userName === selectedUmkm.username).map(t => ({ value: t.amount }))} color="#a855f7" />
                   </div>
                   <Card title="Riwayat Transaksi">
                     {transactions.filter(t => t.userName === selectedUmkm.username).map(t => (
                       <div key={t.id} className="flex justify-between p-2 border-b border-slate-800 last:border-0">
                         <span>{t.category}</span>
                         <span className={t.type==='income'?'text-green-400':'text-red-400'}>{formatRupiah(t.amount)}</span>
                       </div>
                     ))}
                   </Card>
                 </div>
               )}
             </div>
           )}

           {adminTab === 'admin_settings' && <Card title="Pengaturan Skor"><p className="text-slate-400">Fitur simulasi skor kredit tersedia di versi Desktop.</p></Card>}
        </main>
      </div>
    );
  }

  // --- USER VIEW (PRO MAX) ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {showProfile && <ProfileModal user={user} onClose={()=>setShowProfile(false)} onLogout={()=>setUser(null)} />}
      {showQrisGenerate && <QrisGenerateModal amount={currentTxData?.amount} onClose={() => { setShowQrisGenerate(false); saveTransactionToDb(currentTxData, true); }} />}
      {showQrisScanner && <QrisScannerModal onScanComplete={handleScanSuccess} onClose={() => setShowQrisScanner(false)} />}
      {showTransferProcessing && <TransferProcessingModal onClose={() => finalizeTransfer(currentTxData)} />}
      {selectedInvestment && <InvestmentModal product={selectedInvestment} onClose={() => setSelectedInvestment(null)} onConfirm={(p,a)=>{/*...*/}} />} 
      {showSavingModal && <SavingModal onClose={() => setShowSavingModal(false)} onConfirm={(sv) => { /*...*/ }} />}
      
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col p-4">
        <div className="mb-8"><Logo/></div>
        <nav className="space-y-2 flex-1">
          {NAV_ITEMS.map(i => (
            <button key={i.id} onClick={()=>setActivePage(i.id)} className={`w-full flex items-center gap-3 p-3 rounded-lg ${activePage===i.id ? 'bg-cyan-900/30 text-cyan-400' : 'hover:bg-slate-800'}`}>
              <i.icon size={20}/> <span className="hidden lg:block">{i.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto pb-20 relative">
         {/* Header Pro */}
         <div className="flex justify-between items-center mb-6">
            <div>
               <h1 className="text-2xl font-bold text-white capitalize">{activePage}</h1>
               <p className="text-xs text-slate-500">Selamat Datang, {user.username}</p>
            </div>
            <div className="flex gap-3">
               <button className="p-2 bg-slate-800 rounded-full relative"><Bell size={20}/><div className="w-2 h-2 bg-red-500 rounded-full absolute top-0 right-0"></div></button>
               <button onClick={()=>setShowProfile(true)} className="p-2 bg-slate-800 rounded-full text-cyan-400"><UserCircle size={20}/></button>
            </div>
         </div>

         {activePage === 'dashboard' && <div className="grid gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card title="Omzet"><span className="text-xl font-bold text-white">{formatRupiah(totalIncome)}</span></Card>
              <Card title="Pengeluaran"><span className="text-xl font-bold text-red-400">{formatRupiah(totalExpense)}</span></Card>
              <Card title="Saldo"><span className="text-xl font-bold text-blue-400">{formatRupiah(profit)}</span></Card>
              <Card title="Skor"><span className="text-xl font-bold text-purple-400">{calculateScore()}</span></Card>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
               <Button variant="secondary" className="text-xs whitespace-nowrap"><FileText size={14}/> Download Laporan</Button>
            </div>
            <Card title="Analitik Keuangan">
               <div className="mb-4"><SimpleChart data={chartData} /></div>
            </Card>
         </div>}
         
         {activePage === 'pos' && <div className="grid lg:grid-cols-2 gap-6">
            <Card title="Kasir Digital">
               {/* Search & Filter Bar */}
               <div className="flex gap-2 mb-4">
                  <div className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 flex items-center gap-2">
                     <Search size={16} className="text-slate-500"/>
                     <input className="bg-transparent outline-none text-white text-sm w-full" placeholder="Cari transaksi..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
                  </div>
                  <button onClick={()=>setFilterType(filterType==='all'?'income':filterType==='income'?'expense':'all')} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white">
                     <Filter size={18} />
                  </button>
               </div>

               {/* FORM POS SEDERHANA */}
               <form onSubmit={handlePosSubmit} className="space-y-4">
                 <div className="grid grid-cols-2 gap-2">
                   <button type="button" onClick={()=>setTransactionType('income')} className={`p-2 border rounded ${transactionType==='income'?'border-green-500 text-green-400':'border-slate-700'}`}>Pemasukan</button>
                   <button type="button" onClick={()=>setTransactionType('expense')} className={`p-2 border rounded ${transactionType==='expense'?'border-red-500 text-red-400':'border-slate-700'}`}>Pengeluaran</button>
                 </div>
                 {!(transactionType==='expense' && paymentMethod==='qris') && <Input name="amount" type="number" placeholder="Nominal" />}
                 {!(transactionType==='expense' && paymentMethod==='qris') && <Input name="category" placeholder="Kategori" />}
                 <div className="grid grid-cols-4 gap-2">
                    {[{id:'cash',l:'Tunai'},{id:'qris',l:'LPay'},{id:'transfer',l:'Bank'},{id:'ewallet',l:'E-Wallet'}].map(m=>(
                      <button type="button" key={m.id} onClick={()=>{setPaymentMethod(m.id); setPaymentProvider('')}} className={`text-[10px] p-2 border rounded ${paymentMethod===m.id?'border-cyan-500 text-cyan-400':'border-slate-700'}`}>{m.l}</button>
                    ))}
                 </div>
                 {(paymentMethod==='transfer'||paymentMethod==='ewallet') && <Input name="accountNumber" placeholder="No Rekening/HP Tujuan" />}
                 <Button type="submit" className="w-full">Simpan</Button>
               </form>
            </Card>
            
            <Card title="Riwayat Transaksi">
               <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs text-slate-400 uppercase">Daftar Transaksi</h4>
                  <button onClick={()=>downloadCSV(getFilteredTransactions(), 'Laporan.csv')} className="text-xs text-cyan-400 flex gap-1"><Download size={12}/> Export CSV</button>
               </div>
               <div className="space-y-2 h-96 overflow-y-auto custom-scrollbar pr-1">
                  {getFilteredTransactions().map(t => (
                     <div key={t.id} className="flex justify-between items-center p-3 bg-slate-950 rounded border border-slate-800">
                        <div><div className="text-sm font-bold text-white">{t.category}</div><div className="text-[10px] text-slate-500">{t.paymentMethod} • {t.date}</div></div>
                        <div className={t.type==='income'?'text-green-400':'text-red-400'}>{formatRupiah(t.amount)}</div>
                     </div>
                  ))}
               </div>
            </Card>
         </div>}

         {['savings','finance','education'].includes(activePage) && <div className="text-center mt-10 text-slate-500">Fitur {activePage} (Mode Ringkas)</div>}
      </main>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 w-full bg-slate-900 border-t border-slate-800 flex justify-around p-3 z-50">
        {NAV_ITEMS.map(i => <button key={i.id} onClick={()=>setActivePage(i.id)} className={activePage===i.id?'text-cyan-400':'text-slate-500'}><i.icon size={24}/></button>)}
      </div>
    </div>
  );
};

export default App;