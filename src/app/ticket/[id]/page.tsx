"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';

export default function Ticket() {
  const params = useParams();
  const phone = params.id as string;
  const router = useRouter();
  const ticketRef = useRef<HTMLDivElement>(null);

  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const docRef = doc(db, 'registrations', phone);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setRegistration(docSnap.data());
        } else {
          setError('Ticket not found.');
        }
      } catch (err: any) {
        console.error(err);
        setError('Error fetching ticket.');
      }
      setLoading(false);
    };
    fetchTicket();
  }, [phone]);

  const handleDownload = async () => {
    if (ticketRef.current) {
      // Use scale 4 for high quality and solid background to prevent WhatsApp from making transparent corners black
      const canvas = await html2canvas(ticketRef.current, { scale: 4, backgroundColor: '#f0fdf4' });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Ticket_${registration.regNumber}.png`;
      link.click();
    }
  };

  const handleShare = async () => {
    if (ticketRef.current && navigator.share) {
      const canvas = await html2canvas(ticketRef.current, { scale: 4, backgroundColor: '#f0fdf4' });
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `Ticket_${registration.regNumber}.png`, { type: 'image/png' });
          try {
            await navigator.share({
              title: 'Registration Successful',
              text: `Registration Successful!\nName: ${registration.name}\nReg No: ${registration.regNumber}\n\nHere is your ticket for the Teachers Day Programme!`,
              files: [file]
            });
          } catch (err) {
            console.error('Share failed', err);
          }
        }
      });
    } else {
      alert("Sharing is not supported on this device/browser. Please download instead.");
    }
  };

  if (loading) return <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>Loading ticket...</div>;
  if (error) return <div className="container" style={{ textAlign: 'center', paddingTop: '100px', color: 'var(--danger)' }}>{error}</div>;
  if (!registration) return null;

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '32px', paddingBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button onClick={() => router.push('/')} style={{ background: 'transparent', color: 'var(--primary-alt)', fontWeight: '600', marginBottom: '24px', fontSize: '1rem', padding: '0', border: 'none', cursor: 'pointer', alignSelf: 'flex-start' }}>
        &larr; Home
      </button>

      <h2 style={{ color: 'var(--success)', marginBottom: '8px', textAlign: 'center', fontSize: '1.6rem' }}>Registration Successful!</h2>
      <p style={{ color: 'var(--secondary-text)', textAlign: 'center', marginBottom: '24px', fontSize: '0.95rem' }}>
        Registration number : <strong style={{ color: 'var(--foreground)' }}>{registration.regNumber}</strong>
      </p>

      {/* TICKET WRAPPER */}
      <div style={{ filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.1))', width: '100%', maxWidth: '340px', marginBottom: '32px' }}>
        <div ref={ticketRef} style={{ 
          background: 'white', 
          borderRadius: '20px',
          overflow: 'hidden',
          /* Ticket cutout mask for modern professional look */
          WebkitMaskImage: 'radial-gradient(circle at 0px 145px, transparent 16px, black 17px), radial-gradient(circle at 100% 145px, transparent 16px, black 17px)',
          WebkitMaskSize: '51% 100%',
          WebkitMaskPosition: 'left, right',
          WebkitMaskRepeat: 'no-repeat',
          display: 'flex',
          flexDirection: 'column'
        }}>
          
          {/* Top Colored Part */}
          <div style={{ 
            background: 'linear-gradient(135deg, var(--primary), var(--primary-alt))', 
            color: 'white', 
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            height: '145px',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.05em', opacity: 0.9, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Reg No: {registration.regNumber}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '4px', lineHeight: 1.1 }}>
              {registration.name}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: '500', opacity: 0.95, marginBottom: '2px' }}>
              {registration.position}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8, lineHeight: 1.2 }}>
              {registration.school}
            </div>
          </div>

          {/* Dashed Divider Line */}
          <div style={{ width: '100%', height: '0', borderTop: '2px dashed rgba(0,0,0,0.15)', position: 'relative' }}></div>

          {/* Bottom White Part */}
          <div style={{ 
            background: 'white', 
            padding: '28px 20px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center' 
          }}>
            <QRCodeSVG value={registration.regNumber} size={140} level="M" />
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '12px', marginBottom: '24px' }}>Scan for entry</div>

            <div style={{ width: '95%', height: '70px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>horizontal logo here</span>
            </div>
          </div>

        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '340px' }}>
        <button onClick={handleDownload} className="btn-primary" style={{ flex: 1, padding: '16px 0' }}>
          Download
        </button>
        <button onClick={handleShare} className="btn-secondary" style={{ flex: 1, padding: '16px 0' }}>
          Share
        </button>
      </div>
    </div>
  );
}
