import React, { useState, useEffect, useRef } from 'react';
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
  AlertCircle, Trash2, Eye, EyeOff, ExternalLink, ShieldAlert,
  QrCode, Smartphone, Banknote, Landmark, Camera, ScanLine, 
  TrendingUp, Coins, Loader2, KeyRound, // Icon KeyRound Baru untuk OTP
  Settings, Users, Activity, FileText, CheckSquare, ArrowLeft, User, BarChart,
  ArrowDownCircle, ArrowUpCircle, Download 
} from 'lucide-react';

/**
 * ==================================================================================
 * 1. UTILITIES & HELPERS
 * ==================================================================================
 */

const formatRupiah = (number) => {
  const val = Number(number) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val);
};

const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return dateString || "-";
  }
};

// STATIC DATA
const INVESTMENT_PRODUCTS = [
  { id: '1', name: 'Reksadana Pasar Uang', returnRate: 5, duration: '1 Tahun', minAmount: 100000, risk: 'Rendah' },
  { id: '2', name: 'Obligasi UMKM', returnRate: 8, duration: '3 Tahun', minAmount: 1000000, risk: 'Sedang' },
  { id: '3', name: 'Saham Blue Chip', returnRate: 15, duration: '5 Tahun', minAmount: 5000000, risk: 'Tinggi' }, // Rate dinaikkan jadi 15% biar menarik tapi risk tinggi
];

const EDUCATION_CONTENT = [
  { id: 1, title: 'Dasar Pembukuan Keuangan UMKM', desc: 'Pelajari cara mencatat arus kas masuk dan keluar.', url: 'https://www.youtube.com/results?search_query=cara+pembukuan+keuangan+umkm+sederhana' },
  { id: 2, title: 'Strategi Digital Marketing Low Budget', desc: 'Cara promosi di sosmed tanpa biaya mahal.', url: 'https://www.youtube.com/results?search_query=strategi+digital+marketing+umkm+pemula' },
  { id: 3, title: 'Tips Memisahkan Uang Pribadi & Usaha', desc: 'Solusi agar dompet tidak campur aduk.', url: 'https://www.youtube.com/results?search_query=cara+memisahkan+uang+pribadi+dan+usaha' },
  { id: 4, title: 'Inspirasi Kisah Sukses UMKM', desc: 'Belajar dari pengalaman pengusaha lain.', url: 'https://www.youtube.com/results?search_query=kisah+sukses+pengusaha+umkm+indonesia' },
  { id: 5, title: 'Cara Foto Produk Pakai HP', desc: 'Foto produk profesional modal HP.', url: 'https://www.youtube.com/results?search_query=tutorial+foto+produk+katalog+pakai+hp' },
  { id: 6, title: 'Manajemen Stok Barang', desc: 'Trik agar stok gudang tetap rapi.', url: 'https://www.youtube.com/results?search_query=tips+manajemen+stok+barang+toko+kecil' }
];

// LIST BANK & E-WALLET
const BANKS = ["BCA", "Mandiri", "BRI", "BNI", "BSI"];
const EWALLETS = ["GoPay", "OVO", "Dana", "ShopeePay", "LinkAja"];

// NAV ITEMS USER
const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'pos', icon: CreditCard, label: 'Kasir & LPay' },
  { id: 'savings', icon: PiggyBank, label: 'Tabungan' },
  { id: 'finance', icon: Wallet, label: 'Modal & Invest' },
  { id: 'education', icon: BookOpen, label: 'Edukasi' }
];

// NAV ITEMS ADMIN
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
  <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 animate-in slide-in-from-right">
    {toasts.map(toast => (
      <div key={toast.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-md border ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : toast.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
        {toast.type === 'success' ? <CheckCircle size={18} /> : toast.type === 'warning' ? <AlertTriangle size={18} /> : <AlertCircle size={18} />}
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

const Input = ({ label, type = "text", value, onChange, placeholder, className = "", min, name, autoFocus }) => (
  <div className={`mb-4 ${className}`}>
    {label && <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>}
    <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} min={min} autoFocus={autoFocus} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors placeholder:text-slate-600" />
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

// --- MODALS ---
const QrisGenerateModal = ({ amount, onClose }) => (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm animate-in zoom-in duration-200">
    <div className="bg-white p-6 rounded-2xl w-80 text-center relative shadow-2xl shadow-cyan-500/20">
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"><XCircle size={24}/></button>
      <h3 className="text-xl font-bold text-gray-900 mb-1">LPay Payment</h3>
      <p className="text-xs text-gray-500 mb-4">Minta pelanggan scan ini</p>
      <div className="bg-gray-100 p-4 rounded-xl border-2 border-dashed border-gray-300 mb-4 flex items-center justify-center relative overflow-hidden">
         <div className="w-48 h-48 bg-white grid grid-cols-6 grid-rows-6 gap-1 p-2">
            {[...Array(36)].map((_,i) => (
               <div key={i} className={`bg-black ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-0'} rounded-sm`}></div>
            ))}
            <div className="absolute top-4 left-4 w-12 h-12 border-4 border-black bg-white flex items-center justify-center"><div className="w-6 h-6 bg-black"></div></div>
            <div className="absolute top-4 right-4 w-12 h-12 border-4 border-black bg-white flex items-center justify-center"><div className="w-6 h-6 bg-black"></div></div>
            <div className="absolute bottom-4 left-4 w-12 h-12 border-4 border-black bg-white flex items-center justify-center"><div className="w-6 h-6 bg-black"></div></div>
         </div>
         <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white p-1 rounded-full shadow-lg"><Logo size="text-xs"/></div>
         </div>
      </div>
      <div className="text-2xl font-black text-gray-900 mb-2">{formatRupiah(amount || 0)}</div>
      <div className="text-xs text-gray-400">LifeFin Merchant ID: LF-{Math.floor(Math.random()*10000)}</div>
    </div>
  </div>
);

const QrisScannerModal = ({ onScanComplete, onClose }) => {
  const videoRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanStatus, setScanStatus] = useState('searching'); 
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) { videoRef.current.srcObject = stream; setIsCameraActive(true); }
      } catch (err) { console.log("Camera failed"); }
    };
    startCamera();
    return () => { if (videoRef.current && videoRef.current.srcObject) videoRef.current.srcObject.getTracks().forEach(track => track.stop()); };
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => { setScanStatus('found'); setTimeout(() => onScanComplete(), 1000); }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-[100] animate-in fade-in duration-200">
      <div className="p-4 flex justify-between items-center bg-black/50 backdrop-blur absolute top-0 w-full z-10">
        <h3 className="text-white font-bold flex items-center gap-2"><QrCode size={20}/> Scan LPay</h3>
        <button onClick={onClose} className="text-white/80 hover:text-white"><XCircle size={28}/></button>
      </div>
      <div className="flex-1 relative flex items-center justify-center bg-gray-900 overflow-hidden">
        {isCameraActive ? <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-80"></video> : <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center"><p className="text-gray-500 text-sm">Simulasi Kamera...</p></div>}
        <div className="relative w-64 h-64 border-2 border-cyan-400/50 rounded-3xl z-10 overflow-hidden shadow-[0_0_100px_rgba(34,211,238,0.2)]">
           <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,1)] animate-[scan_2s_infinite_linear]"></div>
           <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl"></div>
           <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl"></div>
           <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl"></div>
           <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-xl"></div>
        </div>
        <div className="absolute bottom-32 text-center w-full z-10">
           {scanStatus === 'searching' ? <div className="inline-flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full text-cyan-400 text-sm font-medium animate-pulse"><ScanLine size={16}/> Mencari kode LPay...</div> : <div className="inline-flex items-center gap-2 bg-green-500 px-6 py-2 rounded-full text-white text-base font-bold animate-in zoom-in"><CheckCircle size={20}/> LPay Ditemukan!</div>}
        </div>
      </div>
    </div>
  );
};

