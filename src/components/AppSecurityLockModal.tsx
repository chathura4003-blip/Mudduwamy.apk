import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Unlock, ShieldCheck, KeyRound, Delete, Sparkles } from 'lucide-react';
import { useSecurityLock } from '../context/SecurityLockContext';
import { triggerHaptic } from '../utils/haptics';

export const AppSecurityLockModal: React.FC = () => {
  const { isLocked, verifyPin } = useSecurityLock();
  const [pinDigits, setPinDigits] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isLocked) return null;

  const handleDigitPress = (digit: string) => {
    triggerHaptic('light');
    if (pinDigits.length >= 4) return;

    const newDigits = [...pinDigits, digit];
    setPinDigits(newDigits);
    setErrorMsg(null);

    if (newDigits.length === 4) {
      const fullPin = newDigits.join('');
      const ok = verifyPin(fullPin);
      if (!ok) {
        setErrorMsg('මුරපදය වැරදියි. නැවත උත්සාහ කරන්න.');
        setTimeout(() => {
          setPinDigits([]);
        }, 500);
      }
    }
  };

  const handleDelete = () => {
    triggerHaptic('light');
    setPinDigits((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-[99999999] bg-stone-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 select-none text-white animate-fade-in pt-safe pb-safe overflow-y-auto max-h-screen-dvh">
      <div className="w-full max-w-xs flex flex-col items-center text-center space-y-6">
        {/* Monastic Shield Emblem */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 text-white flex items-center justify-center shadow-xl shadow-amber-600/30 ring-4 ring-amber-500/20">
            <Lock className="w-9 h-9" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-xl font-serif font-black text-white tracking-tight">
            ආරක්ෂක මුරපදය ඇතුළත් කරන්න
          </h2>
          <p className="text-xs text-amber-300 font-serif">
            ශ්‍රී සුමන මහා පිරිවෙන (මුද්දුව, රත්නපුර)
          </p>
        </div>

        {/* 4-Pin Dots Indicator */}
        <div className="flex items-center justify-center gap-3.5 my-2">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pinDigits.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-amber-400 scale-110 shadow-md shadow-amber-400/50'
                    : 'bg-stone-800 border-2 border-stone-700'
                }`}
              />
            );
          })}
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-400 font-bold animate-bounce">
            {errorMsg}
          </p>
        )}

        {/* 3x4 Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigitPress(num)}
              className="h-14 rounded-2xl bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-xl font-bold font-mono text-white transition active:scale-95 shadow-md flex items-center justify-center cursor-pointer active:bg-amber-600/30 touch-manipulation"
            >
              {num}
            </button>
          ))}

          {/* Empty Space / Quick Key */}
          <div className="flex items-center justify-center text-amber-500">
            <KeyRound className="w-5 h-5 opacity-40" />
          </div>

          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            className="h-14 rounded-2xl bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-xl font-bold font-mono text-white transition active:scale-95 shadow-md flex items-center justify-center cursor-pointer active:bg-amber-600/30 touch-manipulation"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-rose-400 transition active:scale-95 shadow-md flex items-center justify-center cursor-pointer active:bg-rose-950 touch-manipulation"
            title="Delete"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
