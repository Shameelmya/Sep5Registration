"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function Home() {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [isRegOpen, setIsRegOpen] = useState(true);

  useEffect(() => {
    // SEP 5 2026, 8.55 AM target date
    const targetDate = new Date("2026-09-05T08:55:00").getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
      } else {
        setTimeLeft({
          d: Math.floor(distance / (1000 * 60 * 60 * 24)),
          h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configRef = doc(db, 'config', 'admin');
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          setIsRegOpen(configSnap.data().registration);
        }
      } catch (err) {
        console.log("Firebase config not ready, defaulting to open.");
      }
    };
    fetchConfig();
  }, []);

  return (
    <div className="container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '40px', paddingBottom: '40px' }}>
      
      <h1 style={{ marginBottom: '24px', textAlign: 'center', color: '#0f172a' }}>Teachers Day<br/>Programme</h1>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Countdown Timer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
          {timeLeft ? (
            <>
              <TimeBox value={timeLeft.d} label="Days" />
              <TimeBox value={timeLeft.h} label="Hrs" />
              <TimeBox value={timeLeft.m} label="Min" />
              <TimeBox value={timeLeft.s} label="Sec" />
            </>
          ) : (
            <div style={{ height: '80px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading timer...</div>
          )}
        </div>

        {/* Poster Placeholder - Empty block with alt text as requested */}
        <div style={{ width: '100%', aspectRatio: '1080/1350', background: 'rgba(255,255,255,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: 'var(--radius-lg)' }}>
          <span style={{ color: 'var(--secondary-text)', fontSize: '1rem', fontWeight: '500' }}>poster here</span>
        </div>

        {/* Register Button */}
        {isRegOpen ? (
          <Link href="/register" className="btn-primary" style={{ padding: '20px', fontSize: '1.1rem' }}>
            Register Now
          </Link>
        ) : (
          <button className="btn-primary" disabled style={{ padding: '20px', fontSize: '1.1rem' }}>
            Registration Closed
          </button>
        )}

        {/* Get Pass & Location Half/Half */}
        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <Link href="/get-pass" className="btn-secondary" style={{ flex: 1, padding: '16px 0' }}>
            Get Pass
          </Link>
          <a href="https://maps.google.com/?q=MLA+Office" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ flex: 1, padding: '16px 0' }}>
            Location
          </a>
        </div>

      </div>
    </div>
  );
}

function TimeBox({ value, label }: { value: number, label: string }) {
  return (
    <div style={{ flex: 1, background: '#ffffff', borderRadius: '16px', padding: '14px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
      <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>{value.toString().padStart(2, '0')}</div>
      <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>{label}</div>
    </div>
  );
}