const TransferProcessingModal = ({ onClose }) => {
  const [step, setStep] = useState(0); 
  useEffect(() => { const t1 = setTimeout(() => setStep(1), 1500); const t2 = setTimeout(() => setStep(2), 3000); const t3 = setTimeout(onClose, 4500); return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); }; }, [onClose]);
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm animate-in zoom-in duration-200">
      <div className="bg-white p-8 rounded-2xl w-80 text-center shadow-2xl relative overflow-hidden">
        {step < 2 && <div className="absolute top-0 left-0 w-full h-1 bg-gray-200"><div className="h-full bg-cyan-500 animate-[loading_2s_infinite_ease-in-out]"></div></div>}
        <div className="flex justify-center mb-6">
           {step === 0 && <div className="p-4 bg-blue-100 rounded-full animate-pulse"><Smartphone size={32} className="text-blue-600"/></div>}
           {step === 1 && <div className="p-4 bg-yellow-100 rounded-full"><Loader2 size={32} className="text-yellow-600 animate-spin"/></div>}
           {step === 2 && <div className="p-4 bg-green-100 rounded-full animate-in zoom-in"><CheckCircle size={32} className="text-green-600"/></div>}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{step === 0 && "Menghubungkan..."}{step === 1 && "Memproses Transaksi..."}{step === 2 && "Transfer Berhasil!"}</h3>
        <p className="text-sm text-gray-500">{step === 0 && "Mencari gateway pembayaran"}{step === 1 && "Jangan tutup halaman ini"}{step === 2 && "Dana telah dikirim"}</p>
      </div>
    </div>
  );
};

