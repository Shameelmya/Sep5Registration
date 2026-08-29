"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function Scanner() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    
    // Slight delay to ensure DOM is ready
    const timer = setTimeout(() => {
      scanner = new Html5QrcodeScanner("reader", { 
        qrbox: { width: 250, height: 250 }, 
        fps: 5 
      }, false);

      scanner.render(
        (decodedText) => {
          if (decodedText) {
            scanner?.clear();
            setScanResult(decodedText);
            fetchUserData(decodedText);
          }
        },
        (err) => {
          // Ignore scanning errors to not spam
        }
      );
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scanner) {
        scanner.clear().catch(e => console.error(e));
      }
    };
  }, []);

  const fetchUserData = async (id: string) => {
    setLoading(true);
    setError('');
    try {
      const docRef = doc(db, 'registrations', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserData({ id: docSnap.id, ...docSnap.data() });
      } else {
        setError('No registration found for this QR code.');
      }
    } catch (err) {
      console.error(err);
      setError('Error fetching data. Are you connected to Firebase?');
    }
    setLoading(false);
  };

  const markAttendance = async () => {
    if (!userData) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'registrations', userData.id), { status: 'Attended' });
      setUserData({ ...userData, status: 'Attended' });
    } catch(err) {
      console.error(err);
      alert("Error marking attendance");
    }
    setLoading(false);
  };

  const resetScanner = () => {
    setScanResult(null);
    setUserData(null);
    setError('');
    window.location.reload(); 
  };

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '40px' }}>
      <button onClick={() => router.back()} style={{ background: 'transparent', color: 'var(--primary)', fontWeight: '600', marginBottom: '24px', fontSize: '1rem', padding: '0', border: 'none', cursor: 'pointer' }}>
        &larr; Back to Dashboard
      </button>

      <h1 style={{ marginBottom: '24px' }}>QR Scanner</h1>

      {!scanResult && (
        <div style={{ background: 'white', padding: '16px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
          <div id="reader"></div>
        </div>
      )}

      {loading && <p style={{ textAlign: 'center', marginTop: '24px' }}>Loading...</p>}

      {error && (
        <div style={{ backgroundColor: 'rgba(255,59,48,0.1)', color: 'var(--danger)', padding: '16px', borderRadius: 'var(--radius-md)', marginTop: '24px', fontWeight: '500' }}>
          {error}
          <button onClick={resetScanner} className="btn-secondary" style={{ marginTop: '16px' }}>Scan Again</button>
        </div>
      )}

      {userData && !loading && (
        <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', marginTop: '24px' }}>
          <h2 style={{ marginBottom: '16px' }}>Delegate Details</h2>
          <div style={{ lineHeight: '2' }}>
            <p><strong>Name:</strong> {userData.name}</p>
            <p><strong>Phone:</strong> {userData.phone}</p>
            <p><strong>School:</strong> {userData.school}</p>
            <p><strong>Position:</strong> {userData.position}</p>
            <p><strong>Reg No:</strong> {userData.regNumber}</p>
            <p style={{ marginTop: '8px' }}>
              <strong>Status:</strong> 
              <span style={{ 
                marginLeft: '8px',
                padding: '4px 8px', 
                borderRadius: '12px', 
                fontSize: '0.8rem', 
                fontWeight: '600',
                background: (userData.status || 'Pending') === 'Attended' ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 149, 0, 0.2)',
                color: (userData.status || 'Pending') === 'Attended' ? 'var(--success)' : '#ff9500'
              }}>
                {userData.status || 'Pending'}
              </span>
            </p>
          </div>

          <div style={{ marginTop: '32px', display: 'flex', gap: '16px', flexDirection: 'column' }}>
            {(userData.status || 'Pending') !== 'Attended' ? (
              <button onClick={markAttendance} className="btn-primary" style={{ background: 'var(--success)' }}>
                Mark as Attended
              </button>
            ) : (
              <button disabled className="btn-secondary" style={{ opacity: 0.7 }}>
                Already Attended
              </button>
            )}
            <button onClick={resetScanner} className="btn-secondary">
              Scan Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
