"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';

export default function Scanner() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = async () => {
    setError('');
    setScanResult(null);
    setUserData(null);
    setIsScanning(true);
    
    // Give React time to render the #reader div
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        
        const onScanSuccess = (decodedText: string) => {
          html5QrCode.stop().then(() => {
            setIsScanning(false);
            setScanResult(decodedText);
            fetchUserData(decodedText);
          }).catch(console.error);
        };

        // Try environment camera first
        try {
          await html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, undefined);
        } catch (err) {
          // Fallback if environment camera fails
          await html5QrCode.start({ facingMode: "user" }, config, onScanSuccess, undefined);
        }
      } catch (err) {
        console.error(err);
        setIsScanning(false);
        setError("Failed to start camera. Please check your browser permissions.");
      }
    }, 200);
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error(err);
      }
    }
    setIsScanning(false);
  };

  const fetchUserData = async (id: string) => {
    setLoading(true);
    setError('');
    
    try {
      // The QR code contains the Reg Number (e.g., MLA-XXXX)
      const q = query(collection(db, 'registrations'), where('regNumber', '==', id));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Found by Reg Number
        const docSnap = querySnapshot.docs[0];
        setUserData({ id: docSnap.id, ...docSnap.data() });
      } else {
        // Fallback: try searching by Document ID just in case it's an old ticket format
        const docRef = doc(db, 'registrations', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('No registration found for this QR code.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Error fetching data. Are you connected to the internet?');
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
  };

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
      <button onClick={() => router.back()} style={{ background: 'transparent', color: 'var(--primary)', fontWeight: '600', marginBottom: '24px', fontSize: '1rem', padding: '0', border: 'none', cursor: 'pointer' }}>
        &larr; Back to Dashboard
      </button>

      <h1 style={{ marginBottom: '24px' }}>QR Scanner</h1>

      {/* Manual Start Button */}
      {!isScanning && !scanResult && (
        <div className="glass" style={{ padding: '32px 20px', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <div style={{ marginBottom: '24px', color: 'var(--secondary-text)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
          </div>
          <button onClick={startScanner} className="btn-primary" style={{ width: '100%', padding: '18px', fontSize: '1.1rem' }}>
            Open Camera to Scan
          </button>
        </div>
      )}

      {/* The Scanner Viewport */}
      {isScanning && (
        <div className="animate-fade-in" style={{ background: 'black', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
          <div id="reader" style={{ width: '100%', border: 'none' }}></div>
        </div>
      )}

      {isScanning && (
        <button onClick={stopScanner} className="btn-secondary animate-fade-in" style={{ width: '100%', padding: '16px', marginTop: '16px', color: 'var(--danger)', border: '1px solid var(--danger)', background: 'rgba(255,59,48,0.05)' }}>
          Cancel Scanning
        </button>
      )}

      {loading && <p style={{ textAlign: 'center', marginTop: '24px' }}>Verifying Entry Pass...</p>}

      {error && (
        <div className="animate-fade-in" style={{ backgroundColor: 'rgba(255,59,48,0.1)', color: 'var(--danger)', padding: '16px', borderRadius: 'var(--radius-md)', marginTop: '24px', fontWeight: '500', textAlign: 'center' }}>
          {error}
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
             <button onClick={resetScanner} className="btn-secondary" style={{ flex: 1 }}>Back</button>
             <button onClick={startScanner} className="btn-primary" style={{ flex: 1 }}>Scan Again</button>
          </div>
        </div>
      )}

      {userData && !loading && (
        <div className="glass animate-fade-in" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', marginTop: '24px' }}>
          <h2 style={{ marginBottom: '16px' }}>Delegate Details</h2>
          <div style={{ lineHeight: '2' }}>
            <p><strong>Name:</strong> {userData.name}</p>
            <p><strong>Phone:</strong> {userData.phone}</p>
            <p><strong>School:</strong> {userData.school}</p>
            <p><strong>Designation:</strong> {userData.position}</p>
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
              <button onClick={markAttendance} className="btn-primary" style={{ background: 'var(--success)', padding: '16px', fontSize: '1.1rem' }}>
                Mark as Attended
              </button>
            ) : (
              <button disabled className="btn-secondary" style={{ opacity: 0.7, padding: '16px', fontSize: '1.1rem' }}>
                Already Attended
              </button>
            )}
            <button onClick={startScanner} className="btn-primary" style={{ padding: '16px', fontSize: '1.1rem' }}>
              Scan Next Entry Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
