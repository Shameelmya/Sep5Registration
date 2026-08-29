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
    // Fetch registration status from firebase
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
    <div className="container animate-fade-in" style={{ textAlign: 'center', paddingTop: '40px' }}>
      
      {/* Poster Placeholder - Empty block with alt text as requested */}
      <div style={{ width: '100%', aspectRatio: '1080/1350', backgroundColor: 'var(--secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: 'var(--radius-lg)', marginBottom: '32px' }}>
        <span style={{ color: 'var(--secondary-text)', fontSize: '1.2rem' }}>poster here</span>
      </div>
      
      <h1 style={{ marginBottom: '16px' }}>Teachers Day Programme</h1>
      
      {/* Countdown Timer */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
        {timeLeft ? (
          <>
            <TimeBox value={timeLeft.d} label="Days" />
            <TimeBox value={timeLeft.h} label="Hours" />
            <TimeBox value={timeLeft.m} label="Mins" />
            <TimeBox value={timeLeft.s} label="Secs" />
          </>
        ) : (
          <div style={{ height: '70px', display: 'flex', alignItems: 'center' }}>Loading timer...</div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {isRegOpen ? (
          <Link href="/register" className="btn-primary" style={{ padding: '18px', fontSize: '1.2rem' }}>
            Register Now
          </Link>
        ) : (
          <button className="btn-primary" disabled style={{ padding: '18px', fontSize: '1.2rem' }}>
            Registration Closed
          </button>
        )}

        <Link href="/get-pass" className="btn-secondary" style={{ padding: '18px' }}>
          Get Pass
        </Link>
        
        <a href="https://maps.google.com/?q=MLA+Office" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '18px' }}>
          Location
        </a>
      </div>
    </div>
  );
}

function TimeBox({ value, label }: { value: number, label: string }) {
  return (
    <div className="glass" style={{ padding: '12px 8px', borderRadius: 'var(--radius-md)', minWidth: '70px' }}>
      <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '2px' }}>{value.toString().padStart(2, '0')}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}
