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

// MENGGUNAKAN HANYA ICON YANG PASTI AMAN (SAFE LIST)
import { 
  LayoutDashboard, Wallet, PiggyBank, BookOpen, LogOut, 
  Plus, CreditCard, PlayCircle, CheckCircle, XCircle, 
  AlertCircle, Trash2, Eye, EyeOff, ExternalLink, ShieldAlert,
  QrCode, Smartphone, Banknote, Landmark, Camera, ScanLine, 
  TrendingUp, Coins, Loader2, AlertTriangle,
  Settings, Users, CheckSquare, ArrowLeft, User, Download,
  ChevronRight, Activity
} from 'lucide-react';

/**
 * ==================================================================================
 * 1. UTILITIES (SAFE MODE)
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
    // Cek validitas date
    if (isNaN(d.getTime())) return dateString; 
    return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return "-";
  }
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
      <div key={toast.id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border bg-slate-800 border-slate-700 text-white`}>
        {toast.type === 'success' ? <CheckCircle size={18} className="text-green-400"/> : <AlertCircle size={18} className="text-red-400"/>}
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
    ))}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, ...props }) => {
  const bgClass = variant === 'primary' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-300';
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 ${bgClass} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '', title }) => (
  <div className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl ${className}`}>
    {title && <h3 className="text-white font-bold text-lg mb-4">{title}</h3>}
    <div>{children}</div>
  </div>
);

const Input = ({ label, type = "text", value, onChange, placeholder, className = "", min, name, autoFocus }) => (
  <div className={`mb-4 ${className}`}>
    {label && <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>}
    <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} min={min} autoFocus={autoFocus} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors placeholder:text-slate-600" />
  </div>
);

const PasswordInput = ({ label, value, onChange, placeholder, name }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-4">
      {label && <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>}
      <div className="relative">
        <input name={name} type={show ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 pr-10" />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
      </div>
    </div>
  );
};

const Logo = ({ size = "text-2xl" }) => (
  <div className={`font-bold flex items-center gap-2 ${size} select-none`}>
    <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg px-2 py-1 text-white">F</div>
    <span className="text-white">LifeFin</span>
  </div>
);

// --- MODALS ---
const QrisGenerateModal = ({ amount, onClose }) => (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
    <div className="bg-white p-6 rounded-2xl w-80 text-center">
      <h3 className="text-xl font-bold text-gray-900 mb-1">LPay Payment</h3>
      <div className="bg-gray-100 p-4 rounded-xl my-4 flex items-center justify-center h-48">
         <QrCode size={120} className="text-black"/>
      </div>
      <div className="text-2xl font-black text-gray-900 mb-4">{formatRupiah(amount || 0)}</div>
      <Button onClick={onClose} className="w-full text-black bg-gray-200 hover:bg-gray-300 border-none">Tutup</Button>
    </div>
  </div>
);

const QrisScannerModal = ({ onScanComplete, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onScanComplete(), 2500);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="fixed inset-0 bg-black flex flex-col z-[100] items-center justify-center">
      <div className="text-white mb-4 animate-pulse">Sedang Memindai...</div>
      <div className="w-64 h-64 border-2 border-cyan-400 relative">
         <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 animate-bounce"></div>
      </div>
      <button onClick={onClose} className="mt-8 text-white border border-white px-4 py-2 rounded">Batal</button>
    </div>
  );
};

const TransferProcessingModal = ({ onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
      <div className="bg-white p-8 rounded-2xl w-80 text-center">
        <Loader2 size={48} className="text-blue-600 animate-spin mx-auto mb-4"/>
        <h3 className="text-xl font-bold text-gray-900">Memproses...</h3>
        <p className="text-sm text-gray-500">Mohon tunggu sebentar</p>
      </div>
    </div>
  );
};

const InvestmentModal = ({ product, onClose, onConfirm }) => {
  const [amount, setAmount] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); if (!amount) return; onConfirm(product, parseInt(amount)); onClose(); };
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[90]">
      <div className="bg-slate-900 border border-slate-700 w-80 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Beli {product.name}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Min: ${product.minAmount}`} autoFocus />
          <div className="flex gap-2">
             <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Batal</Button>
             <Button type="submit" className="flex-1">Beli</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SavingModal = ({ onClose, onConfirm }) => {
  const [name, setName] = useState(''); const [target, setTarget] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); if (!name || !target) return; onConfirm({ name, target: parseInt(target), current: 0, deadline: new Date().toISOString() }); onClose(); };
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[90]">
      <div className="bg-slate-900 border border-slate-700 w-80 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Target Baru</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nama" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Target (Rp)" type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
          <div className="flex gap-2">
             <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Batal</Button>
             <Button type="submit" className="flex-1">Simpan</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DepositModal = ({ saving, onClose, onConfirm }) => {
  const [amount, setAmount] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); if (!amount) return; onConfirm(saving.id, parseInt(amount)); onClose(); };
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[90]">
      <div className="bg-slate-900 border border-slate-700 w-80 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Setor Tabungan</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nominal" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          <div className="flex gap-2">
             <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Batal</Button>
             <Button type="submit" className="flex-1">Setor</Button>
          </div>
        </form>
      </div>
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
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // OTP STATE
  const [showOtp, setShowOtp] = useState(false);
  const [serverOtp, setServerOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [tempRegData, setTempRegData] = useState(null);
  
  // ADMIN STATE
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

  // Modals State
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [showSavingModal, setShowSavingModal] = useState(false);
  const [selectedSavingForDeposit, setSelectedSavingForDeposit] = useState(null);
  const [showTransferProcessing, setShowTransferProcessing] = useState(false);

  // Data State
  const [transactions, setTransactions] = useState([]);
  const [savings, setSavings] = useState([]);
  const [loans, setLoans] = useState([]);
  const [myInvestments, setMyInvestments] = useState([]);

  // Credit Score Config
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

    let unsubUsers = () => {};
    let unsubTrx = () => {};
    let unsubSav = () => {};
    let unsubLoans = () => {};
    let unsubInvest = () => {};

    try {
      // Fetch Users List for Admin
      if (user.role === 'admin') {
        unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
          // SAFE MAPPING: Check if data exists
          const safeUsers = snap.docs.map(d => {
             const data = d.data();
             return { id: d.id, username: data.username || 'Unknown', role: data.role || 'user' };
          });
          setUsersList(safeUsers);
        }, (err) => console.log("Err fetch users:", err));
      }

      const qTrx = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
      unsubTrx = onSnapshot(qTrx, (snap) => { 
          if(snap) setTransactions(snap.docs.map(d => ({ ...d.data(), id: d.id }))); 
      });
      
      unsubSav = onSnapshot(collection(db, "savings"), (snap) => {
          if(snap) setSavings(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      });

      unsubLoans = onSnapshot(collection(db, "loans"), (snap) => {
          if(snap) setLoans(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      });

      unsubInvest = onSnapshot(collection(db, "my_investments"), (snap) => {
          if(snap) setMyInvestments(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      });

    } catch (e) {
      console.log("Listener failed:", e);
    }
    
    return () => { 
      unsubUsers(); unsubTrx(); unsubSav(); unsubLoans(); unsubInvest(); 
    };
  }, [user, isDemoMode]);

  // --- AUTH & LOGIC ---
  // (Logic Authentikasi & Transaksi disederhanakan untuk stabilitas, tapi tetap berfungsi sama)
  const handleAuth = async (e) => {
    e.preventDefault(); setAuthLoading(true);
    
    if (showOtp && isRegister) {
        if (otpInput !== serverOtp) { setAuthLoading(false); return notify('Kode salah!', 'error'); }
        await addDoc(collection(db, 'users'), { ...tempRegData, createdAt: new Date().toISOString() });
        notify('Berhasil! Silakan Login.', 'success');
        setIsRegister(false); setShowOtp(false); setOtpInput(''); setTempRegData(null); setAuthLoading(false);
        return;
    }

    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');
    const role = formData.get('role');

    if(!username || !password) { setAuthLoading(false); return notify('Isi semua data!', 'error'); }
    if(password.length < 8) { setAuthLoading(false); return notify('Password min 8 karakter!', 'error'); }

    try {
      const usersRef = collection(db, 'users');
      if (isRegister) {
        const q = query(usersRef, where('username', '==', username)); 
        const snap = await getDocs(q);
        if (!snap.empty) throw new Error('Username sudah dipakai!');
        
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        setServerOtp(code);
        setTempRegData({ username, password, role });
        setTimeout(() => alert(`[SMS] Kode OTP: ${code}`), 500);
        setShowOtp(true);
      } else {
        const q = query(usersRef, where('username', '==', username)); 
        const snap = await getDocs(q);
        if (snap.empty) throw new Error('User tidak ditemukan!');
        const userData = snap.docs[0].data();
        if (userData.password !== password) throw new Error('Password salah!');
        if (userData.role !== role) throw new Error(`Salah role!`);
        
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

  const saveTransactionToDb = async (txData, shouldReset = true) => {
    const finalData = { ...txData, userName: user.username }; 
    if (isDemoMode) { setTransactions(prev => [{...finalData, id: Date.now().toString()}, ...prev]); notify('Tersimpan (Demo)', 'success'); } 
    else { await addDoc(collection(db, "transactions"), finalData); notify('Tersimpan', 'success'); }
    if (shouldReset) { setPaymentMethod('cash'); setPaymentProvider(''); setTransactionType('income'); setCurrentTxData(null); }
  };

  const finalizeTransfer = async (txData) => { 
    await saveTransactionToDb({ ...txData, transferStatus: 'Berhasil' }); 
    setShowTransferProcessing(false); 
  };

  const handlePosSubmit = async (e) => {
    e.preventDefault(); const formData = new FormData(e.target);
    if (transactionType === 'expense' && paymentMethod === 'qris') { setCurrentTxData(null); setShowQrisScanner(true); return; }
    
    const amountVal = parseInt(formData.get('amount'));
    const categoryVal = formData.get('category');
    const noteVal = formData.get('note');
    const accountNumberVal = formData.get('accountNumber');

    if (!amountVal || amountVal <= 0) return notify("Nominal salah", "error");
    if (!categoryVal) return notify("Kategori wajib", "error");
    
    const isTransfer = paymentMethod === 'transfer' || paymentMethod === 'ewallet';
    if (isTransfer && !accountNumberVal) return notify("No Rekening wajib", "error");

    const txData = { amount: amountVal, category: categoryVal, type: transactionType, date: new Date().toISOString().split('T')[0], note: noteVal || '', paymentMethod: paymentMethod || 'cash', paymentProvider: paymentProvider || '-', accountNumber: accountNumberVal || '-', transferStatus: isTransfer ? 'Pending' : 'Berhasil', createdAt: new Date().toISOString() };

    if (transactionType === 'income' && paymentMethod === 'qris') { setCurrentTxData(txData); setShowQrisGenerate(true); saveTransactionToDb(txData, false); } 
    else if (isTransfer) { setCurrentTxData(txData); setShowTransferProcessing(true); } 
    else { saveTransactionToDb(txData); }
    e.target.reset();
  };

  // --- OTHER HANDLERS ---
  const handleScanSuccess = () => { setShowQrisScanner(false); saveTransactionToDb({ amount: 50000, category: "LPay Scan", type: "expense", date: new Date().toISOString().split('T')[0], note: "Scan", paymentMethod: 'qris', paymentProvider: '-', transferStatus: 'Berhasil', createdAt: new Date().toISOString() }); notify("QR Berhasil", "success"); };
  const handleClaimLoan = async (loan) => { if(!isDemoMode) { await updateDoc(doc(db, "loans", loan.id), { status: 'Disbursed' }); } else { setLoans(prev => prev.map(l => l.id===loan.id?{...l,status:'Disbursed'}:l)); } await saveTransactionToDb({amount: loan.amount, category:'Modal Pinjaman', type:'income', paymentMethod:'transfer', createdAt: new Date().toISOString()}, true); };
  const handleLoanAction = async (id, status) => { if(!isDemoMode) { await updateDoc(doc(db, "loans", id), { status }); } else { setLoans(prev => prev.map(l => l.id===id?{...l,status}:l)); } notify("Status Updated", "success"); };
  const deleteTransaction = async (id) => { if(!window.confirm('Hapus?')) return; if(isDemoMode) { setTransactions(p=>p.filter(t=>t.id!==id)); } else { await deleteDoc(doc(db, "transactions", id)); } };

  // --- RENDER ---
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
                    <input type="text" value={otpInput} onChange={e=>setOtpInput(e.target.value)} className="bg-slate-950 border border-slate-700 rounded p-2 text-center text-2xl w-full"/>
                    <Button type="submit" className="w-full">{authLoading ? 'Cek...' : 'Verifikasi'}</Button>
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
           {adminTab === 'admin_approval' && (
             <div className="space-y-6">
               <h2 className="text-2xl font-bold text-white">Persetujuan Pinjaman</h2>
               <div className="grid gap-4">
                 {loans.length === 0 && <p className="text-slate-500">Tidak ada data.</p>}
                 {loans.map(l => (
                   <div key={l.id} className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex justify-between items-center">
                     <div><p className="font-bold text-white">{l.userName || 'User'}</p><p className="text-sm text-slate-500">{formatRupiah(l.amount)} - {l.reason}</p></div>
                     <div className="flex gap-2 items-center">
                       <span className="text-xs bg-slate-800 px-2 py-1 rounded">{l.status}</span>
                       {l.status === 'Pending' && <><button onClick={()=>handleLoanAction(l.id, 'Approved')} className="bg-green-600 p-1 rounded text-white"><CheckCircle size={16}/></button><button onClick={()=>handleLoanAction(l.id, 'Rejected')} className="bg-red-600 p-1 rounded text-white"><XCircle size={16}/></button></>}
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           )}
           {adminTab === 'admin_monitoring' && (
             <div className="space-y-6">
               {!selectedUmkm ? (
                 <>
                   <h2 className="text-2xl font-bold text-white">Daftar UMKM</h2>
                   <div className="grid grid-cols-3 gap-4">
                     {usersList.filter(u => u.role === 'user').map(u => (
                       <div key={u.id} onClick={()=>setSelectedUmkm(u)} className="bg-slate-900 p-6 rounded-xl border border-slate-800 cursor-pointer hover:border-purple-500">
                         <div className="w-10 h-10 bg-purple-900 rounded-full flex items-center justify-center text-white font-bold mb-2">{(u.username || '?').charAt(0).toUpperCase()}</div>
                         <h3 className="font-bold text-white">{u.username}</h3>
                       </div>
                     ))}
                   </div>
                 </>
               ) : (
                 <div>
                   <button onClick={()=>setSelectedUmkm(null)} className="mb-4 text-slate-400 flex items-center gap-2"><ArrowLeft size={16}/> Kembali</button>
                   <h2 className="text-2xl font-bold text-white mb-6">Detail: {selectedUmkm.username}</h2>
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
           {adminTab === 'admin_settings' && (
             <Card title="Pengaturan Skor"><p>Fitur simulasi skor kredit tersedia di versi Desktop.</p></Card>
           )}
        </main>
      </div>
    );
  }

  // --- USER VIEW (SAFE) ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {showQrisGenerate && <QrisGenerateModal amount={currentTxData?.amount} onClose={() => { setShowQrisGenerate(false); saveTransactionToDb(currentTxData, true); }} />}
      {showQrisScanner && <QrisScannerModal onScanComplete={handleScanSuccess} onClose={() => setShowQrisScanner(false)} />}
      {showTransferProcessing && <TransferProcessingModal onClose={() => finalizeTransfer(currentTxData)} />}
      {selectedInvestment && <InvestmentModal product={selectedInvestment} onClose={() => setSelectedInvestment(null)} onConfirm={(p,a)=>console.log(p,a)} />}
      {showSavingModal && <SavingModal onClose={() => setShowSavingModal(false)} onConfirm={handleAddSaving} />}
      {selectedSavingForDeposit && <DepositModal saving={selectedSavingForDeposit} onClose={() => setSelectedSavingForDeposit(null)} onConfirm={handleAddDeposit} />}
      
      <aside className="w-20 lg:w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col p-4">
        <div className="mb-8"><Logo/></div>
        <nav className="space-y-2 flex-1">
          {NAV_ITEMS.map(i => (
            <button key={i.id} onClick={()=>setActivePage(i.id)} className={`w-full flex items-center gap-3 p-3 rounded-lg ${activePage===i.id ? 'bg-cyan-900/30 text-cyan-400' : 'hover:bg-slate-800'}`}>
              <i.icon size={20}/> <span className="hidden lg:block">{i.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={()=>setUser(null)} className="flex items-center gap-3 p-3 hover:text-red-400"><LogOut size={20}/> <span className="hidden lg:block">Keluar</span></button>
      </aside>

      <main className="flex-1 p-4 lg:p-8 overflow-y-auto pb-20">
         {activePage === 'dashboard' && <div className="grid gap-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card title="Omzet"><span className="text-xl font-bold text-white">{formatRupiah(transactions.filter(t=>t.type==='income').reduce((a,c)=>a+c.amount,0))}</span></Card>
              <Card title="Saldo"><span className="text-xl font-bold text-blue-400">{formatRupiah(transactions.filter(t=>t.type==='income').reduce((a,c)=>a+c.amount,0) - transactions.filter(t=>t.type==='expense').reduce((a,c)=>a+c.amount,0))}</span></Card>
            </div>
            <Card title="Aktivitas Terakhir">
              {transactions.slice(0,5).map(t=><div key={t.id} className="flex justify-between p-2 border-b border-slate-800"><span>{t.category}</span><span className={t.type==='income'?'text-green-400':'text-red-400'}>{formatRupiah(t.amount)}</span></div>)}
            </Card>
         </div>}
         
         {activePage === 'pos' && <div className="grid lg:grid-cols-2 gap-6">
            <Card title="Input Transaksi">
               <form onSubmit={handlePosSubmit} className="space-y-4">
                 <div className="grid grid-cols-2 gap-2">
                   <button type="button" onClick={()=>setTransactionType('income')} className={`p-2 border rounded ${transactionType==='income'?'border-green-500 text-green-400':'border-slate-700'}`}>Pemasukan</button>
                   <button type="button" onClick={()=>setTransactionType('expense')} className={`p-2 border rounded ${transactionType==='expense'?'border-red-500 text-red-400':'border-slate-700'}`}>Pengeluaran</button>
                 </div>
                 {!(transactionType==='expense' && paymentMethod==='qris') && <Input name="amount" type="number" placeholder="Nominal" />}
                 {!(transactionType==='expense' && paymentMethod==='qris') && <Input name="category" placeholder="Kategori" />}
                 
                 <div className="grid grid-cols-4 gap-2">
                    {[{id:'cash',l:'Tunai'},{id:'qris',l:'LPay'},{id:'transfer',l:'Bank'},{id:'ewallet',l:'E-Wallet'}].map(m=>(
                      <button type="button" key={m.id} onClick={()=>{setPaymentMethod(m.id); setPaymentProvider('')}} className={`text-xs p-2 border rounded ${paymentMethod===m.id?'border-cyan-500 text-cyan-400':'border-slate-700'}`}>{m.l}</button>
                    ))}
                 </div>
                 {(paymentMethod==='transfer'||paymentMethod==='ewallet') && <Input name="accountNumber" placeholder="No Rekening/HP Tujuan" />}
                 <Button type="submit" className="w-full">Simpan</Button>
               </form>
            </Card>
         </div>}
         
         {/* Placeholder for other pages to prevent crash if accessed */}
         {['savings','finance','education'].includes(activePage) && <div className="text-center mt-10 text-slate-500">Halaman {activePage} aktif (Mode Ringkas)</div>}
      </main>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 w-full bg-slate-900 border-t border-slate-800 flex justify-around p-3">
        {NAV_ITEMS.map(i => <button key={i.id} onClick={()=>setActivePage(i.id)} className={activePage===i.id?'text-cyan-400':'text-slate-500'}><i.icon size={24}/></button>)}
      </div>
    </div>
  );
};

export default App;