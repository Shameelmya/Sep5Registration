"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import * as XLSX from 'xlsx';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [registrations, setRegistrations] = useState<any[]>([]);
  const [isRegOpen, setIsRegOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  const [showFilter, setShowFilter] = useState(false);
  const [filterSchool, setFilterSchool] = useState('');
  const [filterPosition, setFilterPosition] = useState('');

  const pressTimer = useRef<NodeJS.Timeout | null>(null);

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

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setLoginError("Invalid admin credentials");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const configRef = doc(db, 'config', 'admin');
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        setIsRegOpen(configSnap.data().registration);
      }

      const querySnapshot = await getDocs(collection(db, 'registrations'));
      const data: any[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      // Sort by timestamp descending
      data.sort((a, b) => b.timestamp - a.timestamp);
      setRegistrations(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const toggleRegistration = async () => {
    try {
      const newState = !isRegOpen;
      await setDoc(doc(db, 'config', 'admin'), { registration: newState }, { merge: true });
      setIsRegOpen(newState);
    } catch (err) {
      console.error(err);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(registrations);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");
    XLSX.writeFile(workbook, "MLA_Teachers_Day_Registrations.xlsx");
  };

  const markAttendance = async (id: string) => {
    try {
      await updateDoc(doc(db, 'registrations', id), { status: 'Attended' });
      setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: 'Attended' } : r));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePointerDown = (id: string, currentStatus: string) => {
    if (currentStatus !== 'Attended') return;
    pressTimer.current = setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'registrations', id), { status: 'Pending' });
        setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: 'Pending' } : r));
        alert("Attendance reversed!");
      } catch (err) {
        console.error(err);
      }
    }, 3000); // 3 seconds long press
  };

  const handlePointerUp = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete the registration for ${name}?`)) {
      try {
        await deleteDoc(doc(db, 'registrations', id));
        setRegistrations(prev => prev.filter(r => r.id !== id));
      } catch (err) {
        console.error(err);
        alert("Failed to delete registration.");
      }
    }
  };

  if (authLoading) {
    return <div className="container animate-fade-in" style={{ paddingTop: '100px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="container animate-fade-in" style={{ paddingTop: '100px', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '32px' }}>Admin Login</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>Admin Email</label>
            <input 
              type="email" 
              className="input-field" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>Password</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          {loginError && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{loginError}</p>}
          <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>Login</button>
        </form>
      </div>
    );
  }

  const attendedCount = registrations.filter(r => r.status === 'Attended').length;

  // Derive unique schools and positions for the dropdowns
  const uniqueSchools = Array.from(new Set(registrations.map(r => r.school))).filter(Boolean);
  const uniquePositions = Array.from(new Set(registrations.map(r => r.position))).filter(Boolean);

  const filteredRegistrations = registrations.filter(r => {
    if (filterSchool && r.school !== filterSchool) return false;
    if (filterPosition && r.position !== filterPosition) return false;
    return true;
  });

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      
      {/* HEADER WITH ICON BUTTONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', color: '#0f172a' }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/admin/scanner" title="Open Scanner" style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path></svg>
          </Link>
          <button onClick={fetchData} title="Refresh Data" style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
          </button>
          <button onClick={handleLogout} title="Logout" style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </div>

      {/* STATS IN ONE LINE */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div className="glass" style={{ flex: 1, padding: '20px 12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', marginBottom: '4px' }}>Total Registered</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{registrations.length}</div>
        </div>
        <div className="glass" style={{ flex: 1, padding: '20px 12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', marginBottom: '4px' }}>Total Attended</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--success)' }}>{attendedCount}</div>
        </div>
      </div>

      <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)', marginBottom: '32px' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', marginBottom: '12px' }}>Registration Status</div>
        <button 
          onClick={toggleRegistration} 
          style={{ 
            width: '100%', 
            padding: '16px',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            border: 'none',
            background: isRegOpen ? 'var(--success)' : 'var(--danger)', 
            color: 'white' 
          }}
        >
          {isRegOpen ? 'Close Registration' : 'Open Registration'}
        </button>
      </div>

      {/* FILTER & EXPORT ROW */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Registrations</h2>
          <button 
            onClick={() => setShowFilter(!showFilter)}
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              width: '36px', height: '36px', borderRadius: '50%', 
              background: showFilter ? 'var(--primary)' : 'white', 
              color: showFilter ? 'white' : 'var(--primary)', 
              border: '1px solid #e2e8f0', cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
            }}
            title="Filter Options"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          </button>
        </div>
        <button onClick={exportToExcel} style={{ background: 'white', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
          Export to Excel
        </button>
      </div>

      {/* FILTER PANEL */}
      {showFilter && (
        <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-md)', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--secondary-text)', marginBottom: '8px' }}>Filter by School</label>
            <select className="input-field" value={filterSchool} onChange={e => setFilterSchool(e.target.value)} style={{ padding: '12px' }}>
              <option value="">All Schools</option>
              {uniqueSchools.map((s: any) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--secondary-text)', marginBottom: '8px' }}>Filter by Position</label>
            <select className="input-field" value={filterPosition} onChange={e => setFilterPosition(e.target.value)} style={{ padding: '12px' }}>
              <option value="">All Positions</option>
              {uniquePositions.map((p: any) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {(filterSchool || filterPosition) && (
            <button onClick={() => { setFilterSchool(''); setFilterPosition(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', fontSize: '0.9rem', cursor: 'pointer', textAlign: 'right', fontWeight: '600', marginTop: '4px' }}>
              Clear Filters
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading data...</div>
      ) : (
        <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.05)' }}>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--secondary-text)' }}>Reg No</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--secondary-text)' }}>Name</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--secondary-text)' }}>Phone</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--secondary-text)' }}>School</th>
                <th style={{ padding: '16px', textAlign: 'center', color: 'var(--secondary-text)' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'center', color: 'var(--secondary-text)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: i === filteredRegistrations.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.05)' }}>
                  <td style={{ padding: '16px', fontWeight: '600' }}>{r.regNumber}</td>
                  <td style={{ padding: '16px' }}>
                    {r.name}<br/>
                    <span style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>{r.position}</span>
                  </td>
                  <td style={{ padding: '16px' }}>{r.phone}</td>
                  <td style={{ padding: '16px', fontSize: '0.9rem' }}>{r.school}</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.8rem', 
                      fontWeight: '600',
                      background: (r.status || 'Pending') === 'Attended' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 149, 0, 0.1)',
                      color: (r.status || 'Pending') === 'Attended' ? 'var(--success)' : '#ff9500'
                    }}>
                      {r.status || 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    {(r.status || 'Pending') === 'Pending' ? (
                      <button 
                        onClick={() => markAttendance(r.id)} 
                        style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', border: 'none', cursor: 'pointer', flex: 1 }}
                      >
                        Mark Attended
                      </button>
                    ) : (
                      <button 
                        onPointerDown={() => handlePointerDown(r.id, r.status)}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                        style={{ background: 'var(--success)', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', border: 'none', cursor: 'pointer', flex: 1 }}
                        title="Long press for 3s to revert"
                      >
                        Attended
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(r.id, r.name)} 
                      style={{ background: 'var(--danger)', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', border: 'none', cursor: 'pointer' }}
                      title="Delete Entry"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRegistrations.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--secondary-text)' }}>No registrations found.</div>
          )}
        </div>
      )}

    </div>
  );
}
