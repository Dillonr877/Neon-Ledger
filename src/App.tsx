import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  ReceiptText, 
  PieChart, 
  Target, 
  Settings as SettingsIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Lock,
  Unlock
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { 
  PieChart as RePieChart, Pie, Cell, ResponsiveContainer, 
  LineChart, Line, XAxis, YAxis, Tooltip, 
  BarChart, Bar, Legend 
} from 'recharts';
import { useNeonState } from './useNeonState';
import { Category, CATEGORIES, CATEGORY_COLORS, Transaction } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const NeonButton = ({ children, onClick, className, variant = 'cyan' }: any) => {
  const colors: any = {
    cyan: 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 shadow-[0_0_10px_rgba(0,245,255,0.2)]',
    pink: 'border-neon-pink text-neon-pink hover:bg-neon-pink/10 shadow-[0_0_10px_rgba(255,45,120,0.2)]',
    violet: 'border-neon-violet text-neon-violet hover:bg-neon-violet/10 shadow-[0_0_10px_rgba(157,0,255,0.2)]',
  };

  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-4 py-2 border rounded-lg font-display text-sm uppercase tracking-widest transition-all active:scale-95",
        colors[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, colorClass }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-panel p-6 flex flex-col gap-2 relative overflow-hidden group"
  >
    <div className={cn("absolute top-0 left-0 w-1 h-full", colorClass)} />
    <div className="flex justify-between items-start">
      <span className="text-xs font-mono opacity-50 uppercase tracking-tighter">{title}</span>
      <Icon className={cn("w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity", colorClass.replace('bg-', 'text-'))} />
    </div>
    <div className="text-3xl font-display font-bold tracking-tight">
      <CountUp value={value} />
    </div>
    {trend !== undefined && (
      <div className={cn("text-xs font-mono flex items-center gap-1", trend >= 0 ? "text-emerald-400" : "text-neon-pink")}>
        {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(trend)}% vs last month
      </div>
    )}
  </motion.div>
);

const CountUp = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(start + (end - start) * progress);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
};

// --- Main Views ---

