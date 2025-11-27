import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  PiggyBank, 
  TrendingUp, 
  BookOpen, 
  LogOut, 
  Plus, 
  CreditCard, 
  DollarSign,
  PlayCircle,
  CheckCircle,
  XCircle,
  Activity,
  Trash2,
  AlertCircle,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3
} from 'lucide-react';

/**
 * ==================================================================================
 * 1. UTILITIES & SERVICES (The "Brain")
 * ==================================================================================
 */

const generateId = () => Math.random().toString(36).substr(2, 9);

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
};

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

// Initial Data Seeding (Cleaner Structure)
const SEED_DATA = {
  transactions: [
    { id: '1', date: new Date().toISOString().split('T')[0], type: 'income', category: 'Penjualan', amount: 500000, note: 'Penjualan Harian' },
    { id: '2', date: new Date().toISOString().split('T')[0], type: 'expense', category: 'Bahan Baku', amount: 200000, note: 'Beli Tepung' },
  ],
  inventory: [
    { id: '1', name: 'Tepung Terigu (kg)', stock: 50, unit: 'kg' },
    { id: '2', name: 'Minyak Goreng (liter)', stock: 20, unit: 'liter' },
  ],
  savings: [
    { id: '1', name: 'Gerobak Baru', target: 5000000, current: 1500000, deadline: '2023-12-31' }
  ],
  loans: [],
  myInvestments: [],
  // Reference Data (Static)
  investmentProducts: [
    { id: '1', name: 'Reksadana Pasar Uang', returnRate: 5, duration: '1 Tahun', minAmount: 100000, risk: 'Rendah' },
    { id: '2', name: 'Obligasi UMKM', returnRate: 8, duration: '3 Tahun', minAmount: 1000000, risk: 'Sedang' },
    { id: '3', name: 'Saham Blue Chip', returnRate: 12, duration: '5 Tahun', minAmount: 5000000, risk: 'Tinggi' },
  ]
};

/**
 * ==================================================================================
 * 2. UI COMPONENT LIBRARY (Design System)
 * ==================================================================================
 */