const InvestmentModal = ({ product, onClose, onConfirm }) => {
  const [amount, setAmount] = useState('');
  const [estReturn, setEstReturn] = useState(0);
  const handleAmountChange = (e) => { const val = parseInt(e.target.value) || 0; setAmount(e.target.value); setEstReturn(val * (product.returnRate / 100)); };
  const handleSubmit = (e) => { e.preventDefault(); if (!amount || parseInt(amount) < product.minAmount) return; onConfirm(product, parseInt(amount)); onClose(); };
  const isValid = parseInt(amount) >= product.minAmount;
  
  // --- RISK WARNING (BARU) ---
  const isHighRiskAmount = parseInt(amount) > 5000000; // Warning jika > 5 Juta
  const isHighRiskProduct = product.risk === 'Tinggi';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-[90] backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full sm:w-96 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-start mb-6">
          <div><h3 className="text-xl font-bold text-white">{product.name}</h3><span className={`text-xs px-2 py-0.5 rounded ${product.risk === 'Rendah' ? 'bg-green-500/20 text-green-400' : product.risk === 'Tinggi' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>Risk: {product.risk}</span></div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><XCircle size={24}/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Nominal Investasi</label>
            <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span><input type="number" value={amount} onChange={handleAmountChange} autoFocus placeholder={product.minAmount} className="w-full bg-slate-950 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-white text-lg font-bold focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-700"/></div>
            <p className={`text-xs mt-2 ${isValid ? 'text-slate-500' : 'text-red-400'}`}>Minimal: {formatRupiah(product.minAmount)}</p>
            
            {/* RISK WARNING UI */}
            {(isHighRiskAmount && isHighRiskProduct) && (
               <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                  <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0"/>
                  <p className="text-[10px] text-red-300">Nominal besar pada produk risiko tinggi! Nilai investasi bisa berfluktuasi drastis.</p>
               </div>
            )}
          </div>
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
            <div className="text-sm text-slate-400"><p>Return/Tahun</p><p>Est. Cuan</p></div>
            <div className="text-right"><p className={`font-bold ${isHighRiskProduct ? 'text-red-400' : 'text-green-400'}`}>{product.returnRate}%</p><p className="font-bold text-white text-lg">+{formatRupiah(estReturn)}</p></div>
          </div>
          <Button type="submit" disabled={!isValid} className={`w-full py-4 text-lg shadow-lg ${isValid ? 'shadow-cyan-500/20' : 'opacity-50 cursor-not-allowed'}`}>Konfirmasi Beli</Button>
        </form>
      </div>
    </div>
  );
};

const SavingModal = ({ onClose, onConfirm }) => {
  const [name, setName] = useState(''); const [target, setTarget] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); if (!name || !target) return; onConfirm({ name, target: parseInt(target), current: 0, deadline: new Date().toISOString() }); onClose(); };
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[90] backdrop-blur-sm animate-in fade-in zoom-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full sm:w-96 rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white">Buat Target Baru</h3><button onClick={onClose} className="text-slate-400 hover:text-white"><XCircle size={24}/></button></div>
        <form onSubmit={handleSubmit} className="space-y-4"><Input label="Nama Target" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Beli Laptop" autoFocus /><Input label="Target Dana (Rp)" type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0" /><Button type="submit" className="w-full">Simpan Target</Button></form>
      </div>
    </div>
  );
};

const DepositModal = ({ saving, onClose, onConfirm }) => {
  const [amount, setAmount] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); if (!amount || parseInt(amount) <= 0) return; onConfirm(saving.id, parseInt(amount)); onClose(); };
  const currentVal = saving.current || 0; const percentage = Math.min((currentVal / saving.target) * 100, 100);
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[90] backdrop-blur-sm animate-in fade-in zoom-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full sm:w-96 rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-white">Setor Tabungan</h3><button onClick={onClose} className="text-slate-400 hover:text-white"><XCircle size={24}/></button></div>
        <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700"><p className="text-sm text-slate-400 mb-1">Target: {saving.name}</p><div className="flex justify-between items-end mb-2"><span className="text-xl font-bold text-white">{formatRupiah(currentVal)}</span><span className="text-xs text-slate-500">dari {formatRupiah(saving.target)}</span></div><div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden"><div className="bg-cyan-500 h-2 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div></div></div>
        <form onSubmit={handleSubmit} className="space-y-4"><Input label="Nominal Setor (Rp)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" autoFocus /><Button type="submit" className="w-full">Konfirmasi Setor</Button></form>
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
  
  // OTP STATE (NEW)
  const [showOtp, setShowOtp] = useState(false);
  const [serverOtp, setServerOtp] = useState(''); // OTP yang "dikirim" server
  const [otpInput, setOtpInput] = useState(''); // Input user
  const [tempRegData, setTempRegData] = useState(null); // Data sementara
  
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

  // Credit Score Config (Mock State)
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

    // Fetch Users List for Admin (Monitoring)
    let unsubUsers = () => {};
    if (user.role === 'admin') {
      unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
        setUsersList(snap.docs.map(d => ({...d.data(), id: d.id})));
      }, (err) => console.log("Err fetch users:", err));
    }

    let unsubTrx, unsubSav, unsubLoans, unsubInvest;

    try {
      const qTrx = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
      unsubTrx = onSnapshot(qTrx, (snap) => { if (snap && snap.docs) setTransactions(snap.docs.map(d => ({ ...d.data(), id: d.id }))); }, (err) => console.log("Trx Error:", err));
      
      unsubSav = onSnapshot(collection(db, "savings"), (snap) => setSavings(snap.docs.map(d => ({ ...d.data(), id: d.id }))));
      unsubLoans = onSnapshot(collection(db, "loans"), (snap) => setLoans(snap.docs.map(d => ({ ...d.data(), id: d.id }))));
      unsubInvest = onSnapshot(collection(db, "my_investments"), (snap) => setMyInvestments(snap.docs.map(d => ({ ...d.data(), id: d.id }))));

    } catch (e) {
      console.log("Listener failed:", e);
    }
    
    return () => { 
      if(unsubUsers) unsubUsers();
      if(unsubTrx) unsubTrx(); 
      if(unsubSav) unsubSav(); 
      if(unsubLoans) unsubLoans(); 
      if(unsubInvest) unsubInvest(); 
    };
  }, [user, isDemoMode]);

  // --- AUTH ACTIONS ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);

    // --- OTP VERIFICATION FLOW ---
    if (showOtp && isRegister) {
        if (otpInput !== serverOtp) {
            setAuthLoading(false);
            return notify('Kode OTP salah! Coba lagi.', 'error');
        }
        
        // OTP Verified - Create User
        try {
            const usersRef = collection(db, 'users');
            await addDoc(usersRef, { 
                username: tempRegData.username, 
                password: tempRegData.password, 
                role: tempRegData.role, 
                createdAt: new Date().toISOString() 
            });
            notify('Verifikasi Berhasil! Silakan Login.', 'success');
            
            // Reset
            setIsRegister(false);
            setShowOtp(false);
            setOtpInput('');
            setTempRegData(null);
        } catch (err) {
            notify(err.message, 'error');
        } finally {
            setAuthLoading(false);
        }
        return;
    }

    // --- NORMAL AUTH FLOW ---
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');
    const role = formData.get('role');

    if(!username || !password) {
      setAuthLoading(false);
      return notify('Username dan Password wajib diisi!', 'error');
    }

    // --- PASSWORD LENGTH VALIDATION ---
    if (password.length < 8) {
        setAuthLoading(false);
        return notify('Password harus minimal 8 karakter!', 'error');
    }

    try {
      const usersRef = collection(db, 'users');
      
      if (isRegister) {
        const q = query(usersRef, where('username', '==', username)); 
        const snap = await getDocs(q);
        if (!snap.empty) throw new Error('Username sudah terpakai!');

        // --- START OTP SIMULATION ---
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        setServerOtp(code);
        setTempRegData({ username, password, role });
        
        // Simulate sending SMS
        setTimeout(() => {
            alert(`[SMS LifeFin] Kode OTP Anda: ${code}`);
        }, 500); // Delay sedikit biar natural
        
        setShowOtp(true);
        notify('Kode OTP dikirim ke perangkat Anda.', 'info');
        // -----------------------------

      } else {
        const q = query(usersRef, where('username', '==', username)); const snap = await getDocs(q);
        if (snap.empty) throw new Error('Username tidak ditemukan!');
        const userData = snap.docs[0].data();
        if (userData.password !== password) throw new Error('Password salah!');
        if (userData.role !== role) throw new Error(`Akun ini bukan role ${role}!`);
        setIsDemoMode(false); setUser({ username, role }); notify(`Login Sukses! Halo, ${username}`, 'success');
      }
    } catch (err) { notify(err.message, 'error'); } finally { setAuthLoading(false); }
  };

  const handleDemoLogin = () => {
    if(window.confirm("Masuk Mode Demo?")) { setIsDemoMode(true); setUser({ username: "Tamu Demo", role: "user" }); setTransactions([{id:'d1', amount:500000, category:'Penjualan Demo', type:'income', method: 'cash', paymentMethod: 'cash', paymentProvider: '-', date: new Date().toISOString(), createdAt: new Date().toISOString(), userName: 'Tamu Demo'}]); setSavings([{id:'d1', name:'Tabungan Demo', target:1000000, current:250000, userName: 'Tamu Demo'}]); notify("Masuk Mode Demo (Offline)", "info"); }
  };

  // --- SAVE LOGIC (Updated with userName) ---
  const saveTransactionToDb = async (txData, shouldReset = true) => {
    const finalData = { ...txData, userName: user.username }; 
    if (isDemoMode) { setTransactions(prev => [{...finalData, id: Date.now().toString()}, ...prev]); notify('Transaksi tersimpan (Demo)!', 'success'); } 
    else { await addDoc(collection(db, "transactions"), finalData); notify('Transaksi tersimpan!', 'success'); }
    
    if (shouldReset) {
       setPaymentMethod('cash'); setPaymentProvider(''); setTransactionType('income'); setCurrentTxData(null);
    }
  };
  const finalizeTransfer = async (txData) => { const finalData = { ...txData, transferStatus: 'Berhasil' }; await saveTransactionToDb(finalData); setShowTransferProcessing(false); };
  
  const handlePosSubmit = async (e) => {
    e.preventDefault(); const formData = new FormData(e.target);
    if (transactionType === 'expense' && paymentMethod === 'qris') { setCurrentTxData(null); setShowQrisScanner(true); return; }
    const amountVal = parseInt(formData.get('amount')); const categoryVal = formData.get('category'); const noteVal = formData.get('note'); const accountNumberVal = formData.get('accountNumber');
    if (!amountVal || isNaN(amountVal) || amountVal <= 0) return notify("Nominal harus positif!", "error");
    if (!categoryVal) return notify("Kategori wajib diisi!", "error");
    const isTransfer = paymentMethod === 'transfer' || paymentMethod === 'ewallet';
    
    // --- VALIDASI BARU UNTUK NO REKENING ---
    if (isTransfer && (!accountNumberVal || accountNumberVal.trim() === "")) {
       return notify("Nomor Rekening/HP Tujuan wajib diisi!", "error");
    }

    const txData = { amount: amountVal, category: categoryVal, type: transactionType, date: new Date().toISOString().split('T')[0], note: noteVal, paymentMethod: paymentMethod || 'cash', paymentProvider: paymentProvider || '-', accountNumber: accountNumberVal || '-', transferStatus: isTransfer ? 'Pending' : 'Berhasil', createdAt: new Date().toISOString() };
    
    // JANGAN RESET FORM JIKA QRIS GENERATE (INCOME)
    if (transactionType === 'income' && paymentMethod === 'qris') { 
        setCurrentTxData(txData); 
        setShowQrisGenerate(true); 
        saveTransactionToDb(txData, false); 
    } 
    else if (isTransfer) { setCurrentTxData(txData); setShowTransferProcessing(true); } 
    else { saveTransactionToDb(txData); }
    e.target.reset();
  };
  
  const handleScanSuccess = () => { setShowQrisScanner(false); const simulatedData = { amount: (Math.floor(Math.random() * 50) + 10) * 1000, category: "Pembayaran LPay", type: "expense", date: new Date().toISOString().split('T')[0], note: "Merchant: Warung Scan #" + Math.floor(Math.random() * 999), paymentMethod: 'qris', paymentProvider: '-', transferStatus: 'Berhasil', createdAt: new Date().toISOString() }; notify(`LPay Berhasil! Terbayar: ${formatRupiah(simulatedData.amount)}`, "success"); saveTransactionToDb(simulatedData); };
  
  // --- WITHDRAW INVESTMENT LOGIC (WITH RISK) ---
  const handleWithdrawInvestment = async (inv) => {
    if(!window.confirm(`Cairkan ${inv.name} sekarang?`)) return;
    
    // --- RISK SIMULATION LOGIC ---
    let actualReturnRate = inv.returnRate; // Default expectation
    
    // Random factor based on Risk Level
    const luckFactor = Math.random(); // 0.0 - 1.0
    let noteText = "";
    let statusColor = "success";

    if (inv.risk === 'Tinggi') {
        // High Risk: 30% chance loss, 20% chance huge profit, 50% normal
        if (luckFactor < 0.3) {
            actualReturnRate = -10; // RUGI 10%
            noteText = "⚠️ Rugi Investasi (Market Crash)";
            statusColor = "warning";
        } else if (luckFactor > 0.8) {
            actualReturnRate = inv.returnRate * 1.5; // UNTUNG GEDE (1.5x lipat rate)
            noteText = "🚀 Profit Tinggi (Market Bullish)";
        }
    } else if (inv.risk === 'Sedang') {
        // Medium Risk: 10% chance small loss
        if (luckFactor < 0.1) {
             actualReturnRate = -2;
             noteText = "⚠️ Koreksi Pasar Sedikit";
             statusColor = "warning";
        }
    } 
    // Low Risk: Always safe (almost)

    const profit = inv.amount * (actualReturnRate / 100);
    const totalReturn = inv.amount + profit;

    // Show Toast based on Result
    if (profit < 0) {
        notify(`Investasi Rugi: ${formatRupiah(Math.abs(profit))}`, "error");
    } else {
        notify(`Cuan Cair: ${formatRupiah(profit)}`, "success");
    }

    await addTransactionFn({
        amount: totalReturn,
        category: 'Pencairan Investasi',
        type: 'income',
        note: `Modal: ${formatRupiah(inv.amount)} | Hasil: ${formatRupiah(totalReturn)} (${noteText})`,
        paymentMethod: 'transfer',
        paymentProvider: 'System',
        transferStatus: 'Berhasil'
    });

    if (isDemoMode) {
       setMyInvestments(prev => prev.filter(i => i.id !== inv.id));
    } else {
       await deleteDoc(doc(db, "my_investments", inv.id));
    }
  };

  const deleteTransaction = async (id) => { if(!window.confirm('Hapus data ini?')) return; if (isDemoMode) { setTransactions(prev => prev.filter(t => t.id !== id)); notify('Terhapus!', 'info'); } else { await deleteDoc(doc(db, "transactions", id)); notify('Terhapus!', 'info'); } };
  const addTransactionFn = async (trx) => { const finalData = { ...trx, userName: user.username }; if (isDemoMode) { setTransactions(prev => [{...finalData, id: Date.now().toString()}, ...prev]); } else { await addDoc(collection(db, "transactions"), { ...finalData, createdAt: new Date().toISOString() }); } };
  const handleAddSaving = async (sv) => { const savingData = { ...sv, current: 0, userName: user.username }; if (isDemoMode) { setSavings(prev => [...prev, {...savingData, id:Date.now().toString()}]); } else { await addDoc(collection(db, "savings"), savingData); } notify('Target dibuat!', 'success'); };
  const handleAddDeposit = async (id, amount) => { if (isDemoMode) { setSavings(prev => prev.map(s => s.id===id ? {...s, current: (s.current || 0) + amount} : s)); } else { const target = savings.find(s => s.id === id); if (target) { const newCurrent = (target.current || 0) + amount; await updateDoc(doc(db, "savings", id), { current: newCurrent }); await addDoc(collection(db, "transactions"), { date: new Date().toISOString().split('T')[0], type: 'expense', category: 'Tabungan', amount: amount, note: `Setor ke ${target.name}`, paymentMethod: 'auto-debit', paymentProvider: '-', transferStatus: 'Berhasil', createdAt: new Date().toISOString(), userName: user.username }); } } notify('Berhasil setor!', 'success'); };
  
  // --- NEW: CLAIM LOAN HANDLER ---
  const handleClaimLoan = async (loan) => {
    if (!window.confirm(`Cairkan pinjaman sebesar ${formatRupiah(loan.amount)}?`)) return;

    // 1. Update Status di Firebase
    if (!isDemoMode) {
        await updateDoc(doc(db, "loans", loan.id), { status: 'Disbursed' });
    } else {
        setLoans(prev => prev.map(l => l.id === loan.id ? { ...l, status: 'Disbursed' } : l));
    }

    // 2. Masukkan Uang ke Kas (Income)
    await addTransactionFn({
        amount: loan.amount,
        category: 'Pencairan Modal Pinjaman',
        type: 'income',
        note: `Pinjaman ${loan.reason} Disetujui`,
        paymentMethod: 'transfer',
        paymentProvider: 'Bank',
        transferStatus: 'Berhasil'
    });

    notify("Dana berhasil dicairkan ke kas!", "success");
  };

  const applyLoan = async ({ amount, reason }) => { if (!amount || amount <= 0) return notify("Jumlah salah!", "error"); const data = { amount, reason, status: 'Pending', date: new Date().toLocaleDateString('id-ID'), userName: user.username, userScore: 780 }; if (isDemoMode) { setLoans(prev=>[...prev, {...data, id: Date.now().toString()}]); } else { await addDoc(collection(db, "loans"), data); } notify('Pengajuan terkirim!', 'success'); };
  
  // --- UPDATED: BUY INVESTMENT WITH RISK FIELD ---
  const handleBuyInvestment = async (product, amount) => { 
      const invData = { 
          name: product.name, 
          amount, 
          returnRate: product.returnRate, 
          risk: product.risk, // SIMPAN RISK LEVEL
          startDate: new Date().toLocaleDateString('id-ID'), 
          userName: user.username 
      };

      if (isDemoMode) { 
          setMyInvestments(prev=>[...prev, {id: Date.now().toString(), ...invData}]); 
      } else { 
          await addDoc(collection(db, "my_investments"), invData); 
          await addTransactionFn({ 
              date: new Date().toISOString().split('T')[0], 
              type: 'expense', 
              category: 'Investasi', 
              amount: amount, 
              note: `Beli ${product.name}`, 
              paymentMethod: 'auto-debit', 
              paymentProvider: '-', 
              transferStatus: 'Berhasil' 
          }); 
      } 
      notify('Investasi berhasil!', 'success'); 
  };

  const handleLoanAction = async (id, status) => { if (isDemoMode) { setLoans(prev=>prev.map(l=>l.id===id?{...l,status}:l)); } else { await updateDoc(doc(db, "loans", id), { status }); } notify(`Status: ${status}`, 'success'); };

  // --- USER SCORE CALCULATION ---
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const profit = totalIncome - totalExpense;
  
  const calculateScore = () => {
    let score = scoreConfig.base;
    score += Math.min(Math.floor(totalIncome / 100000) * scoreConfig.trxWeight, 200);
    if (profit > 0) score += 100;
    score += Math.min(savings.length * scoreConfig.savingWeight, 150);
    return Math.min(score, 850);
  };

  const userCreditScore = calculateScore();

  const getScoreColor = (score) => {
    if (score >= 700) return "text-blue-400";
    if (score >= 500) return "text-yellow-400";
    return "text-red-400";
  };

  // --- RENDER AUTH ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <div className="absolute inset-0 overflow-hidden"><div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]"/><div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[120px]"/></div>
        <div className="w-full max-w-md z-10 animate-in zoom-in duration-500">
          <div className="mb-8 flex justify-center scale-125"><Logo /></div>
          <Card className="border-t-4 border-t-cyan-500 bg-slate-900/80 backdrop-blur-xl relative">
            <div className="absolute top-2 right-2 text-[10px] text-slate-600 bg-slate-900 px-2 py-1 rounded border border-slate-800">v1.29.25.12</div>
            <h2 className="text-2xl font-bold text-white mb-2 text-center">{isRegister ? 'Daftar Akun Baru' : 'Login LifeFin'}</h2>
            <form onSubmit={handleAuth} className="space-y-4">
              {showOtp ? (
                  // --- TAMPILAN OTP ---
                  <div className="animate-in fade-in zoom-in">
                      <div className="text-center mb-4">
                          <div className="bg-cyan-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                             <KeyRound className="text-cyan-400" size={24}/>
                          </div>
                          <p className="text-slate-300 text-sm">Masukkan 4 digit kode yang telah dikirim.</p>
                      </div>
                      <div className="mb-4">
                          <input 
                              type="text" 
                              maxLength="4"
                              value={otpInput}
                              onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white text-center text-2xl font-bold tracking-widest focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors" 
                              placeholder="0000"
                              autoFocus
                          />
                      </div>
                      <Button type="submit" disabled={authLoading} className="w-full py-3 text-lg shadow-xl shadow-cyan-900/20">
                         {authLoading ? 'Memverifikasi...' : 'Verifikasi OTP'}
                      </Button>
                      <div className="mt-4 text-center">
                          <button type="button" onClick={() => setShowOtp(false)} className="text-sm text-slate-500 hover:text-slate-300">Kembali</button>
                      </div>
                  </div>
              ) : (
                  // --- TAMPILAN FORM REGISTRASI/LOGIN BIASA ---
                  <>
                    <Input name="username" label="Username" placeholder="Masukkan username" />
                    <PasswordInput name="password" label="Password" placeholder="Masukkan password" />
                    <div className="flex gap-4 mb-4 p-3 bg-slate-950 rounded-lg border border-slate-800">
                       <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-900"><input type="radio" name="role" value="user" defaultChecked className="accent-cyan-500"/><span className="text-slate-300 text-sm font-medium">UMKM</span></label>
                       <div className="w-px bg-slate-800 h-6"></div>
                       <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-900"><input type="radio" name="role" value="admin" className="accent-purple-500"/><span className="text-slate-300 text-sm font-medium">Admin</span></label>
                    </div>
                    <Button type="submit" disabled={authLoading} className="w-full py-3 text-lg shadow-xl shadow-cyan-900/20">{authLoading ? 'Memproses...' : (isRegister ? 'Daftar Sekarang' : 'Masuk Dashboard')}</Button>
                  </>
              )}
            </form>
            {!showOtp && (
                <>
                <div className="mt-4 pt-4 border-t border-slate-800"><button type="button" onClick={handleDemoLogin} className="w-full flex items-center justify-center gap-2 text-yellow-500 hover:text-yellow-400 text-sm font-bold bg-yellow-500/10 py-2 rounded-lg border border-yellow-500/30"><ShieldAlert size={16}/> Masuk Mode Demo</button></div>
                <div className="mt-4 text-center text-sm text-slate-500">{isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'} <button type="button" onClick={() => setIsRegister(!isRegister)} className="text-cyan-400 font-bold ml-1 hover:text-cyan-300 transition-colors underline decoration-dotted">{isRegister ? 'Login di sini' : 'Daftar Gratis'}</button></div>
                </>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // --- ADMIN VIEW (NEW REVISED LAYOUT) ---
  if (user.role === 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        
        {/* Admin Sidebar */}
        <aside className="w-20 lg:w-64 bg-slate-900 border-r border-slate-800 fixed h-full z-20 hidden md:flex flex-col">
          <div className="p-6 flex justify-center lg:justify-start h-20 items-center"><div className="lg:hidden"><Logo size="text-xl"/></div><div className="hidden lg:block"><Logo/></div></div>
          <div className="px-6 mb-2"><span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-500/50 uppercase tracking-wider">Admin Portal</span></div>
          <nav className="flex-1 px-3 space-y-1.5 mt-2">
            {ADMIN_NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => {setAdminTab(item.id); setSelectedUmkm(null);}} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group ${adminTab === item.id ? 'bg-purple-600/10 text-purple-400 font-bold border border-purple-500/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                <item.icon className={`w-5 h-5 ${adminTab === item.id ? 'text-purple-400' : 'text-slate-500 group-hover:text-white'}`} /><span className="hidden lg:inline">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-800"><button onClick={() => setUser(null)} className="w-full flex items-center justify-center lg:justify-start gap-3 text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10"><LogOut size={20} /><span className="hidden lg:inline font-medium">Keluar</span></button></div>
        </aside>
        
        {/* Admin Content */}
        <main className="flex-1 md:ml-20 lg:ml-64 p-4 lg:p-8 max-w-7xl mx-auto w-full mb-20 md:mb-0">
           <header className="mb-8 hidden md:block"><h1 className="text-3xl font-bold text-white mb-1 capitalize">{ADMIN_NAV_ITEMS.find(i=>i.id===adminTab)?.label}</h1><p className="text-slate-400 text-sm">Admin Control Panel</p></header>
           
           {/* TAB: APPROVAL */}
           {adminTab === 'admin_approval' && (
             <div className="space-y-6 animate-in fade-in">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-slate-800 border-l-4 border-l-yellow-500">
                     <h3 className="text-slate-400 text-xs font-bold uppercase">Menunggu Persetujuan</h3>
                     <p className="text-3xl font-bold text-yellow-400 mt-2">{loans.filter(l => l.status === 'Pending').length}</p>
                  </Card>
                  <Card className="bg-slate-800 border-l-4 border-l-green-500">
                     <h3 className="text-slate-400 text-xs font-bold uppercase">Total Disetujui</h3>
                     <p className="text-3xl font-bold text-green-400 mt-2">{loans.filter(l => l.status === 'Approved').length}</p>
                  </Card>
               </div>
               <Card title="Antrian Pengajuan Pinjaman">
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-left text-sm text-slate-400">
                      <thead className="bg-slate-950 text-slate-200 uppercase font-bold text-xs"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Jumlah</th><th className="px-4 py-3">Skor</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead>
                      <tbody className="divide-y divide-slate-800">
                        {loans.map(loan => (
                          <tr key={loan.id} className="hover:bg-slate-800/50">
                            <td className="px-4 py-4 text-white font-medium">{loan.userName}<div className="text-xs text-slate-500">{loan.date}</div></td>
                            <td className="px-4 py-4">{formatRupiah(loan.amount)}</td>
                            <td className="px-4 py-4"><span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded font-bold">{loan.userScore}</span></td>
                            <td className="px-4 py-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${loan.status === 'Approved' ? 'bg-green-500/20 text-green-400' : loan.status === 'Rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{loan.status}</span></td>
                            <td className="px-4 py-4 flex justify-end gap-2">
                              {loan.status === 'Pending' && <><button onClick={() => handleLoanAction(loan.id, 'Approved')} className="bg-green-600 p-1.5 rounded-md text-white hover:bg-green-500"><CheckCircle size={16}/></button><button onClick={() => handleLoanAction(loan.id, 'Rejected')} className="bg-red-600 p-1.5 rounded-md text-white hover:bg-red-500"><XCircle size={16}/></button></>}
                            </td>
                          </tr>
                        ))}
                        {loans.length === 0 && <tr><td colSpan="5" className="text-center py-8 italic">Tidak ada pengajuan baru.</td></tr>}
                      </tbody>
                    </table>
                  </div>
               </Card>
             </div>
           )}

           {/* TAB: MONITORING UMKM (UPDATED) */}
           {adminTab === 'admin_monitoring' && (
              <div className="space-y-6 animate-in fade-in">
                 {!selectedUmkm ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {usersList.filter(u => u.role === 'user').map(u => (
                          <div key={u.id} onClick={() => setSelectedUmkm(u)} className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-purple-500/50 cursor-pointer transition-all group">
                             <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors">
                                <User size={24} className="text-slate-400 group-hover:text-purple-400"/>
                             </div>
                             <h3 className="text-white font-bold text-lg truncate">{u.username}</h3>
                             <p className="text-xs text-slate-500 mt-1">UMKM Terdaftar</p>
                             <div className="mt-4 text-xs text-purple-400 flex items-center gap-1">Lihat Detail <ExternalLink size={10}/></div>
                          </div>
                        ))}
                      </div>
                      {usersList.filter(u => u.role === 'user').length === 0 && <div className="text-center text-slate-500 py-10 border border-slate-800 rounded-xl border-dashed">Belum ada UMKM terdaftar.</div>}
                    </>
                 ) : (
                    <div className="animate-in slide-in-from-right">
                       <button onClick={() => setSelectedUmkm(null)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"><ArrowLeft size={18}/> Kembali ke Daftar</button>
                       
                       <div className="flex items-center gap-4 mb-8">
                          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">{selectedUmkm.username.charAt(0).toUpperCase()}</div>
                          <div>
                             <h2 className="text-2xl font-bold text-white">{selectedUmkm.username}</h2>
                             <p className="text-slate-400 text-sm">Dashboard Monitoring Real-time</p>
                          </div>
                       </div>

                       {/* DASHBOARD MINI FOR SELECTED USER */}
                       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                          <Card className="border-l-4 border-l-cyan-500">
                             <div className="text-xs text-slate-400 uppercase">Total Omzet</div>
                             <div className="text-xl font-bold text-white">{formatRupiah(transactions.filter(t => t.userName === selectedUmkm.username && t.type === 'income').reduce((a,c)=>a+c.amount,0))}</div>
                          </Card>
                          <Card className="border-l-4 border-l-green-500">
                             <div className="text-xs text-slate-400 uppercase">Laba Bersih</div>
                             <div className="text-xl font-bold text-green-400">{formatRupiah(transactions.filter(t => t.userName === selectedUmkm.username && t.type === 'income').reduce((a,c)=>a+c.amount,0) - transactions.filter(t => t.userName === selectedUmkm.username && t.type === 'expense').reduce((a,c)=>a+c.amount,0))}</div>
                          </Card>
                          <Card className="border-l-4 border-l-purple-500">
                             <div className="text-xs text-slate-400 uppercase">Tabungan</div>
                             <div className="text-xl font-bold text-white">{formatRupiah(savings.filter(s => s.userName === selectedUmkm.username).reduce((a,c)=>a+c.current,0))}</div>
                          </Card>
                          <Card>
                             <div className="text-xs text-slate-400 uppercase">Skor Kredit</div>
                             <div className="text-2xl font-black text-blue-400">780</div>
                          </Card>
                       </div>

                       <Card title={`Riwayat Transaksi: ${selectedUmkm.username}`}>
                          <div className="overflow-x-auto">
                             <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-slate-950 text-slate-200 uppercase font-bold text-xs"><tr><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Tipe</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3 text-right">Jumlah</th></tr></thead>
                                <tbody className="divide-y divide-slate-800">
                                   {transactions.filter(t => t.userName === selectedUmkm.username).map(t => (
                                      <tr key={t.id} className="hover:bg-slate-800/50">
                                         <td className="px-4 py-3">{formatDate(t.date)}</td>
                                         <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] uppercase ${t.type==='income'?'bg-green-500/10 text-green-400':'bg-red-500/10 text-red-400'}`}>{t.type==='income'?'Masuk':'Keluar'}</span></td>
                                         <td className="px-4 py-3 text-white">{t.category}</td>
                                         <td className={`px-4 py-3 text-right font-bold ${t.type==='income'?'text-green-400':'text-red-400'}`}>{formatRupiah(t.amount)}</td>
                                      </tr>
                                   ))}
                                   {transactions.filter(t => t.userName === selectedUmkm.username).length === 0 && <tr><td colSpan="4" className="text-center py-8 italic">Belum ada transaksi.</td></tr>}
                                </tbody>
                             </table>
                          </div>
                       </Card>
                    </div>
                 )}
              </div>
           )}

           {/* TAB: SETTINGS */}
           {adminTab === 'admin_settings' && (
              <div className="space-y-6 animate-in fade-in">
                 <Card title="Konfigurasi Algoritma Skor Kredit">
                    <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-lg mb-6 text-sm text-blue-300 flex gap-3 items-start">
                       <ShieldAlert className="shrink-0 mt-0.5"/>
                       <div>
                          <p className="font-bold">Mode Simulasi</p>
                          <p>Pengubahan nilai di sini akan mempengaruhi perhitungan skor kredit user secara real-time pada update berikutnya.</p>
                       </div>
                    </div>
                    <div className="space-y-6 max-w-xl">
                       <div><div className="flex justify-between mb-2"><label className="text-sm text-slate-400">Skor Dasar (Base Score)</label><span className="text-white font-bold">{scoreConfig.base}</span></div><input type="range" min="300" max="500" value={scoreConfig.base} onChange={e=>setScoreConfig({...scoreConfig, base: parseInt(e.target.value)})} className="w-full accent-purple-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"/></div>
                       <div><div className="flex justify-between mb-2"><label className="text-sm text-slate-400">Bobot Volume Transaksi</label><span className="text-white font-bold">{scoreConfig.trxWeight} Poin</span></div><input type="range" min="1" max="10" value={scoreConfig.trxWeight} onChange={e=>setScoreConfig({...scoreConfig, trxWeight: parseInt(e.target.value)})} className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"/></div>
                       <div><div className="flex justify-between mb-2"><label className="text-sm text-slate-400">Bobot Konsistensi Tabungan</label><span className="text-white font-bold">{scoreConfig.savingWeight} Poin</span></div><input type="range" min="10" max="100" value={scoreConfig.savingWeight} onChange={e=>setScoreConfig({...scoreConfig, savingWeight: parseInt(e.target.value)})} className="w-full accent-green-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"/></div>
                       <div className="pt-4 border-t border-slate-800 flex justify-end"><Button onClick={() => notify("Konfigurasi Skor Kredit Berhasil Disimpan!", "success")}>Simpan Perubahan</Button></div>
                    </div>
                 </Card>
              </div>
           )}
        </main>
        
        {/* Mobile Nav Admin */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around p-3 z-50">
           {ADMIN_NAV_ITEMS.map(item => (
             <button key={item.id} onClick={() => setAdminTab(item.id)} className={`p-2 rounded-lg ${adminTab === item.id ? 'text-purple-400' : 'text-slate-500'}`}>
               <item.icon className="w-6 h-6" />
             </button>
           ))}
        </div>
      </div>
    );
  }

  // --- USER VIEW ---
  
  const chartData = Object.entries(transactions.reduce((acc, t) => {
    if (t.type === 'income') acc[t.date] = (acc[t.date] || 0) + t.amount;
    return acc;
  }, {})).sort().slice(-7).map(([date, value]) => ({ date, value }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {showQrisGenerate && <QrisGenerateModal amount={currentTxData?.amount} onClose={() => {
          setShowQrisGenerate(false);
          setPaymentMethod('cash'); 
          setPaymentProvider(''); 
          setTransactionType('income'); 
          setCurrentTxData(null);
      }} />}
      {showQrisScanner && <QrisScannerModal onScanComplete={handleScanSuccess} onClose={() => setShowQrisScanner(false)} />}
      {showTransferProcessing && <TransferProcessingModal onClose={() => finalizeTransfer(currentTxData)} />}
      {selectedInvestment && <InvestmentModal product={selectedInvestment} onClose={() => setSelectedInvestment(null)} onConfirm={handleBuyInvestment} />}
      {showSavingModal && <SavingModal onClose={() => setShowSavingModal(false)} onConfirm={handleAddSaving} />}
      {selectedSavingForDeposit && <DepositModal saving={selectedSavingForDeposit} onClose={() => setSelectedSavingForDeposit(null)} onConfirm={handleAddDeposit} />}
      
      {/* Sidebar User */}
      <aside className="w-20 lg:w-64 bg-slate-900 border-r border-slate-800 fixed h-full z-20 hidden md:flex flex-col">
        <div className="p-6 flex justify-center lg:justify-start h-20 items-center"><div className="lg:hidden"><Logo size="text-xl"/></div><div className="hidden lg:block"><Logo/></div></div>
        <nav className="flex-1 px-3 space-y-1.5 mt-4">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActivePage(item.id)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group ${activePage === item.id ? 'bg-cyan-600/10 text-cyan-400 font-bold' : 'text-slate-400 hover:bg-slate-800'}`}>
              <item.icon className={`w-5 h-5 ${activePage === item.id ? 'text-cyan-400' : 'text-slate-500 group-hover:text-white'}`} /><span className="hidden lg:inline">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800"><button onClick={() => setUser(null)} className="w-full flex items-center justify-center lg:justify-start gap-3 text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10"><LogOut size={20} /><span className="hidden lg:inline font-medium">Keluar</span></button></div>
      </aside>
      
      <main className="flex-1 md:ml-20 lg:ml-64 p-4 lg:p-8 max-w-7xl mx-auto w-full mb-20 md:mb-0">
        <header className="mb-8 hidden md:block"><h1 className="text-3xl font-bold text-white mb-1 capitalize">{activePage === 'pos' ? 'Sistem Kasir & Pembayaran' : activePage}</h1><p className="text-slate-400 text-sm">LifeFin v1.29.25.12 {isDemoMode ? '(OFFLINE DEMO)' : '(Connected)'}</p></header>
        
        {activePage === 'dashboard' && <div className="space-y-6 animate-in fade-in"><div className="grid grid-cols-1 md:grid-cols-4 gap-4"><Card className="border-l-4 border-l-cyan-500"><div>Total Omzet</div><div className="text-2xl font-bold text-white">{formatRupiah(totalIncome)}</div></Card><Card className="border-l-4 border-l-green-500"><div>Total Pengeluaran</div><div className="text-2xl font-bold text-red-400">{formatRupiah(totalExpense)}</div></Card><Card className="border-l-4 border-l-blue-500"><div>Sisa Saldo</div><div className="text-2xl font-bold text-blue-400">{formatRupiah(profit)}</div></Card><Card><div>Skor Kredit</div><div className={`text-3xl font-black ${getScoreColor(userCreditScore)}`}>{userCreditScore}</div></Card></div><div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><Card title="Tren Omzet" className="lg:col-span-2"><div className="mt-4"><SimpleChart data={chartData} /></div></Card><Card title="Aktivitas Terbaru"><div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">{transactions.slice(0,5).map(t=><div key={t.id} className="flex justify-between items-center p-3 bg-slate-950 rounded border border-slate-800"><div><div className="font-bold text-white">{t.category}</div><div className="text-xs text-slate-500 flex gap-2 items-center"><span>{(t.paymentMethod || 'cash').toUpperCase()} {(t.paymentProvider && t.paymentProvider !== '-') ? `(${t.paymentProvider})` : ''}</span>{t.transferStatus && t.transferStatus !== '-' && <span className={`px-1.5 py-0.5 rounded text-[10px] ${t.transferStatus==='Berhasil'?'bg-green-500/20 text-green-400':'bg-yellow-500/20 text-yellow-400'}`}>{t.transferStatus}</span>}</div></div><div className={t.type==='income'?'text-green-400':'text-red-400'}>{formatRupiah(t.amount)}</div></div>)}</div></Card></div></div>}
        
        {activePage === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-right">
             <div className="lg:col-span-2 space-y-6">
                <Card title="Input Transaksi">
                   <form onSubmit={handlePosSubmit} className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                         <label className="cursor-pointer"><input type="radio" name="type" value="income" checked={transactionType === 'income'} onChange={() => setTransactionType('income')} className="peer hidden" /><div className={`p-4 rounded-xl border border-slate-700 text-center text-slate-500 font-bold transition-all ${transactionType === 'income' ? 'bg-green-500/10 border-green-500 text-green-400' : ''}`}>Pemasukan</div></label>
                         <label className="cursor-pointer"><input type="radio" name="type" value="expense" checked={transactionType === 'expense'} onChange={() => setTransactionType('expense')} className="peer hidden" /><div className={`p-4 rounded-xl border border-slate-700 text-center text-slate-500 font-bold transition-all ${transactionType === 'expense' ? 'bg-red-500/10 border-red-500 text-red-400' : ''}`}>Pengeluaran</div></label>
                      </div>

                      {/* CONDITIONAL INPUT: Sembunyikan jika Expense + QRIS */}
                      {!(transactionType === 'expense' && paymentMethod === 'qris') && (
                        <div className="animate-in fade-in slide-in-from-top">
                           <Input name="amount" label="Nominal" type="number" placeholder="0" required />
                           <Input name="category" label="Kategori" placeholder="Contoh: Nasi Goreng" required />
                        </div>
                      )}
                      
                      {/* PAYMENT METHOD SELECTOR */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Metode Pembayaran</label>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                           {[{id: 'cash', icon: Banknote, label: 'Tunai'}, {id: 'qris', icon: QrCode, label: 'LPay'}, {id: 'transfer', icon: Landmark, label: 'Bank'}, {id: 'ewallet', icon: Smartphone, label: 'E-Wallet'}].map(m => (
                             <button key={m.id} type="button" onClick={() => { setPaymentMethod(m.id); setPaymentProvider(''); }} className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs gap-1 transition-all ${paymentMethod === m.id ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-950 border-slate-700 text-slate-500 hover:border-slate-500'}`}><m.icon size={18} /> {m.label}</button>
                           ))}
                        </div>
                        {paymentMethod === 'transfer' && <div className="mb-4 animate-in slide-in-from-top fade-in"><label className="block text-xs text-slate-500 mb-1">Pilih Bank</label><select className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white mb-3" onChange={e => setPaymentProvider(e.target.value)} value={paymentProvider}><option value="">-- Pilih Bank --</option>{BANKS.map(b => <option key={b} value={b}>{b}</option>)}</select><Input name="accountNumber" label="No. Rekening Tujuan" placeholder="Contoh: 1234567890" /></div>}
                        {paymentMethod === 'ewallet' && <div className="mb-4 animate-in slide-in-from-top fade-in"><label className="block text-xs text-slate-500 mb-1">Pilih E-Wallet</label><select className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white mb-3" onChange={e => setPaymentProvider(e.target.value)} value={paymentProvider}><option value="">-- Pilih E-Wallet --</option>{EWALLETS.map(e => <option key={e} value={e}>{e}</option>)}</select><Input name="accountNumber" label="No. HP / ID Tujuan" placeholder="Contoh: 08123456789" /></div>}
                      </div>

                      {!(transactionType === 'expense' && paymentMethod === 'qris') && <Input name="note" label="Catatan" placeholder="Opsional" />}
                      <Button type="submit" className="w-full">{(transactionType === 'expense' && paymentMethod === 'qris') ? <><Camera size={18}/> Buka Kamera Scanner</> : (paymentMethod === 'qris' ? 'Generate LPay & Simpan' : 'Simpan Transaksi')}</Button>
                   </form>
                </Card>
             </div>
             <Card title="Riwayat Hari Ini" className="h-full max-h-[600px] flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mt-2 pr-2">
                   {transactions.map(t => (
                      <div key={t.id} className="flex justify-between items-center p-3 rounded border border-slate-800 bg-slate-950/50 group">
                         <div><p className="text-white text-sm font-bold">{t.category}</p><div className="flex items-center gap-2 mt-1"><span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700 uppercase">{t.paymentMethod || 'cash'}</span>{(t.paymentProvider && t.paymentProvider !== '-') && <span className="text-[10px] text-cyan-500">{t.paymentProvider} {t.accountNumber && t.accountNumber !== '-' ? `- ${t.accountNumber}` : ''}</span>}
                         {t.transferStatus && t.transferStatus !== '-' && <span className={`text-[10px] px-1.5 py-0.5 rounded border ${t.transferStatus === 'Berhasil' ? 'bg-green-500/10 text-green-500 border-green-500' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500'}`}>{t.transferStatus}</span>}</div></div>
                         <div className="text-right"><p className={`text-sm font-bold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>{formatRupiah(t.amount)}</p><button onClick={() => deleteTransaction(t.id)} className="text-slate-600 hover:text-red-400 text-xs mt-1"><Trash2 size={14}/></button></div>
                      </div>
                   ))}
                </div>
             </Card>
          </div>
        )}

        {/* --- OTHER PAGES --- */}
        {activePage === 'savings' && <div className="space-y-6 animate-in slide-in-from-bottom"><div className="flex justify-between items-center"><h2 className="text-xl font-bold text-white">Tabungan Target</h2><Button onClick={() => setShowSavingModal(true)}><Plus size={16}/> Baru</Button></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{savings.map(s => { const currentVal = s.current || 0; const percentage = s.target > 0 ? Math.min((currentVal / s.target) * 100, 100) : 0; return (<Card key={s.id} className="relative group hover:border-cyan-500/50 transition-colors"><div className="flex justify-between mb-4"><h3 className="font-bold text-white text-lg">{s.name}</h3><Button variant="secondary" className="py-1 px-3 text-xs border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10" onClick={() => setSelectedSavingForDeposit(s)}>+ Setor</Button></div><div className="mb-2 flex justify-between text-sm font-medium"><span className="text-slate-300">{formatRupiah(currentVal)}</span><span className="text-slate-500 text-xs mt-1">Target: {formatRupiah(s.target)}</span></div><div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden"><div className="bg-gradient-to-r from-cyan-500 to-purple-600 h-3 rounded-full transition-all duration-1000 relative" style={{ width: `${percentage}%` }}></div></div><div className="text-right mt-1 text-[10px] text-cyan-400 font-bold">{Math.round(percentage)}% Tercapai</div></Card>); })}{savings.length === 0 && (<div className="col-span-full py-16 text-center text-slate-500 border-2 border-slate-800 border-dashed rounded-xl flex flex-col items-center"><PiggyBank size={48} className="mb-4 opacity-20" /><p>Belum ada target tabungan.</p><p className="text-xs mt-2">Mulai sisihkan keuntungan untuk masa depan.</p></div>)}</div></div>}
        {activePage === 'finance' && <div className="space-y-6 animate-in fade-in"><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 h-full"><h3 className="text-white font-bold mb-4 flex items-center gap-2"><Wallet className="text-blue-400"/> Pengajuan Modal Usaha</h3><form onSubmit={e=>{e.preventDefault();const fd=new FormData(e.target);applyLoan({amount:parseInt(fd.get('amount')),reason:fd.get('reason')});e.target.reset();}} className="space-y-4"><div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 mb-4"><div className="text-xs text-slate-500 mb-1">Limit Tersedia (Berdasarkan Skor)</div><div className="text-2xl font-bold text-green-400">{formatRupiah(userCreditScore > 700 ? 50000000 : userCreditScore > 500 ? 10000000 : 2000000)}</div></div><Input name="amount" label="Jumlah Pengajuan" type="number" placeholder="0"/><Input name="reason" label="Tujuan Penggunaan" placeholder="Contoh: Beli Etalase Baru"/><Button type="submit" className="w-full py-3 mt-2">Ajukan Sekarang</Button></form></Card>
        {/* LOAN HISTORY FOR USER (NEW) */}
        <Card title="Riwayat Pinjaman Saya" className="h-full flex flex-col"><div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mt-2 pr-2">{loans.filter(l => l.userName === user.username).map(l => (<div key={l.id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex justify-between items-center"><div><div className="text-white font-bold">{formatRupiah(l.amount)}</div><div className="text-xs text-slate-500">{l.reason} • {l.date}</div></div><div className="text-right"><span className={`px-2 py-1 rounded text-[10px] uppercase font-bold block mb-1 ${l.status === 'Approved' || l.status === 'Disbursed' ? 'bg-green-500/20 text-green-400' : l.status === 'Rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{l.status === 'Disbursed' ? 'Dicairkan' : l.status}</span>{l.status === 'Approved' && (<button onClick={() => handleClaimLoan(l)} className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded flex items-center gap-1"><Download size={10}/> Cairkan</button>)}</div></div>))}
        {loans.filter(l => l.userName === user.username).length === 0 && <div className="text-center text-slate-500 text-sm py-4">Belum ada riwayat pinjaman.</div>}</div></Card></div>
        <h3 className="text-lg font-bold text-white mt-8 mb-4 flex items-center gap-2"><TrendingUp className="text-purple-400"/> Marketplace Investasi</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{INVESTMENT_PRODUCTS.map(inv=>(<Card key={inv.id} className="border-purple-500/20 hover:border-purple-500/50 transition-all"><h3 className="font-bold text-white mb-2">{inv.name}</h3><div className="text-sm text-slate-400 mb-4"><p>Return: {inv.returnRate}% /thn</p><p>Min: {formatRupiah(inv.minAmount)}</p></div><Button variant="outline" className="w-full text-sm" onClick={() => setSelectedInvestment(inv)}>Beli Produk Ini</Button></Card>))}</div><h3 className="text-lg font-bold text-white mt-8 mb-4 flex items-center gap-2"><Coins className="text-yellow-400"/> Portofolio Saya</h3>{myInvestments.length === 0 ? (<div className="text-slate-500 text-center py-8 border border-slate-800 rounded-xl border-dashed">Belum ada investasi aktif.</div>) : (<div className="space-y-4">{myInvestments.map(inv => { const profit = inv.amount * (inv.returnRate / 100); return (<div key={inv.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center animate-in slide-in-from-bottom"><div><h4 className="font-bold text-white">{inv.name}</h4><p className="text-xs text-slate-500">Mulai: {formatDate(inv.startDate)} • Modal: {formatRupiah(inv.amount)}</p></div><div className="text-right flex items-center gap-4"><div><p className="text-[10px] text-slate-400 uppercase tracking-wider">Est. Profit</p><p className="text-green-400 font-bold">+{formatRupiah(profit)}</p></div><button onClick={() => handleWithdrawInvestment(inv)} className="bg-slate-800 hover:bg-green-500/20 text-slate-300 hover:text-green-400 px-3 py-2 rounded-lg text-xs font-bold transition-all border border-slate-700 hover:border-green-500/50">Cairkan</button></div></div>); })}</div>)}</div>}
        {activePage === 'education' && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{EDUCATION_CONTENT.map(i=><Card key={i.id} className="group cursor-pointer hover:border-blue-500/50 transition-colors hover:bg-slate-900/80"><a href={i.url} target="_blank" rel="noopener noreferrer" className="block h-full"><div className="aspect-video bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-[1.02] transition-transform relative"><PlayCircle size={48} className="text-blue-500 opacity-80 group-hover:text-blue-400 group-hover:opacity-100 z-10"/><div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-[10px] text-white flex items-center gap-1"><ExternalLink size={10}/> YouTube</div></div><h3 className="text-white font-bold text-lg mb-2 group-hover:text-blue-400 transition-colors">{i.title}</h3><p className="text-slate-400 text-sm line-clamp-3">{i.desc}</p></a></Card>)}</div>}
      </main>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around p-3 z-50">{NAV_ITEMS.map(item => (
        <button key={item.id} onClick={() => setActivePage(item.id)} className={`p-2 rounded-lg ${activePage === item.id ? 'text-cyan-400' : 'text-slate-500'}`}>
          <item.icon className="w-6 h-6" />
        </button>
      ))}</div>
    </div>
  );
};

export default App;