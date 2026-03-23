import { useState, useEffect, useCallback } from 'react';
import { AppState, INITIAL_STATE, Transaction, BudgetLimit, Goal, AppSettings, CATEGORIES } from './types';
import { sounds } from './services/soundService';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

export function useNeonState() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('neon_ledger_data');
    if (!saved) return INITIAL_STATE;
    
    const parsed = JSON.parse(saved);
    
    // Migration logic for older versions of the app
    const migratedState = { ...INITIAL_STATE, ...parsed };
    
    // If we have old 'budgets' but no 'universalBudgets', migrate them
    if (parsed.budgets && !parsed.universalBudgets) {
      migratedState.universalBudgets = parsed.budgets.map((b: any) => ({
        ...b,
        isUniversal: true
      }));
    }

    // Ensure monthlyBudgets is initialized
    if (!migratedState.monthlyBudgets) {
      migratedState.monthlyBudgets = {};
    }
    
    return migratedState;
  });

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const currentMonthId = format(currentMonth, 'yyyy-MM');

  useEffect(() => {
    localStorage.setItem('neon_ledger_data', JSON.stringify(state));
  }, [state]);

  const play = useCallback((sound: keyof typeof sounds) => {
    if (state.settings.soundEnabled && typeof sounds[sound] === 'function') {
      (sounds[sound] as Function)();
    }
  }, [state.settings.soundEnabled]);

  const getBudgetsForMonth = (monthId: string) => {
    const monthly = state.monthlyBudgets[monthId] || [];
    return state.universalBudgets.map(ub => {
      const mb = monthly.find(m => m.category === ub.category);
      // If universal is locked, use universal. Otherwise use monthly if it exists, else 0.
      if (ub.isUniversal) return ub;
      return mb || { ...ub, limit: 0, isUniversal: false };
    });
  };

  const updateBudget = (category: string, limit: number) => {
    setState(prev => {
      const isUniversal = prev.universalBudgets.find(b => b.category === category)?.isUniversal;
      
      if (isUniversal) {
        return {
          ...prev,
          universalBudgets: prev.universalBudgets.map(b => 
            b.category === category ? { ...b, limit } : b
          )
        };
      } else {
        const currentMonthly = prev.monthlyBudgets[currentMonthId] || 
          CATEGORIES.map(cat => ({ category: cat, limit: 0, carryOver: false, isUniversal: false }));
        
        return {
          ...prev,
          monthlyBudgets: {
            ...prev.monthlyBudgets,
            [currentMonthId]: currentMonthly.map(b => 
              b.category === category ? { ...b, limit } : b
            )
          }
        };
      }
    });
  };

  const toggleBudgetLock = (category: string) => {
    setState(prev => {
      const ub = prev.universalBudgets.find(b => b.category === category);
      if (!ub) return prev;

      const newIsUniversal = !ub.isUniversal;
      
      // If we are locking (making universal), we might want to sync current monthly limit to universal?
      // Or just toggle the flag. Let's just toggle the flag for now.
      
      return {
        ...prev,
        universalBudgets: prev.universalBudgets.map(b => 
            b.category === category ? { ...b, isUniversal: newIsUniversal } : b
        )
      };
    });
    play('playAdd');
  };

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newT = { ...t, id: crypto.randomUUID() };
    setState(prev => ({
      ...prev,
      transactions: [newT, ...prev.transactions]
    }));
    play('playAdd');
  };

  const deleteTransaction = (id: string) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id)
    }));
    play('playDelete');
  };

  const updateSettings = (settings: Partial<AppSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings }
    }));
  };

  const addGoal = (goal: Omit<Goal, 'id'>) => {
    const newGoal = { ...goal, id: crypto.randomUUID() };
    setState(prev => ({
      ...prev,
      goals: [...prev.goals, newGoal]
    }));
    play('playAdd');
  };

  const updateGoal = (id: string, amount: number) => {
    setState(prev => {
      const newGoals = prev.goals.map(g => {
        if (g.id === id) {
          const newAmount = g.currentAmount + amount;
          if (newAmount >= g.targetAmount && g.currentAmount < g.targetAmount) {
            play('playGoal');
          }
          return { ...g, currentAmount: newAmount };
        }
        return g;
      });
      return { ...prev, goals: newGoals };
    });
  };

  const getFilteredTransactions = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return state.transactions.filter(t => {
      const tDate = parseISO(t.date);
      return isWithinInterval(tDate, { start, end });
    });
  };

  return {
    state,
    currentMonth,
    setCurrentMonth: (d: Date) => {
      setCurrentMonth(d);
      play('playSwitch');
    },
    transactions: getFilteredTransactions(currentMonth),
    allTransactions: state.transactions,
    budgets: getBudgetsForMonth(currentMonthId),
    addTransaction,
    deleteTransaction,
    updateBudget,
    toggleBudgetLock,
    updateSettings,
    addGoal,
    updateGoal,
    play
  };
}
