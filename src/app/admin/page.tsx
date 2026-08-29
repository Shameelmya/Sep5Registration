"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import * as XLSX from 'xlsx';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegOpen, setIsRegOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        fetchData();
      } else {
        setIsAuthenticated(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the rest
    } catch(err: any) {
      alert("Login Failed: " + err.message);
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setRegistrations([]);
  };

  const fetchData = async () => {
    try {
      // Get registrations
      const querySnapshot = await getDocs(collection(db, 'registrations'));
      const regs: any[] = [];
      querySnapshot.forEach((doc) => {
        regs.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort by creation time (most recent first)
      regs.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      setRegistrations(regs);

      // Get Reg Status
      const configRef = doc(db, 'config', 'admin');
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        setIsRegOpen(configSnap.data().registration);
      }
    } catch(err) {
      console.error(err);
      alert("Error fetching data. Check permissions or network.");
    }
    setLoading(false);
  };

  const toggleRegStatus = async () => {
    try {
      const configRef = doc(db, 'config', 'admin');
      await setDoc(configRef, { registration: !isRegOpen }, { merge: true });
      setIsRegOpen(!isRegOpen);
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  const exportToExcel = () => {
    const dataToExport = registrations.map(r => ({
      RegNumber: r.regNumber,
      Name: r.name,
      Phone: r.phone,
      WhatsApp: r.whatsapp,
      Age: r.age,
      School: r.school,
      Position: r.position,
      Status: r.status || 'Pending'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registrations");
    XLSX.writeFile(wb, "Registrations.xlsx");
  };

  // Hold logic for reverting attendance
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const handlePointerDown = (id: string, currentStatus: string) => {
    if (currentStatus === 'Attended') {
      timerRef.current = setTimeout(async () => {
        try {
          await updateDoc(doc(db, 'registrations', id), { status: 'Pending' });
          setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: 'Pending' } : r));
        } catch (err) {
          console.error(err);
        }
      }, 3000); // 3 seconds
    }
  };

  const handlePointerUp = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const markAttendance = async (id: string) => {
    try {
      await updateDoc(doc(db, 'registrations', id), { status: 'Attended' });
      setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: 'Attended' } : r));
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading) {
    return <div className="container animate-fade-in" style={{ paddingTop: '100px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="container animate-fade-in" style={{ paddingTop: '100px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Secure Admin Login</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="Admin Email" 
            className="input-field" 
            required 
          />
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="Password" 
            className="input-field" 
            required 
          />
          <button type="submit" className="btn-primary">Login</button>
        </form>
      </div>
    );
  }

  const attendedCount = registrations.filter(r => r.status === 'Attended').length;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <h1>Admin Dashboard</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/admin/scanner" className="btn-primary" style={{ width: 'auto' }}>
            Open Scanner
          </Link>
          <button onClick={fetchData} className="btn-secondary" style={{ width: 'auto' }}>
            Refresh
          </button>
          <button onClick={handleLogout} className="btn-secondary" style={{ width: 'auto', background: 'var(--danger)', color: 'white' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--secondary-text)', marginBottom: '8px' }}>Total Registered</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{registrations.length}</div>
        </div>
        <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--secondary-text)', marginBottom: '8px' }}>Total Attended</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>{attendedCount}</div>
        </div>
        <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--secondary-text)', marginBottom: '16px' }}>Registration Status</div>
          <button onClick={toggleRegStatus} style={{ background: isRegOpen ? 'var(--danger)' : 'var(--success)', color: 'white', padding: '10px', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>
            {isRegOpen ? 'Close Registration' : 'Open Registration'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3>Registrations</h3>
        <button onClick={exportToExcel} className="btn-secondary" style={{ width: 'auto', padding: '8px 16px', fontSize: '0.9rem' }}>
          Export to Excel
        </button>
      </div>

      <div style={{ overflowX: 'auto', background: 'var(--card-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>Loading data...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px' }}>Reg No</th>
                <th style={{ padding: '16px' }}>Name</th>
                <th style={{ padding: '16px' }}>Phone</th>
                <th style={{ padding: '16px' }}>School</th>
                <th style={{ padding: '16px' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px', fontWeight: '500' }}>{r.regNumber}</td>
                  <td style={{ padding: '16px' }}>{r.name}</td>
                  <td style={{ padding: '16px' }}>{r.phone}</td>
                  <td style={{ padding: '16px', fontSize: '0.9rem' }}>{r.school}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.8rem', 
                      fontWeight: '600',
                      background: (r.status || 'Pending') === 'Attended' ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 149, 0, 0.2)',
                      color: (r.status || 'Pending') === 'Attended' ? 'var(--success)' : '#ff9500'
                    }}>
                      {r.status || 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {(r.status || 'Pending') === 'Pending' ? (
                      <button 
                        onClick={() => markAttendance(r.id)} 
                        style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', border: 'none', cursor: 'pointer' }}
                      >
                        Mark Attended
                      </button>
                    ) : (
                      <button 
                        onPointerDown={() => handlePointerDown(r.id, r.status)}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                        style={{ background: 'var(--success)', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', border: 'none', cursor: 'pointer' }}
                        title="Long press for 3s to revert"
                      >
                        Attended
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {registrations.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--secondary-text)' }}>No registrations yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
