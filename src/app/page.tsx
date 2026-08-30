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
    
    const calculateTime = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        return { d: 0, h: 0, m: 0, s: 0 };
      }
      return {
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000)
      };
    };

    // Calculate immediately to avoid the 1 second loading delay
    setTimeLeft(calculateTime());
    
    const interval = setInterval(() => {
      setTimeLeft(calculateTime());
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
      
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Countdown Timer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
          {timeLeft ? (
            <>
              <TimeBox value={timeLeft.d} label="Days" color="linear-gradient(135deg, var(--primary), var(--primary-alt))" />
              <TimeBox value={timeLeft.h} label="Hrs" color="linear-gradient(135deg, #059669, #34d399)" />
              <TimeBox value={timeLeft.m} label="Min" color="linear-gradient(135deg, var(--primary), var(--primary-alt))" />
              <TimeBox value={timeLeft.s} label="Sec" color="linear-gradient(135deg, #059669, #34d399)" />
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

        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <Link href="/get-pass" className="btn-secondary" style={{ flex: 1, padding: '16px 0' }}>
            Get Pass
          </Link>
          <a href="https://maps.app.goo.gl/aa2GviWm4EKhDqxy7" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ flex: 1, padding: '16px 0' }}>
            Location
          </a>
        </div>

      </div>
    </div>
  );
}

function TimeBox({ value, label, color }: { value: number, label: string, color: string }) {
  return (
    <div style={{ flex: 1, background: color, borderRadius: '16px', padding: '14px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
      <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#ffffff', marginBottom: '2px' }}>{value.toString().padStart(2, '0')}</div>
      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.95)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>{label}</div>
    </div>
  );
}
