"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function GetPass() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Direct document lookup since document ID is now the phone number
      const docRef = doc(db, 'registrations', phone);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setError('No registration found for this mobile number.');
      } else {
        router.push(`/ticket/${phone}`);
      }
    } catch (err: any) {
      console.error(err);
      setError('An error occurred. Are you connected to Firebase?');
    }
    setLoading(false);
  };

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '40px' }}>
      <button onClick={() => router.back()} style={{ background: 'transparent', color: 'var(--primary)', fontWeight: '600', marginBottom: '24px', fontSize: '1rem', padding: '0', border: 'none', cursor: 'pointer' }}>
        &larr; Back
      </button>

      <h1 style={{ marginBottom: '32px' }}>Get Your Pass</h1>
      
      <p style={{ color: 'var(--secondary-text)', marginBottom: '24px' }}>
        Enter the mobile number you used during registration to retrieve your ticket.
      </p>

      {error && (
        <div style={{ backgroundColor: 'rgba(255,59,48,0.1)', color: 'var(--danger)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '24px', fontWeight: '500' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSearch}>
        <input 
          type="tel" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
          className="input-field" 
          placeholder="10-digit mobile number" 
          required 
        />
        <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '16px' }}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
    </div>
  );
}
