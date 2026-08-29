"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';

export default function Ticket() {
  const { id } = useParams();
  const router = useRouter();
  const ticketRef = useRef<HTMLDivElement>(null);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'registrations', id as string));
        if (docSnap.exists()) {
          setData({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No such ticket");
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    if (id) fetchTicket();
  }, [id]);

  const handleDownload = async () => {
    if (ticketRef.current) {
      try {
        const canvas = await html2canvas(ticketRef.current, { scale: 2 });
        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = image;
        link.download = `Ticket_${data.regNumber}.png`;
        link.click();
      } catch (err) {
        console.error("Failed to generate image", err);
      }
    }
  };

  const handleShare = async () => {
    if (ticketRef.current) {
      try {
        const canvas = await html2canvas(ticketRef.current, { scale: 2 });
        canvas.toBlob(async (blob) => {
          if (blob && navigator.share) {
            const file = new File([blob], `Ticket_${data.regNumber}.png`, { type: 'image/png' });
            await navigator.share({
              title: 'MLA Teachers Day Ticket',
              files: [file]
            });
          } else {
            alert("Sharing not supported on this browser. Please use the download button.");
          }
        });
      } catch(err) {
        console.error(err);
      }
    }
  };

  if (loading) return <div className="container" style={{paddingTop:'40px', textAlign:'center'}}>Loading ticket...</div>;
  if (!data) return <div className="container" style={{paddingTop:'40px', textAlign:'center'}}>Ticket not found.</div>;

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '40px' }}>
      <button onClick={() => router.push('/')} style={{ background: 'transparent', color: 'var(--primary)', fontWeight: '600', marginBottom: '24px', fontSize: '1rem', padding: '0', border: 'none', cursor: 'pointer' }}>
        &larr; Home
      </button>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ color: 'var(--success)' }}>Registration Successful!</h2>
        <p style={{ color: 'var(--secondary-text)', marginTop: '8px' }}>Your unique registration number is <strong>{data.regNumber}</strong></p>
      </div>

      <div 
        ref={ticketRef}
        style={{ 
          background: 'var(--card-bg)', 
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 'var(--radius-lg)', 
          padding: '32px', 
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden',
          // Ensure correct rendering in html2canvas by specifying text colors explicitly
          color: 'var(--foreground)'
        }}
      >
        {/* Logo Placeholder */}
        <div style={{ width: '100%', height: '80px', backgroundColor: 'var(--secondary)', marginBottom: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '8px' }}>
           <span style={{ color: 'var(--secondary-text)' }}>horizontal logo here</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ padding: '16px', background: '#fff', borderRadius: '12px', marginBottom: '16px' }}>
            <QRCodeSVG value={data.id} size={150} level={"H"} />
          </div>
          <div style={{ background: 'var(--primary)', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Delegate Tag
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '8px' }}>{data.name}</h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--primary)', fontWeight: '500', marginBottom: '4px' }}>{data.position}</p>
          <p style={{ color: 'var(--secondary-text)', fontSize: '0.9rem', marginBottom: '16px' }}>{data.school}</p>
          <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '16px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>REG NO: <strong style={{ color: 'var(--foreground)' }}>{data.regNumber}</strong></p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <button onClick={handleDownload} className="btn-primary" style={{ flex: 1 }}>
          Download PNG
        </button>
        <button onClick={handleShare} className="btn-secondary" style={{ flex: 1 }}>
          Share
        </button>
      </div>
    </div>
  );
}