// Toast Notification System (Replacing Alert)
const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
    {toasts.map(toast => (
      <div 
        key={toast.id} 
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-md border animate-in slide-in-from-right duration-300 ${
          toast.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' :
          toast.type === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' :
          'bg-slate-800 border-slate-700 text-slate-200'
        }`}
      >
        {toast.type === 'success' ? <CheckCircle size={18} /> : 
         toast.type === 'error' ? <XCircle size={18} /> : <AlertCircle size={18} />}
        <span className="text-sm font-medium">{toast.message}</span>
        <button onClick={() => removeToast(toast.id)} className="ml-4 hover:text-white"><XCircle size={14}/></button>
      </div>
    ))}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, ...props }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  const variants = {
    primary: "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30",
    success: "bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30",
    outline: "border border-slate-600 text-slate-300 hover:border-cyan-400 hover:text-cyan-400 bg-transparent"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Card = ({ children, className = '', title, icon: Icon, action }) => (
  <div className={`bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl ${className}`}>
    {(title || Icon) && (
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="text-cyan-400" size={20} />}
          {title && <h3 className="text-white font-bold text-lg">{title}</h3>}
        </div>
        {action}
      </div>
    )}
    {children}
  </div>
);

const Input = ({ label, type = "text", value, onChange, placeholder, className = "", min }) => (
  <div className={`mb-4 ${className}`}>
    {label && <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors placeholder:text-slate-600"
    />
  </div>
);

// Simple SVG Line Chart Component (No heavy libraries)
const SimpleChart = ({ data, color = "#22d3ee" }) => {
  if (!data || data.length < 2) return <div className="h-32 flex items-center justify-center text-slate-600 text-xs">Belum cukup data grafik</div>;
  
  const height = 100;
  const width = 300;
  const maxVal = Math.max(...data.map(d => d.value)) || 1;
  const minVal = Math.min(...data.map(d => d.value)) || 0;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.value - minVal) / (maxVal - minVal || 1)) * height; // Normalize
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full h-32 relative overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          points={points}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Gradient Area */}
        <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <polygon points={`0,${height} ${points} ${width},${height}`} fill="url(#gradient)" />
      </svg>
    </div>
  );
};

const Logo = ({ size = "text-2xl" }) => (
  <div className={`font-bold flex items-center gap-2 ${size} select-none`}>
    <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg shadow-purple-500/30 transform hover:rotate-12 transition-transform duration-300">
      <span className="text-white font-black text-xl italic font-serif">F</span>
      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse ring-2 ring-slate-900"></div>
    </div>
    <div className="flex flex-col leading-none">
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
        LifeFin
      </span>
      <span className="text-[10px] text-cyan-500 tracking-widest font-normal uppercase">Pro UMKM</span>
    </div>
  </div>
);

/**
 * ==================================================================================
 * 3. FEATURE MODULES
 * ==================================================================================
 */

// --- DASHBOARD MODULE ---
const Dashboard = ({ data }) => {
  const { totalIncome, totalExpense, profit, totalSavings } = useMemo(() => {
    const inc = data.transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const exp = data.transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    return {
      totalIncome: inc,
      totalExpense: exp,
      profit: inc - exp,
      totalSavings: data.savings.reduce((acc, curr) => acc + curr.current, 0)
    };
  }, [data.transactions, data.savings]);

  // Chart Data Preparation
  const chartData = useMemo(() => {
    // Group by date (last 7 entries unique)
    const grouped = {};
    data.transactions.forEach(t => {
      if (!grouped[t.date]) grouped[t.date] = 0;
      if (t.type === 'income') grouped[t.date] += t.amount;
      // if (t.type === 'expense') grouped[t.date] -= t.amount; // Profit chart
    });
    return Object.keys(grouped).sort().slice(-7).map(date => ({ date, value: grouped[date] }));
  }, [data.transactions]);

  // Enhanced Credit Score
  const calculateCreditScore = () => {
    let score = 300; 
    score += Math.min(Math.floor(totalIncome / 100000), 200); // Volume
    score += Math.min(data.savings.length * 50, 150); // Discipline
    if (profit > 0) score += 100; // Profitability
    score += Math.min(data.transactions.length * 2, 100); // Activity consistency
    return Math.min(score, 850);
  };
  const creditScore = calculateCreditScore();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-900 border-l-4 border-l-cyan-500">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-400 text-xs uppercase font-bold">Total Omzet</h3>
            <div className="p-2 bg-cyan-500/10 rounded-lg"><DollarSign className="w-4 h-4 text-cyan-400" /></div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{formatRupiah(totalIncome)}</p>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
             <ArrowUpRight size={12} className="text-cyan-500"/> +5% dari bulan lalu
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-900 border-l-4 border-l-green-500">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-400 text-xs uppercase font-bold">Laba Bersih</h3>
            <div className="p-2 bg-green-500/10 rounded-lg"><TrendingUp className="w-4 h-4 text-green-400" /></div>
          </div>
          <p className={`text-2xl font-bold tracking-tight ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatRupiah(profit)}
          </p>
          <p className="text-xs text-slate-500 mt-2">Cashflow status: {profit >= 0 ? 'Sehat' : 'Defisit'}</p>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-900 border-l-4 border-l-purple-500">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-400 text-xs uppercase font-bold">Total Tabungan</h3>
            <div className="p-2 bg-purple-500/10 rounded-lg"><PiggyBank className="w-4 h-4 text-purple-400" /></div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{formatRupiah(totalSavings)}</p>
          <p className="text-xs text-slate-500 mt-2">{data.savings.length} Target Aktif</p>
        </Card>

        <Card className="relative overflow-hidden border-blue-500/30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="flex justify-between items-start mb-2 relative z-10">
            <h3 className="text-slate-400 text-xs uppercase font-bold">Skor Kredit</h3>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <p className={`text-4xl font-black relative z-10 ${creditScore >= 700 ? "text-blue-400" : "text-yellow-400"}`}>
            {creditScore}
          </p>
          <p className="text-xs text-slate-400 mt-1 relative z-10">
            {creditScore >= 700 ? 'Sangat Baik' : creditScore >= 500 ? 'Cukup Baik' : 'Perlu Tingkatkan'}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <Card title="Tren Omzet Harian" icon={BarChart3} className="lg:col-span-2">
          <div className="mt-4">
             <SimpleChart data={chartData} />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-2 px-2">
             <span>7 Hari Terakhir</span>
             <span>Realtime Update</span>
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card title="Aktivitas Terkini" icon={Wallet}>
          <div className="space-y-4 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
            {data.transactions.slice().reverse().slice(0, 5).map(t => (
              <div key={t.id} className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {t.type === 'income' ? <ArrowDownRight size={14}/> : <ArrowUpRight size={14}/>}
                   </div>
                   <div>
                      <p className="text-white text-sm font-medium">{t.category}</p>
                      <p className="text-[10px] text-slate-500">{formatDate(t.date)}</p>
                   </div>
                </div>
                <span className={`text-sm font-bold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                  {t.type === 'income' ? '+' : '-'} {formatRupiah(t.amount)}
                </span>
              </div>
            ))}
            {data.transactions.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Belum ada transaksi.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};

// --- POS & INVENTORY MODULE ---
const POS = ({ addTransaction, transactions, deleteTransaction, inventory, updateInventory, notify }) => {
  const [activeTab, setActiveTab] = useState('trx'); // 'trx' or 'stock'
  
  // Trx State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState('income');
  
  // Inventory State
  const [itemName, setItemName] = useState('');
  const [itemStock, setItemStock] = useState('');
  const [itemUnit, setItemUnit] = useState('pcs');

  const handleTrxSubmit = (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return notify('Nominal harus lebih dari 0', 'error');
    if (!category) return notify('Kategori wajib diisi', 'error');
    
    addTransaction({
      amount: parseInt(amount),
      category,
      note,
      type,
      date: new Date().toISOString().split('T')[0]
    });
    setAmount('');
    setCategory('');
    setNote('');
    notify('Transaksi berhasil dicatat!', 'success');
  };

  const handleStockSubmit = (e) => {
    e.preventDefault();
    if (!itemName || !itemStock) return notify('Data stok tidak lengkap', 'error');
    updateInventory({
      name: itemName,
      stock: parseInt(itemStock),
      unit: itemUnit
    });
    setItemName('');
    setItemStock('');
    notify('Stok barang berhasil ditambahkan!', 'success');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-right duration-500">
      {/* Input Section */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex gap-2 bg-slate-900 p-1 rounded-lg w-fit border border-slate-800">
           <button onClick={() => setActiveTab('trx')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'trx' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Kasir</button>
           <button onClick={() => setActiveTab('stock')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'stock' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Stok Barang</button>
        </div>

        {activeTab === 'trx' ? (
          <Card title="Input Transaksi Baru" icon={CreditCard}>
            <form onSubmit={handleTrxSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setType('income')}
                  className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${type === 'income' ? 'bg-green-500/10 border-green-500 text-green-400 ring-1 ring-green-500' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                  <ArrowDownRight /> <span className="font-bold">Pemasukan</span>
                </button>
                <button type="button" onClick={() => setType('expense')}
                  className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${type === 'expense' ? 'bg-red-500/10 border-red-500 text-red-400 ring-1 ring-red-500' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                  <ArrowUpRight /> <span className="font-bold">Pengeluaran</span>
                </button>
              </div>
              <Input label="Nominal (Rp)" type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
              <Input label="Kategori" value={category} onChange={e => setCategory(e.target.value)} placeholder={type === 'income' ? 'Cth: Nasi Goreng' : 'Cth: Beli Telur'} />
              <Input label="Catatan (Opsional)" value={note} onChange={e => setNote(e.target.value)} placeholder="Keterangan..." />
              <Button type="submit" className="w-full h-12 text-lg shadow-cyan-500/20">Simpan Transaksi</Button>
            </form>
          </Card>
        ) : (
          <Card title="Update Stok Barang" icon={Package}>
             <form onSubmit={handleStockSubmit} className="space-y-4 mt-4">
               <Input label="Nama Barang" value={itemName} onChange={e => setItemName(e.target.value)} placeholder="Cth: Beras" />
               <div className="grid grid-cols-2 gap-4">
                 <Input label="Jumlah" type="number" value={itemStock} onChange={e => setItemStock(e.target.value)} placeholder="0" />
                 <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Satuan</label>
                    <select value={itemUnit} onChange={e => setItemUnit(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500">
                      <option value="pcs">Pcs</option>
                      <option value="kg">Kg</option>
                      <option value="liter">Liter</option>
                      <option value="box">Box</option>
                    </select>
                 </div>
               </div>
               <Button type="submit" className="w-full h-12">Tambah Stok</Button>
             </form>
          </Card>
        )}
      </div>
      
      {/* List Section */}
      <div className="space-y-6">
        {activeTab === 'trx' ? (
           <Card title="Riwayat Hari Ini" className="h-full max-h-[600px] flex flex-col">
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1 mt-2">
                 {transactions.slice().reverse().map(t => (
                   <div key={t.id} className="group flex justify-between items-center p-3 rounded-lg border border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <div>
                        <p className="text-white font-medium text-sm">{t.category}</p>
                        <p className="text-xs text-slate-500">{formatRupiah(t.amount)} • {t.type === 'income' ? 'Masuk' : 'Keluar'}</p>
                      </div>
                      <button onClick={() => deleteTransaction(t.id)} className="text-slate-600 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={16} />
                      </button>
                   </div>
                 ))}
              </div>
           </Card>
        ) : (
          <Card title="Stok Gudang" className="h-full flex flex-col">
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1 mt-2">
                {inventory.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-800 bg-slate-950/50">
                     <p className="text-white font-medium text-sm">{item.name}</p>
                     <span className="bg-slate-800 px-2 py-1 rounded text-xs text-cyan-400 font-bold">{item.stock} {item.unit}</span>
                  </div>
                ))}
                {inventory.length === 0 && <p className="text-slate-500 text-sm text-center">Gudang kosong.</p>}
             </div>
          </Card>
        )}
      </div>
    </div>
  );
};

// --- SAVINGS MODULE ---
const Savings = ({ savings, addSaving, addDeposit, notify }) => {
  const [showForm, setShowForm] = useState(false);
  const [newTarget, setNewTarget] = useState({ name: '', target: '', deadline: '' });
  const [depositData, setDepositData] = useState({ id: null, amount: '' });

  const handleAddTarget = () => {
    if (!newTarget.name || !newTarget.target) return notify('Lengkapi data target!', 'error');
    addSaving({
      name: newTarget.name,
      target: parseInt(newTarget.target),
      deadline: newTarget.deadline,
      current: 0
    });
    setShowForm(false);
    setNewTarget({ name: '', target: '', deadline: '' });
    notify('Target tabungan baru dibuat!', 'success');
  };

  const handleDeposit = () => {
    if (!depositData.amount || depositData.amount <= 0) return notify('Jumlah setoran tidak valid', 'error');
    addDeposit(depositData.id, parseInt(depositData.amount));
    setDepositData({ id: null, amount: '' });
    notify('Setoran berhasil diterima!', 'success');
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <PiggyBank className="text-purple-400" /> Tabungan Target
        </h2>
        <Button onClick={() => setShowForm(!showForm)} variant="outline">
          <Plus size={16} /> Tambah Target
        </Button>
      </div>

      {showForm && (
        <Card className="border-purple-500/30 bg-purple-900/5 animate-in fade-in">
          <h3 className="text-white font-medium mb-4">Buat Target Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Nama Target" value={newTarget.name} onChange={e => setNewTarget({...newTarget, name: e.target.value})} placeholder="Misal: Renovasi Toko" />
            <Input label="Target Dana (Rp)" type="number" value={newTarget.target} onChange={e => setNewTarget({...newTarget, target: e.target.value})} placeholder="5000000" />
            <Input label="Deadline" type="date" value={newTarget.deadline} onChange={e => setNewTarget({...newTarget, deadline: e.target.value})} />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button onClick={() => setShowForm(false)} variant="secondary">Batal</Button>
            <Button onClick={handleAddTarget}>Simpan Target</Button>
          </div>
        </Card>
      )}

      {/* Deposit Modal Overlay */}
      {depositData.id && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
           <Card className="w-full max-w-sm animate-in zoom-in duration-200 border-purple-500/50 shadow-2xl shadow-purple-900/50">
             <h3 className="text-lg font-bold text-white mb-4">Setor Tabungan</h3>
             <Input 
               label="Nominal Setor (Rp)" 
               type="number" 
               value={depositData.amount} 
               onChange={e => setDepositData({...depositData, amount: e.target.value})} 
               autoFocus
             />
             <div className="flex justify-end gap-2">
               <Button onClick={() => setDepositData({ id: null, amount: '' })} variant="secondary">Batal</Button>
               <Button onClick={handleDeposit} variant="primary" className="bg-purple-600 hover:bg-purple-500">Setor Sekarang</Button>
             </div>
           </Card>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savings.map(s => {
          const percent = Math.min((s.current / s.target) * 100, 100);
          return (
            <Card key={s.id} className="relative group hover:border-purple-500/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-white text-lg">{s.name}</h3>
                  <p className="text-slate-400 text-xs">Deadline: {s.deadline ? formatDate(s.deadline) : 'Tidak ada'}</p>
                </div>
                <Button onClick={() => setDepositData({ id: s.id, amount: '' })} variant="secondary" className="text-xs py-1 px-3 border-purple-500/30 text-purple-300 hover:bg-purple-500/20">
                  + Setor
                </Button>
              </div>
              
              <div className="mb-2 flex justify-between text-sm font-medium">
                <span className="text-slate-300">{formatRupiah(s.current)}</span>
                <span className="text-slate-500 text-xs mt-1">Target: {formatRupiah(s.target)}</span>
              </div>
              
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 h-3 rounded-full transition-all duration-1000 relative" 
                  style={{ width: `${percent}%` }}
                >
                </div>
              </div>
              <div className="text-right mt-1 text-[10px] text-purple-400 font-bold">{Math.round(percent)}% Tercapai</div>
            </Card>
          );
        })}
        {savings.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 border-2 border-slate-800 border-dashed rounded-xl">
            <PiggyBank size={48} className="mx-auto mb-4 opacity-20" />
            <p>Belum ada target tabungan.</p>
            <p className="text-xs mt-2">Mulai sisihkan keuntungan untuk pengembangan usahamu.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- LOANS & INVESTMENTS MODULE ---
const LoansAndInvest = ({ applyLoan, loans, investmentsProducts, buyInvestment, myInvestments, creditScore, notify }) => {
  const [loanAmount, setLoanAmount] = useState('');
  const [loanReason, setLoanReason] = useState('');
  const [activeTab, setActiveTab] = useState('loan'); 

  const handleLoan = (e) => {
    e.preventDefault();
    if (!loanAmount || !loanReason) return notify('Formulir tidak lengkap', 'error');
    applyLoan({ amount: parseInt(loanAmount), reason: loanReason });
    setLoanAmount('');
    setLoanReason('');
    notify('Pengajuan pinjaman terkirim! Admin akan meninjau.', 'success');
  };

  const handleBuyInvest = (inv) => {
    const amount = prompt(`Masukkan jumlah investasi (Min ${formatRupiah(inv.minAmount)}):`, inv.minAmount);
    if (!amount) return;
    if (parseInt(amount) < inv.minAmount) return notify(`Minimal investasi ${formatRupiah(inv.minAmount)}`, 'error');
    
    buyInvestment(inv, parseInt(amount));
    notify(`Berhasil membeli ${inv.name}`, 'success');
  };

  const maxLoan = creditScore > 700 ? 50000000 : creditScore > 500 ? 10000000 : 2000000;

  return (
    <div className="space-y-6">
      <div className="flex gap-6 border-b border-slate-800 pb-1">
        <button onClick={() => setActiveTab('loan')} className={`pb-3 px-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'loan' ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
          Pinjaman Modal
        </button>
        <button onClick={() => setActiveTab('invest')} className={`pb-3 px-2 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'invest' ? 'text-purple-400 border-purple-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
          Investasi Berjangka
        </button>
      </div>

      {activeTab === 'loan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
              <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6">
                 <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                      <CheckCircle className="text-green-400" size={20} /> Status Kelayakan
                    </h3>
                    <p className="text-slate-400 text-sm">Berdasarkan rekam jejak keuangan Anda.</p>
                 </div>
                 <div className="text-right bg-slate-950/50 p-4 rounded-xl border border-slate-700">
                    <div className="text-sm text-slate-400 mb-1">Plafon Tersedia</div>
                    <div className="text-2xl font-bold text-green-400">{formatRupiah(maxLoan)}</div>
                 </div>
              </div>
              
              <form onSubmit={handleLoan} className="space-y-4 pt-4 border-t border-slate-700/50">
                <Input label="Jumlah Pengajuan (Rp)" type="number" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} max={maxLoan} placeholder="0" />
                <Input label="Tujuan Modal" value={loanReason} onChange={e => setLoanReason(e.target.value)} placeholder="Untuk beli alat..." />
                <Button type="submit" variant="primary" className="w-full">Ajukan Modal Sekarang</Button>
              </form>
            </Card>

            <h3 className="text-white font-bold mt-8 text-sm uppercase tracking-wider">Riwayat Pengajuan</h3>
            {loans.length === 0 ? <p className="text-slate-500 italic text-sm">Belum ada riwayat.</p> : (
              <div className="space-y-3">
                {loans.map(l => (
                  <div key={l.id} className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex justify-between items-center hover:bg-slate-800/80 transition-colors">
                    <div>
                      <p className="text-white font-bold">{formatRupiah(l.amount)}</p>
                      <p className="text-xs text-slate-500 mt-1">{l.reason} • {l.date}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                      l.status === 'Approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                      l.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                      'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    }`}>
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-blue-600/5 p-6 rounded-xl border border-blue-500/20 h-fit">
            <h4 className="text-blue-400 font-bold mb-4 flex items-center gap-2"><BookOpen size={16}/> Edukasi Kilat</h4>
            <ul className="text-sm text-slate-300 space-y-4">
              <li className="flex gap-2">
                <span className="text-blue-500 font-bold">1.</span>
                <span>Modal wajib digunakan untuk hal produktif yang menghasilkan laba.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 font-bold">2.</span>
                <span>Pastikan cicilan maksimal 30% dari keuntungan bersih.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500 font-bold">3.</span>
                <span>Bayar tepat waktu untuk meningkatkan Plafon di masa depan.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'invest' && (
        <div className="space-y-8 animate-in fade-in">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {investmentsProducts.map(inv => (
               <Card key={inv.id} className="border-purple-500/20 hover:border-purple-500/50 transition-colors group flex flex-col justify-between">
                 <div>
                   <div className="flex justify-between mb-4">
                     <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${inv.risk === 'Rendah' ? 'bg-green-500/20 text-green-400' : inv.risk === 'Sedang' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{inv.risk} Risk</span>
                     <TrendingUp className="text-purple-400" size={18} />
                   </div>
                   <h3 className="font-bold text-white text-lg mb-4">{inv.name}</h3>
                   <div className="space-y-2 text-sm mb-6">
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-slate-500">Return</span>
                        <span className="text-green-400 font-bold">{inv.returnRate}% /thn</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-slate-500">Durasi</span>
                        <span className="text-slate-200">{inv.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Min. Dana</span>
                        <span className="text-slate-200">{formatRupiah(inv.minAmount)}</span>
                      </div>
                   </div>
                 </div>
                 <Button onClick={() => handleBuyInvest(inv)} variant="outline" className="w-full text-sm group-hover:bg-purple-500/10 group-hover:border-purple-500/50 group-hover:text-purple-300">
                   Mulai Investasi
                 </Button>
               </Card>
             ))}
           </div>

           <div className="pt-4 border-t border-slate-800">
             <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Portofolio Saya</h3>
             {myInvestments.length === 0 ? <p className="text-slate-500 text-sm">Anda belum memiliki investasi aktif.</p> : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {myInvestments.map(m => (
                   <div key={m.id} className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex justify-between items-center relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
                      <div>
                        <p className="text-white font-bold">{m.name}</p>
                        <p className="text-xs text-slate-500 mt-1">Start: {m.startDate}</p>
                      </div>
                      <div className="text-right z-10">
                        <p className="text-white font-bold">{formatRupiah(m.amount)}</p>
                        <p className="text-xs text-green-400 bg-green-900/20 px-1 rounded inline-block mt-1">
                          Est. Profit: +{formatRupiah(m.amount * (m.returnRate/100))}
                        </p>
                      </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
        </div>
      )}
    </div>
  );
};

// --- ADMIN PANEL ---
const AdminPanel = ({ allLoans, handleLoanAction }) => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
         <Card className="bg-slate-800 border-l-4 border-l-yellow-500">
            <h3 className="text-slate-400 text-xs font-bold uppercase">Menunggu Persetujuan</h3>
            <p className="text-3xl font-bold text-yellow-400 mt-2">{allLoans.filter(l => l.status === 'Pending').length}</p>
         </Card>
      </div>

      <Card title="Antrian Pengajuan Pinjaman">
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 text-slate-200 uppercase font-bold text-xs">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">User</th>
                <th className="px-4 py-3">Jumlah</th>
                <th className="px-4 py-3">Tujuan</th>
                <th className="px-4 py-3 text-center">Skor Kredit</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right rounded-tr-lg">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {allLoans.map(loan => (
                <tr key={loan.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-4 font-medium text-white">{loan.userName}</td>
                  <td className="px-4 py-4 font-mono text-slate-200">{formatRupiah(loan.amount)}</td>
                  <td className="px-4 py-4 max-w-xs truncate" title={loan.reason}>{loan.reason}</td>
                  <td className="px-4 py-4 text-center"><span className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded font-bold">{loan.userScore}</span></td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      loan.status === 'Approved' ? 'bg-green-500/20 text-green-400' :
                      loan.status === 'Rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>{loan.status}</span>
                  </td>
                  <td className="px-4 py-4 flex justify-end gap-2">
                    {loan.status === 'Pending' && (
                      <>
                        <button onClick={() => handleLoanAction(loan.id, 'Approved')} className="bg-green-600 hover:bg-green-500 text-white p-1.5 rounded-md transition-colors" title="Setujui"><CheckCircle size={16}/></button>
                        <button onClick={() => handleLoanAction(loan.id, 'Rejected')} className="bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-md transition-colors" title="Tolak"><XCircle size={16}/></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {allLoans.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-500 italic">Tidak ada pengajuan masuk.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

/**
 * ==================================================================================
 * 4. MAIN APP CONTROLLER
 * ==================================================================================
 */

const AuthPage = ({ onLogin, notify }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) return notify('Mohon isi semua kolom', 'error');
    onLogin({ username, role });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 rounded-full blur-[120px]"></div>
      </div>
      
      <div className="w-full max-w-md z-10 animate-in zoom-in duration-500">
        <div className="mb-8 flex justify-center scale-125">
          <Logo />
        </div>
        
        <Card className="border-t-4 border-t-cyan-500 bg-slate-900/80 backdrop-blur-xl">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">
            {isRegister ? 'Mulai Bisnis Anda' : 'Login LifeFin'}
          </h2>
          <p className="text-slate-400 text-center mb-6 text-sm">
            Platform manajemen keuangan terpadu untuk akselerasi UMKM.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
            
            {!isRegister && (
              <div className="flex gap-4 mb-4 p-3 bg-slate-950 rounded-lg border border-slate-800">
                 <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-900 transition-colors">
                   <input type="radio" name="role" checked={role === 'user'} onChange={() => setRole('user')} className="accent-cyan-500"/>
                   <span className="text-slate-300 text-sm font-medium">UMKM</span>
                 </label>
                 <div className="w-px bg-slate-800 h-6"></div>
                 <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-900 transition-colors">
                   <input type="radio" name="role" checked={role === 'admin'} onChange={() => setRole('admin')} className="accent-purple-500"/>
                   <span className="text-slate-300 text-sm font-medium">Admin</span>
                 </label>
              </div>
            )}

            <Button type="submit" className="w-full py-3 text-lg shadow-xl shadow-cyan-900/20">
              {isRegister ? 'Daftar Sekarang' : 'Masuk Dashboard'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'} 
            <button onClick={() => setIsRegister(!isRegister)} className="text-cyan-400 font-bold ml-1 hover:text-cyan-300 transition-colors underline decoration-dotted">
              {isRegister ? 'Login' : 'Daftar Gratis'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  
  // App Data State
  const [transactions, setTransactions] = useState(SEED_DATA.transactions);
  const [inventory, setInventory] = useState(SEED_DATA.inventory);
  const [savings, setSavings] = useState(SEED_DATA.savings);
  const [loans, setLoans] = useState(SEED_DATA.loans);
  const [myInvestments, setMyInvestments] = useState(SEED_DATA.myInvestments);

  // Persistence Hook
  useEffect(() => {
    const saved = localStorage.getItem('lifefin_pro_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTransactions(parsed.transactions || []);
        setInventory(parsed.inventory || []);
        setSavings(parsed.savings || []);
        setLoans(parsed.loans || []);
        setMyInvestments(parsed.myInvestments || []);
      } catch (e) {
        console.error("Data corrupted, resetting to seed.");
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('lifefin_pro_data', JSON.stringify({ transactions, inventory, savings, loans, myInvestments }));
    }
  }, [transactions, inventory, savings, loans, myInvestments, user]);

  // Toast System
  const notify = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const handleLogout = () => {
    setUser(null);
    setActivePage('dashboard');
    notify('Anda telah keluar', 'info');
  };

  // Logic Controllers
  const addTransaction = (trx) => setTransactions(prev => [...prev, { id: generateId(), ...trx }]);
  const deleteTransaction = (id) => {
    if(window.confirm('Hapus transaksi ini?')) {
        setTransactions(prev => prev.filter(t => t.id !== id));
        notify('Transaksi dihapus', 'info');
    }
  };
  
  const updateInventory = (item) => setInventory(prev => [...prev, { id: generateId(), ...item }]);

  const addSaving = (sv) => setSavings(prev => [...prev, { id: generateId(), ...sv }]);
  const addDeposit = (id, amount) => {
    setSavings(prev => prev.map(s => s.id === id ? { ...s, current: s.current + amount } : s));
    // Optional: Auto-record as expense (transfer out)
    addTransaction({
        id: generateId(),
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        category: 'Tabungan',
        amount: amount,
        note: 'Auto-debit ke Tabungan Target'
    });
  };

  const applyLoan = ({ amount, reason }) => {
    const newLoan = {
      id: generateId(),
      amount,
      reason,
      status: 'Pending',
      date: new Date().toLocaleDateString('id-ID'),
      userName: user.username,
      userScore: 780 // In real app, calculate actual score
    };
    setLoans(prev => [...prev, newLoan]);
  };

  const buyInvestment = (inv, amount) => {
    setMyInvestments(prev => [...prev, {
      id: generateId(),
      name: inv.name,
      amount,
      returnRate: inv.returnRate,
      startDate: new Date().toLocaleDateString('id-ID')
    }]);
    // Auto-debit balance
    addTransaction({
        id: generateId(),
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        category: 'Investasi',
        amount: amount,
        note: `Beli ${inv.name}`
    });
  };

  const handleLoanAction = (id, status) => {
    setLoans(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    notify(`Status pinjaman diubah menjadi ${status}`, status === 'Approved' ? 'success' : 'info');
  };

  // Render Logic
  if (!user) return <><ToastContainer toasts={toasts} removeToast={removeToast} /><AuthPage onLogin={(u) => { setUser(u); notify(`Selamat datang, ${u.username}!`, 'success'); }} notify={notify} /></>;

  if (user.role === 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
           <Logo />
           <div className="flex items-center gap-4">
             <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-bold border border-purple-500/50">SUPER ADMIN</span>
             <button onClick={handleLogout} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors"><LogOut size={20} /></button>
           </div>
        </nav>
        <main className="p-6 max-w-6xl mx-auto">
          <AdminPanel allLoans={loans} handleLoanAction={handleLoanAction} />
        </main>
      </div>
    );
  }

  const NavItem = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActivePage(id)}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
        activePage === id 
          ? 'bg-gradient-to-r from-cyan-600/10 to-blue-600/10 text-cyan-400 font-bold shadow-inner' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {activePage === id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400"></div>}
      <Icon className={`w-5 h-5 ${activePage === id ? 'text-cyan-400' : 'text-slate-500 group-hover:text-white'}`} />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30 flex">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Sidebar Desktop */}
      <aside className="w-20 lg:w-64 bg-slate-900 border-r border-slate-800 fixed h-full z-20 hidden md:flex flex-col transition-all shadow-2xl">
        <div className="p-6 flex justify-center lg:justify-start h-20 items-center">
          <div className="lg:hidden"><Logo size="text-xl" /></div>
          <div className="hidden lg:block"><Logo /></div>
        </div>
        
        <nav className="flex-1 px-3 space-y-1.5 mt-4">
            <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem id="pos" icon={CreditCard} label="Transaksi & Stok" />
            <NavItem id="savings" icon={PiggyBank} label="Tabungan" />
            <NavItem id="finance" icon={Wallet} label="Modal & Invest" />
            <NavItem id="education" icon={BookOpen} label="Pusat Edukasi" />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-950 rounded-xl p-3 mb-3 hidden lg:flex items-center gap-3 border border-slate-800">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg">
              {user.username[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm text-white font-bold truncate">{user.username}</p>
              <p className="text-[10px] text-cyan-500 uppercase tracking-wider font-bold">UMKM Pro</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center lg:justify-start gap-3 text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors">
            <LogOut size={20} />
            <span className="hidden lg:inline font-medium">Keluar Aplikasi</span>
          </button>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex justify-around p-3 z-50 safe-area-bottom">
        {[
          { id: 'dashboard', icon: LayoutDashboard },
          { id: 'pos', icon: CreditCard },
          { id: 'savings', icon: PiggyBank },
          { id: 'finance', icon: Wallet },
          { id: 'education', icon: BookOpen },
        ].map(item => (
          <button key={item.id} onClick={() => setActivePage(item.id)} className={`p-2 rounded-xl transition-all ${activePage === item.id ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-500'}`}>
            <item.icon size={22} />
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-20 lg:ml-64 p-4 lg:p-8 mb-20 md:mb-0 max-w-7xl mx-auto w-full">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-6 sticky top-0 bg-slate-950/80 backdrop-blur z-40 py-2">
          <Logo size="text-lg" />
          <button onClick={handleLogout} className="text-slate-400"><LogOut size={20}/></button>
        </div>

        {/* Desktop Header */}
        <header className="mb-8 hidden md:block">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1 capitalize tracking-tight">
                {activePage === 'pos' ? 'Kasir & Inventaris' : 
                 activePage === 'finance' ? 'Layanan Modal' : 
                 activePage === 'dashboard' ? 'Ringkasan Bisnis' : activePage}
              </h1>
              <p className="text-slate-400 text-sm">Update terakhir: {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            {activePage === 'dashboard' && <Button onClick={() => setActivePage('pos')} className="shadow-cyan-500/20"><Plus size={18}/> Input Transaksi</Button>}
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="min-h-[80vh]">
          {activePage === 'dashboard' && <Dashboard data={{transactions, savings}} />}
          {activePage === 'pos' && <POS addTransaction={addTransaction} transactions={transactions} deleteTransaction={deleteTransaction} inventory={inventory} updateInventory={updateInventory} notify={notify} />}
          {activePage === 'savings' && <Savings savings={savings} addSaving={addSaving} addDeposit={addDeposit} notify={notify} />}
          {activePage === 'finance' && <LoansAndInvest applyLoan={applyLoan} loans={loans} investmentsProducts={SEED_DATA.investmentProducts} buyInvestment={buyInvestment} myInvestments={myInvestments} creditScore={780} notify={notify} />}
          {activePage === 'education' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in">
                <Card className="bg-gradient-to-br from-red-900/20 to-slate-900 border-red-500/20 group cursor-pointer hover:border-red-500/50 transition-colors">
                   <div className="aspect-video bg-red-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-[1.02] transition-transform">
                      <PlayCircle size={48} className="text-red-500 opacity-80" />
                   </div>
                   <h3 className="text-white font-bold text-lg">Manajemen Keuangan Dasar</h3>
                   <p className="text-slate-500 text-sm mt-1">Video • 12 Menit</p>
                </Card>
                <Card className="bg-gradient-to-br from-blue-900/20 to-slate-900 border-blue-500/20 group cursor-pointer hover:border-blue-500/50 transition-colors">
                   <div className="aspect-video bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-[1.02] transition-transform">
                      <PlayCircle size={48} className="text-blue-500 opacity-80" />
                   </div>
                   <h3 className="text-white font-bold text-lg">Strategi Pemasaran Digital</h3>
                   <p className="text-slate-500 text-sm mt-1">Video • 18 Menit</p>
                </Card>
             </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;