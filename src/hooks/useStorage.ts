import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { TRANSACTIONS_STORAGE_KEY, TREND_WINDOW_DAYS } from '../constants';
import type {
  Transaction,
  TransactionKind,
  TrendDirection,
  TrendMood,
  TrendSummary,
  TrendPoint,
} from '../types';

const BACKGROUND_TINT_BY_MOOD: Record<TrendMood, string> = {
  happy: '#163b2a',
  neutral: '#0b0d0f',
  sad: '#3b1f29',
};

type DailyBucket = {
  savingsCents: number;
  expensesCents: number;
};

const toCurrency = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
};

const sanitizeAmount = (value: number): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return toCurrency(Math.abs(numeric));
};

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const addDays = (date: Date, amount: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
};

const toDateKey = (date: Date) => startOfDay(date).toISOString().split('T')[0];

const isTransactionKind = (value: unknown): value is TransactionKind =>
  value === 'saving' || value === 'expense';

const normalizeTransactions = (payload: unknown): Transaction[] => {
  if (!Array.isArray(payload)) {
    if (__DEV__) {
      console.warn('[useStorage] Expected stored transactions to be an array, received:', payload);
    }
    return [];
  }

  const seen = new Set<string>();
  let invalidCount = 0;

  const entries = payload.flatMap((item, index) => {
    if (typeof item !== 'object' || item === null) {
      invalidCount += 1;
      return [];
    }

    const data = item as Record<string, unknown>;
    const idCandidate = data.id;
    const typeCandidate = data.type;
    const amountCandidate = data.amount;
    const createdAtCandidate = data.createdAt;
    const noteCandidate = data.note;

    if (typeof idCandidate !== 'string' || idCandidate.trim().length === 0 || seen.has(idCandidate)) {
      invalidCount += 1;
      return [];
    }

    if (!isTransactionKind(typeCandidate)) {
      invalidCount += 1;
      return [];
    }

    if (typeof amountCandidate !== 'number' || !Number.isFinite(amountCandidate)) {
      invalidCount += 1;
      return [];
    }

    if (typeof createdAtCandidate !== 'string' || Number.isNaN(Date.parse(createdAtCandidate))) {
      invalidCount += 1;
      return [];
    }

    const sanitizedAmount = sanitizeAmount(amountCandidate);
    if (sanitizedAmount <= 0) {
      invalidCount += 1;
      return [];
    }

    const note = typeof noteCandidate === 'string' && noteCandidate.trim().length > 0 ? noteCandidate : undefined;

    seen.add(idCandidate);

    return [
      {
        id: idCandidate,
        type: typeCandidate,
        amount: sanitizedAmount,
        note,
        createdAt: new Date(createdAtCandidate).toISOString(),
      } satisfies Transaction,
    ];
  });

  if (invalidCount > 0 && __DEV__) {
    console.warn(`[useStorage] Ignored ${invalidCount} invalid transaction(s) while loading from storage.`);
  }

  return entries.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

const computeTrend = (transactions: Transaction[]): TrendSummary => {
  const today = startOfDay(new Date());
  const windowStart = addDays(today, -(TREND_WINDOW_DAYS - 1));
  const previousWindowStart = addDays(windowStart, -TREND_WINDOW_DAYS);
  const previousWindowEnd = addDays(windowStart, -1);

  const buckets = new Map<string, DailyBucket>();
  let previousWindowNetCents = 0;

  transactions.forEach((transaction) => {
    const transactionDate = startOfDay(new Date(transaction.createdAt));
    if (Number.isNaN(transactionDate.getTime())) {
      return;
    }

    const amountCents = Math.round(transaction.amount * 100);
    const transactionDateMs = transactionDate.getTime();

    if (transactionDateMs >= windowStart.getTime() && transactionDateMs <= today.getTime()) {
      const key = toDateKey(transactionDate);
      const bucket = buckets.get(key) ?? { savingsCents: 0, expensesCents: 0 };

      if (transaction.type === 'saving') {
        bucket.savingsCents += amountCents;
      } else {
        bucket.expensesCents += amountCents;
      }

      buckets.set(key, bucket);
    } else if (transactionDateMs >= previousWindowStart.getTime() && transactionDateMs <= previousWindowEnd.getTime()) {
      previousWindowNetCents += transaction.type === 'saving' ? amountCents : -amountCents;
    }
  });

  const points: TrendPoint[] = [];
  let totalSavingsCents = 0;
  let totalExpensesCents = 0;

  for (let dayIndex = 0; dayIndex < TREND_WINDOW_DAYS; dayIndex += 1) {
    const day = addDays(windowStart, dayIndex);
    const key = toDateKey(day);
    const bucket = buckets.get(key) ?? { savingsCents: 0, expensesCents: 0 };
    const netCents = bucket.savingsCents - bucket.expensesCents;

    totalSavingsCents += bucket.savingsCents;
    totalExpensesCents += bucket.expensesCents;

    points.push({
      date: key,
      savings: toCurrency(bucket.savingsCents / 100),
      expenses: toCurrency(bucket.expensesCents / 100),
      net: toCurrency(netCents / 100),
    });
  }

  const netCents = totalSavingsCents - totalExpensesCents;
  const net = toCurrency(netCents / 100);
  const previousWindowNet = toCurrency(previousWindowNetCents / 100);
  const changeFromPreviousWindow = toCurrency(net - previousWindowNet);
  const averageDailyNet = toCurrency(net / TREND_WINDOW_DAYS);
  const totalSavings = toCurrency(totalSavingsCents / 100);
  const totalExpenses = toCurrency(totalExpensesCents / 100);

  const direction: TrendDirection =
    netCents > previousWindowNetCents ? 'up' : netCents < previousWindowNetCents ? 'down' : 'flat';

  const mood: TrendMood = (() => {
    if (netCents <= 0 && direction === 'down') {
      return 'sad';
    }

    if (netCents >= 0 && direction === 'up') {
      return 'happy';
    }

    if (totalSavingsCents > totalExpensesCents && direction !== 'down') {
      return 'happy';
    }

    if (totalExpensesCents > totalSavingsCents * 1.25) {
      return 'sad';
    }

    return 'neutral';
  })();

  return {
    points,
    windowDays: TREND_WINDOW_DAYS,
    totalSavings,
    totalExpenses,
    net,
    averageDailyNet,
    direction,
    mood,
    backgroundTint: BACKGROUND_TINT_BY_MOOD[mood],
    changeFromPreviousWindow,
    previousWindowNet,
  };
};

const logError = (message: string, error: unknown) => {
  console.error(message, error);
};

export const useStorage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transactionsRef = useRef<Transaction[]>(transactions);

  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);

  const readFromStorage = useCallback(async (): Promise<Transaction[]> => {
    const raw = await AsyncStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      return normalizeTransactions(parsed);
    } catch (err) {
      logError('[useStorage] Failed to parse stored transactions:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const bootstrap = async () => {
      setLoading(true);
      try {
        const loaded = await readFromStorage();
        if (!isActive) {
          return;
        }
        transactionsRef.current = loaded;
        setTransactions(loaded);
        setError(null);
      } catch (err) {
        if (!isActive) {
          return;
        }
        logError('[useStorage] Unable to load transactions from storage:', err);
        transactionsRef.current = [];
        setTransactions([]);
        setError('Unable to load your saved transactions.');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      isActive = false;
    };
  }, [readFromStorage]);

  const persistTransactions = useCallback(async (next: Transaction[]) => {
    await AsyncStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const appendTransaction = useCallback(
    async (kind: TransactionKind, value: number, note?: string) => {
      const normalizedAmount = sanitizeAmount(value);
      if (normalizedAmount <= 0) {
        setError('Transaction amount must be greater than zero.');
        return false;
      }

      const entry: Transaction = {
        id: generateId(),
        type: kind,
        amount: normalizedAmount,
        note,
        createdAt: new Date().toISOString(),
      };

      const next = [...transactionsRef.current, entry];

      try {
        await persistTransactions(next);
        transactionsRef.current = next;
        setTransactions(next);
        setError(null);
        return true;
      } catch (err) {
        logError('[useStorage] Failed to persist new transaction:', err);
        setError('Unable to save your latest change.');
        return false;
      }
    },
    [persistTransactions],
  );

  const addSaving = useCallback((amount: number, note?: string) => appendTransaction('saving', amount, note), [appendTransaction]);

  const addExpense = useCallback(
    (amount: number, note?: string) => appendTransaction('expense', amount, note),
    [appendTransaction],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await readFromStorage();
      transactionsRef.current = loaded;
      setTransactions(loaded);
      setError(null);
    } catch (err) {
      logError('[useStorage] Unable to refresh transactions from storage:', err);
      setError('Unable to refresh your saved transactions.');
      transactionsRef.current = [];
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [readFromStorage]);

  const clear = useCallback(async () => {
    setLoading(true);
    try {
      await AsyncStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
      transactionsRef.current = [];
      setTransactions([]);
      setError(null);
    } catch (err) {
      logError('[useStorage] Failed to clear stored transactions:', err);
      setError('Unable to clear saved transactions.');
    } finally {
      setLoading(false);
    }
  }, []);

  const balance = useMemo(() => {
    const totalCents = transactions.reduce((sum, transaction) => {
      const amountCents = Math.round(transaction.amount * 100);
      return transaction.type === 'saving' ? sum + amountCents : sum - amountCents;
    }, 0);

    return toCurrency(totalCents / 100);
  }, [transactions]);

  const trend = useMemo(() => computeTrend(transactions), [transactions]);

  return {
    loading,
    error,
    transactions,
    balance,
    trend,
    addSaving,
    addExpense,
    refresh,
    clear,
  };
};

export type UseStorageReturn = ReturnType<typeof useStorage>;
export { TREND_WINDOW_DAYS, TRANSACTIONS_STORAGE_KEY };