const Dashboard = ({ state, currentMonth, transactions, addTransaction }: any) => {
  const totalIncome = transactions.filter((t: any) => t.type === 'income').reduce((acc: number, t: any) => acc + t.amount, 0);
  const totalExpense = transactions.filter((t: any) => t.type === 'expense').reduce((acc: number, t: any) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Credits" value={totalIncome} icon={TrendingUp} colorClass="bg-neon-cyan" />
        <StatCard title="Total Debits" value={totalExpense} icon={TrendingDown} colorClass="bg-neon-pink" />
        <StatCard title="System Balance" value={balance} icon={Wallet} colorClass="bg-neon-violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 flex flex-col gap-4">
          <h3 className="text-lg neon-text-cyan">Resource Allocation</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={CATEGORIES.map(cat => ({
                    name: cat,
                    value: transactions.filter((t: any) => t.category === cat && t.type === 'expense').reduce((acc: number, t: any) => acc + t.amount, 0)
                  })).filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {CATEGORIES.map((cat) => (
                    <Cell key={cat} fill={CATEGORY_COLORS[cat]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a141e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => {
              const amount = transactions.filter((t: any) => t.category === cat && t.type === 'expense').reduce((acc: number, t: any) => acc + t.amount, 0);
              if (amount === 0) return null;
              return (
                <div key={cat} className="flex items-center gap-2 text-xs font-mono">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                  <span className="opacity-70">{cat}:</span>
                  <span>{amount.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-4">
          <h3 className="text-lg neon-text-pink">Efficiency Index</h3>
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-white/5"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={502.4}
                  initial={{ strokeDashoffset: 502.4 }}
                  animate={{ strokeDashoffset: 502.4 - (502.4 * Math.max(0, Math.min(100, savingsRate))) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={cn(
                    savingsRate > 50 ? "text-emerald-400" : savingsRate > 20 ? "text-neon-amber" : "text-neon-pink"
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-display font-bold">{savingsRate}%</span>
                <span className="text-[10px] font-mono opacity-50 uppercase">Savings Rate</span>
              </div>
            </div>
            <p className="text-center text-sm opacity-70 italic">
              {savingsRate > 50 ? "SYSTEM OPTIMIZED: High efficiency detected." : 
               savingsRate > 0 ? "STABLE: Resource retention within normal parameters." : 
               "CRITICAL: Resource depletion exceeding intake."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Transactions = ({ transactions, deleteTransaction, addTransaction, settings }: any) => {
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<any>({ type: 'all', category: 'all' });

  const filtered = transactions.filter((t: any) => {
    if (filter.type !== 'all' && t.type !== filter.type) return false;
    if (filter.category !== 'all' && t.category !== filter.category) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl neon-text-cyan">Data Stream</h2>
        <NeonButton onClick={() => setIsAdding(true)}>
          <Plus className="w-4 h-4 mr-2" /> Initialize Entry
        </NeonButton>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <select 
          className="bg-[#0a141e] border border-white/10 rounded px-3 py-1 text-xs font-mono outline-none focus:border-neon-cyan text-white"
          value={filter.type}
          onChange={e => setFilter({ ...filter, type: e.target.value })}
        >
          <option value="all">All Types</option>
          <option value="income">Credits</option>
          <option value="expense">Debits</option>
        </select>
        <select 
          className="bg-[#0a141e] border border-white/10 rounded px-3 py-1 text-xs font-mono outline-none focus:border-neon-cyan text-white"
          value={filter.category}
          onChange={e => setFilter({ ...filter, category: e.target.value })}
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-panel p-12 text-center opacity-50 font-mono text-sm"
            >
              &gt; NO TRANSACTIONS DETECTED — SYSTEM IDLE
            </motion.div>
          ) : (
            filtered.map((t: any) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="glass-panel p-4 flex items-center justify-between group hover:neon-border-cyan transition-all"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5"
                    style={{ color: CATEGORY_COLORS[t.category as Category] }}
                  >
                    {t.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-display text-sm">{t.note || t.category}</span>
                    <span className="text-[10px] font-mono opacity-50 uppercase">{format(parseISO(t.date), 'dd MMM yyyy')} | {t.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "font-display font-bold",
                    t.type === 'income' ? "text-emerald-400" : "text-neon-pink"
                  )}>
                    {t.type === 'income' ? '+' : '-'}{settings.currency} {t.amount.toLocaleString()}
                  </span>
                  <button 
                    onClick={() => deleteTransaction(t.id)}
                    className="opacity-0 group-hover:opacity-100 text-neon-pink hover:bg-neon-pink/10 p-2 rounded transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {isAdding && (
        <TransactionModal 
          onClose={() => setIsAdding(false)} 
          onAdd={addTransaction} 
          currency={settings.currency}
        />
      )}
    </div>
  );
};

const TransactionModal = ({ onClose, onAdd, currency }: any) => {
  const [form, setForm] = useState({
    amount: '',
    type: 'expense',
    category: 'Food',
    note: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount) return;
    onAdd({
      ...form,
      amount: parseFloat(form.amount),
      date: new Date(form.date).toISOString()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-panel w-full max-w-md p-6 flex flex-col gap-6 border-neon-cyan/50"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-xl neon-text-cyan">New Entry</h3>
          <button onClick={onClose} className="opacity-50 hover:opacity-100"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => setForm({ ...form, type: 'expense' })}
              className={cn(
                "flex-1 py-2 rounded font-display text-xs border transition-all",
                form.type === 'expense' ? "bg-neon-pink/20 border-neon-pink text-neon-pink" : "border-white/10 opacity-50"
              )}
            >
              DEBIT
            </button>
            <button 
              type="button"
              onClick={() => setForm({ ...form, type: 'income' })}
              className={cn(
                "flex-1 py-2 rounded font-display text-xs border transition-all",
                form.type === 'income' ? "bg-emerald-400/20 border-emerald-400 text-emerald-400" : "border-white/10 opacity-50"
              )}
            >
              CREDIT
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono opacity-50 uppercase">Amount ({currency})</label>
            <input 
              autoFocus
              type="number" 
              step="0.01"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              className="bg-white/5 border border-white/10 rounded p-3 font-display text-2xl outline-none focus:border-neon-cyan"
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono opacity-50 uppercase">Category</label>
              <select 
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="bg-[#0a141e] border border-white/10 rounded p-2 text-sm outline-none focus:border-neon-cyan text-white"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono opacity-50 uppercase">Date</label>
              <input 
                type="date" 
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="bg-white/5 border border-white/10 rounded p-2 text-sm outline-none focus:border-neon-cyan"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono opacity-50 uppercase">Note (Optional)</label>
            <input 
              type="text" 
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
              className="bg-white/5 border border-white/10 rounded p-2 text-sm outline-none focus:border-neon-cyan"
              placeholder="System log details..."
            />
          </div>

          <NeonButton type="submit" className="mt-4 w-full">
            Confirm Transaction
          </NeonButton>
        </form>
      </motion.div>
    </div>
  );
};

const BudgetPlanner = ({ budgets, transactions, updateBudget, toggleBudgetLock, settings }: any) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl neon-text-cyan">Quota Management</h2>
        <div className="text-[10px] font-mono opacity-50 flex items-center gap-2">
          <Lock className="w-3 h-3" /> = UNIVERSAL | <Unlock className="w-3 h-3" /> = MONTHLY
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map((b: any) => {
          const spent = transactions
            .filter((t: any) => t.category === b.category && t.type === 'expense')
            .reduce((acc: number, t: any) => acc + t.amount, 0);
          const percent = b.limit > 0 ? Math.min(100, (spent / b.limit) * 100) : 0;
          const isWarning = percent >= 80 && percent < 100;
          const isExceeded = percent >= 100;

          return (
            <div key={b.category} className="glass-panel p-5 flex flex-col gap-3 relative group">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleBudgetLock(b.category)}
                    className={cn(
                      "p-1.5 rounded border transition-all",
                      b.isUniversal ? "border-neon-cyan/50 text-neon-cyan bg-neon-cyan/10" : "border-white/10 text-white/30 hover:text-white/60"
                    )}
                    title={b.isUniversal ? "Universal Limit (Locked)" : "Month-specific Limit (Unlocked)"}
                  >
                    {b.isUniversal ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                  <span className="font-display text-sm">{b.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono opacity-50">{settings.currency}</span>
                  <input 
                    type="number"
                    value={b.limit || ''}
                    onChange={e => updateBudget(b.category, parseFloat(e.target.value) || 0)}
                    className={cn(
                      "bg-white/5 border border-white/10 rounded px-2 py-1 w-24 text-right font-mono text-sm outline-none focus:border-neon-cyan",
                      b.isUniversal && "border-neon-cyan/30 text-neon-cyan"
                    )}
                    placeholder="Limit"
                  />
                </div>
              </div>

              <div className="h-2 bg-white/5 rounded-full overflow-hidden relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  className={cn(
                    "h-full transition-colors",
                    isExceeded ? "bg-neon-pink shadow-[0_0_10px_#ff2d78]" : 
                    isWarning ? "bg-neon-amber shadow-[0_0_10px_#ffb800]" : 
                    "bg-neon-cyan shadow-[0_0_10px_#00f5ff]"
                  )}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono uppercase">
                <span className={cn(isExceeded ? "text-neon-pink" : isWarning ? "text-neon-amber" : "opacity-50")}>
                  {spent.toLocaleString()} / {b.limit.toLocaleString()} Spent
                </span>
                <span className={cn(isExceeded ? "text-neon-pink" : isWarning ? "text-neon-amber" : "opacity-50")}>
                  {Math.round(percent)}%
                </span>
              </div>
              
              {isExceeded && (
                <div className="flex items-center gap-2 text-neon-pink text-[10px] font-mono animate-pulse">
                  <AlertTriangle className="w-3 h-3" /> QUOTA EXCEEDED
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Goals = ({ goals, addGoal, updateGoal, settings }: any) => {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl neon-text-cyan">Mission Objectives</h2>
        <NeonButton onClick={() => setIsAdding(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Mission
        </NeonButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((g: any) => {
          const percent = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
          const isComplete = percent >= 100;
          const remaining = g.targetAmount - g.currentAmount;
          const monthsToGoal = g.monthlyAllocation > 0 ? Math.ceil(remaining / g.monthlyAllocation) : Infinity;

          return (
            <div key={g.id} className="glass-panel p-6 flex flex-col gap-4 relative overflow-hidden">
              {isComplete && <div className="absolute top-0 right-0 p-2 text-emerald-400"><CheckCircle2 className="w-6 h-6" /></div>}
              
              <div className="flex flex-col">
                <h3 className="text-lg">{g.name}</h3>
                <span className="text-[10px] font-mono opacity-50 uppercase">Target: {settings.currency} {g.targetAmount.toLocaleString()}</span>
              </div>

              <div className="flex flex-col gap-2">
                <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    className="h-full bg-gradient-to-r from-neon-cyan to-neon-violet"
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono uppercase">
                  <span>{g.currentAmount.toLocaleString()} Saved</span>
                  <span>{Math.round(percent)}%</span>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono opacity-50 uppercase">ETA</span>
                  <span className="text-sm font-display">
                    {isComplete ? "COMPLETED" : monthsToGoal === Infinity ? "UNDEFINED" : `${monthsToGoal} MONTHS`}
                  </span>
                </div>
                {!isComplete && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateGoal(g.id, 50)}
                      className="px-3 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-mono hover:bg-neon-cyan/20 transition-all"
                    >
                      +50
                    </button>
                    <button 
                      onClick={() => updateGoal(g.id, 100)}
                      className="px-3 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-mono hover:bg-neon-cyan/20 transition-all"
                    >
                      +100
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isAdding && (
        <GoalModal 
          onClose={() => setIsAdding(false)} 
          onAdd={addGoal} 
          currency={settings.currency}
        />
      )}
    </div>
  );
};

const GoalModal = ({ onClose, onAdd, currency }: any) => {
  const [form, setForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '0',
    monthlyAllocation: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.targetAmount) return;
    onAdd({
      ...form,
      targetAmount: parseFloat(form.targetAmount),
      currentAmount: parseFloat(form.currentAmount),
      monthlyAllocation: parseFloat(form.monthlyAllocation) || 0
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-panel w-full max-w-md p-6 flex flex-col gap-6 border-neon-violet/50"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-xl neon-text-violet">New Mission</h3>
          <button onClick={onClose} className="opacity-50 hover:opacity-100"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono opacity-50 uppercase">Objective Name</label>
            <input 
              autoFocus
              type="text" 
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="bg-white/5 border border-white/10 rounded p-3 font-display text-lg outline-none focus:border-neon-violet"
              placeholder="e.g. NEW GPU"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono opacity-50 uppercase">Target ({currency})</label>
              <input 
                type="number" 
                value={form.targetAmount}
                onChange={e => setForm({ ...form, targetAmount: e.target.value })}
                className="bg-white/5 border border-white/10 rounded p-2 text-sm outline-none focus:border-neon-violet"
                placeholder="800"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono opacity-50 uppercase">Initial ({currency})</label>
              <input 
                type="number" 
                value={form.currentAmount}
                onChange={e => setForm({ ...form, currentAmount: e.target.value })}
                className="bg-white/5 border border-white/10 rounded p-2 text-sm outline-none focus:border-neon-violet"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono opacity-50 uppercase">Monthly Allocation ({currency})</label>
            <input 
              type="number" 
              value={form.monthlyAllocation}
              onChange={e => setForm({ ...form, monthlyAllocation: e.target.value })}
              className="bg-white/5 border border-white/10 rounded p-2 text-sm outline-none focus:border-neon-violet"
              placeholder="50"
            />
          </div>

          <NeonButton type="submit" variant="violet" className="mt-4 w-full">
            Initiate Objective
          </NeonButton>
        </form>
      </motion.div>
    </div>
  );
};

const Settings = ({ settings, updateSettings, state }: any) => {
  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "neon_ledger_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl neon-text-cyan">System Configuration</h2>
      
      <div className="glass-panel p-6 flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-display text-sm">Currency Unit</span>
            <span className="text-[10px] font-mono opacity-50 uppercase">Primary financial denominator</span>
          </div>
          <select 
            value={settings.currency}
            onChange={e => updateSettings({ currency: e.target.value })}
            className="bg-[#0a141e] border border-white/10 rounded px-3 py-1 outline-none focus:border-neon-cyan text-white"
          >
            <option value="AUD">AUD</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
          </select>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-display text-sm">Audio Feedback</span>
            <span className="text-[10px] font-mono opacity-50 uppercase">Holographic interface tones</span>
          </div>
          <button 
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className={cn(
              "w-12 h-6 rounded-full relative transition-colors",
              settings.soundEnabled ? "bg-neon-cyan" : "bg-white/10"
            )}
          >
            <motion.div 
              animate={{ x: settings.soundEnabled ? 24 : 4 }}
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
            />
          </button>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-display text-sm">Visual FX</span>
            <span className="text-[10px] font-mono opacity-50 uppercase">Scanlines and CRT flicker</span>
          </div>
          <button 
            onClick={() => updateSettings({ fxEnabled: !settings.fxEnabled })}
            className={cn(
              "w-12 h-6 rounded-full relative transition-colors",
              settings.fxEnabled ? "bg-neon-cyan" : "bg-white/10"
            )}
          >
            <motion.div 
              animate={{ x: settings.fxEnabled ? 24 : 4 }}
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
            />
          </button>
        </div>

        <div className="pt-4 border-t border-white/10 flex flex-col gap-4">
          <h4 className="text-xs font-mono opacity-50 uppercase">Data Operations</h4>
          <div className="flex gap-4">
            <button 
              onClick={exportData}
              className="flex-1 py-2 border border-white/10 rounded font-display text-xs hover:bg-white/5 transition-all"
            >
              EXPORT BACKUP
            </button>
            <button 
              onClick={() => {
                if (window.confirm("CRITICAL: Wipe all system data?")) {
                  localStorage.removeItem('neon_ledger_data');
                  window.location.reload();
                }
              }}
              className="flex-1 py-2 border border-neon-pink/30 text-neon-pink rounded font-display text-xs hover:bg-neon-pink/10 transition-all"
            >
              FACTORY RESET
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Comparison = ({ allTransactions, currentMonth, settings }: any) => {
  const prevMonth = subMonths(currentMonth, 1);
  
  const getStats = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const ts = allTransactions.filter((t: any) => {
      const tDate = parseISO(t.date);
      return isWithinInterval(tDate, { start, end });
    });
    const income = ts.filter((t: any) => t.type === 'income').reduce((acc: number, t: any) => acc + t.amount, 0);
    const expense = ts.filter((t: any) => t.type === 'expense').reduce((acc: number, t: any) => acc + t.amount, 0);
    const categories = CATEGORIES.reduce((acc: any, cat) => {
      acc[cat] = ts.filter((t: any) => t.category === cat && t.type === 'expense').reduce((sum: number, t: any) => sum + t.amount, 0);
      return acc;
    }, {} as any);
    return { income, expense, categories, savings: income - expense };
  };

  const currentStats = getStats(currentMonth);
  const prevStats = getStats(prevMonth);

  const getDelta = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const chartData = CATEGORIES.map(cat => ({
    name: cat,
    current: currentStats.categories[cat],
    previous: prevStats.categories[cat]
  })).filter(d => d.current > 0 || d.previous > 0);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl neon-text-cyan">Delta Analysis</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 flex flex-col gap-4">
          <h3 className="text-sm font-mono opacity-50 uppercase">Comparative Metrics</h3>
          <div className="flex flex-col gap-4">
            {[
              { label: 'Total Intake', curr: currentStats.income, prev: prevStats.income },
              { label: 'Total Outflow', curr: currentStats.expense, prev: prevStats.expense },
              { label: 'Net Retention', curr: currentStats.savings, prev: prevStats.savings },
            ].map(item => {
              const delta = getDelta(item.curr, item.prev);
              const isPositive = delta >= 0;
              const isGood = item.label === 'Total Outflow' ? !isPositive : isPositive;

              return (
                <div key={item.label} className="flex justify-between items-end border-b border-white/5 pb-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-mono opacity-50">{item.label}</span>
                    <span className="text-lg font-display">{settings.currency} {item.curr.toLocaleString()}</span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-mono",
                    isGood ? "text-emerald-400" : "text-neon-pink"
                  )}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(delta)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-4">
          <h3 className="text-sm font-mono opacity-50 uppercase">Insights</h3>
          <div className="flex flex-col gap-3">
            {currentStats.expense > prevStats.expense ? (
              <div className="p-3 bg-neon-pink/10 border border-neon-pink/20 rounded text-xs font-mono">
                &gt; WARNING: Outflow increased by {getDelta(currentStats.expense, prevStats.expense)}% compared to last cycle.
              </div>
            ) : (
              <div className="p-3 bg-emerald-400/10 border border-emerald-400/20 rounded text-xs font-mono">
                &gt; OPTIMIZED: Outflow reduced by {Math.abs(getDelta(currentStats.expense, prevStats.expense))}% compared to last cycle.
              </div>
            )}
            {Object.entries(currentStats.categories).map(([cat, amount]: any) => {
              const prevAmount = prevStats.categories[cat];
              if (amount > prevAmount * 1.2 && prevAmount > 0) {
                return (
                  <div key={cat} className="p-3 bg-neon-amber/10 border border-neon-amber/20 rounded text-xs font-mono">
                    &gt; ANOMALY: {cat.toUpperCase()} spending is {getDelta(amount, prevAmount)}% higher than previous baseline.
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>

      <div className="glass-panel p-6">
        <h3 className="text-sm font-mono opacity-50 uppercase mb-6">Category Comparison</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#ffffff44" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#ffffff44" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#0a141e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontFamily: 'JetBrains Mono' }} />
              <Bar dataKey="previous" name="Previous Cycle" fill="#ffffff22" radius={[4, 4, 0, 0]} />
              <Bar dataKey="current" name="Current Cycle" fill="#00f5ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const { 
    state, currentMonth, setCurrentMonth, transactions, allTransactions, budgets,
    addTransaction, deleteTransaction, updateBudget, toggleBudgetLock, updateSettings, addGoal, updateGoal, play
  } = useNeonState();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isBooted, setIsBooted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBooted(true);
      play('playBoot');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'HUD' },
    { id: 'transactions', icon: ReceiptText, label: 'Stream' },
    { id: 'budget', icon: PieChart, label: 'Quota' },
    { id: 'comparison', icon: TrendingUp, label: 'Delta' },
    { id: 'goals', icon: Target, label: 'Mission' },
    { id: 'settings', icon: SettingsIcon, label: 'System' },
  ];

  if (!isBooted) {
    return (
      <div className="fixed inset-0 bg-cyber-bg flex flex-col items-center justify-center gap-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-4xl font-display font-black neon-text-cyan tracking-tighter"
        >
          NEON_LEDGER
        </motion.div>
        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="h-full bg-neon-cyan shadow-[0_0_10px_#00f5ff]"
          />
        </div>
        <div className="text-[10px] font-mono opacity-50 animate-pulse">
          INITIALIZING CORE SYSTEMS...
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen pb-24 md:pb-0 md:pl-20 relative", state.settings.fxEnabled && "crt-flicker")}>
      {state.settings.fxEnabled && <div className="fixed inset-0 scanlines pointer-events-none" />}
      
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-20 flex-col items-center py-8 glass-panel border-r border-white/10 z-50">
        <div className="text-neon-cyan mb-12">
          <Wallet className="w-8 h-8" />
        </div>
        <div className="flex flex-col gap-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                play('playSwitch');
              }}
              className={cn(
                "p-3 rounded-xl transition-all relative group",
                activeTab === tab.id ? "bg-neon-cyan/20 text-neon-cyan" : "text-white/40 hover:text-white/70"
              )}
            >
              <tab.icon className="w-6 h-6" />
              <span className="absolute left-full ml-4 px-2 py-1 bg-cyber-card border border-white/10 rounded text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 glass-panel border-t border-white/10 flex items-center justify-around px-4 z-50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              play('playSwitch');
            }}
            className={cn(
              "p-2 rounded-lg transition-all",
              activeTab === tab.id ? "text-neon-cyan" : "text-white/40"
            )}
          >
            <tab.icon className="w-6 h-6" />
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col gap-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter neon-text-cyan">NEON_LEDGER</h1>
            <div className="flex items-center gap-2 text-xs font-mono opacity-50">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM_ONLINE | {format(new Date(), 'HH:mm:ss')}
            </div>
          </div>

          <div className="flex items-center gap-4 glass-panel px-4 py-2">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="hover:text-neon-cyan transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-display text-sm min-w-[120px] text-center">
              &gt; {format(currentMonth, 'MMMM_yyyy').toUpperCase()}
            </span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="hover:text-neon-cyan transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <Dashboard 
                state={state} 
                currentMonth={currentMonth} 
                transactions={transactions} 
                addTransaction={addTransaction}
              />
            )}
            {activeTab === 'transactions' && (
              <Transactions 
                transactions={transactions} 
                deleteTransaction={deleteTransaction} 
                addTransaction={addTransaction}
                settings={state.settings}
              />
            )}
            {activeTab === 'budget' && (
              <BudgetPlanner 
                budgets={budgets} 
                transactions={transactions} 
                updateBudget={updateBudget}
                toggleBudgetLock={toggleBudgetLock}
                settings={state.settings}
              />
            )}
            {activeTab === 'comparison' && (
              <Comparison 
                allTransactions={allTransactions}
                currentMonth={currentMonth}
                settings={state.settings}
              />
            )}
            {activeTab === 'goals' && (
              <Goals 
                goals={state.goals} 
                addGoal={addGoal} 
                updateGoal={updateGoal}
                settings={state.settings}
              />
            )}
            {activeTab === 'settings' && (
              <Settings 
                settings={state.settings} 
                updateSettings={updateSettings} 
                state={state}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

