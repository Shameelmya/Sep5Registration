"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { schools } from '@/lib/schools';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    age: '',
    school: '',
    position: ''
  });
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Custom dropdown state
  const [schoolSearch, setSchoolSearch] = useState('');
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSchoolDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSameAsPhone(e.target.checked);
    if (e.target.checked) {
      setFormData((prev) => ({ ...prev, whatsapp: prev.phone }));
    } else {
      setFormData((prev) => ({ ...prev, whatsapp: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!formData.school) {
      setError('Please select a school from the list.');
      setLoading(false);
      return;
    }

    try {
      const docRef = doc(db, 'registrations', formData.phone);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setError('Phone number is already registered.');
        setLoading(false);
        return;
      }

      const regNumber = "MLA-" + Math.random().toString(36).substr(2, 6).toUpperCase();

      await setDoc(docRef, {
        ...formData,
        whatsapp: sameAsPhone ? formData.phone : formData.whatsapp,
        regNumber,
        status: 'Pending',
        createdAt: serverTimestamp()
      });

      router.push(`/ticket/${formData.phone}`);

    } catch (err: any) {
      console.error(err);
      setError('An error occurred while submitting. Check Firebase.');
    }
    setLoading(false);
  };

  const filteredSchools = schools.filter(s => s.toLowerCase().includes(schoolSearch.toLowerCase()));

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
      <button onClick={() => router.back()} style={{ background: 'transparent', color: 'var(--primary-alt)', fontWeight: '600', marginBottom: '24px', fontSize: '1rem', padding: '0', border: 'none', cursor: 'pointer' }}>
        &larr; Back
      </button>
      
      <h1 style={{ marginBottom: '32px', textAlign: 'center' }}>Registration</h1>

      {error && (
        <div style={{ backgroundColor: '#fee2e2', color: 'var(--danger)', padding: '16px', borderRadius: '16px', marginBottom: '24px', fontWeight: '500', fontSize: '0.9rem', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        
        <div className="input-wrapper">
          <label className="input-label">Full name</label>
          <input required type="text" name="name" value={formData.name} onChange={handleChange} className="input-field" />
        </div>
        
        <div className="input-wrapper">
          <label className="input-label">Phone Number</label>
          <input required type="tel" name="phone" value={formData.phone} onChange={(e) => {
            handleChange(e);
            if(sameAsPhone) setFormData(prev => ({...prev, whatsapp: e.target.value}));
          }} className="input-field" />
        </div>

        <div className="input-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', marginLeft: '12px', marginRight: '12px' }}>
            <label className="input-label" style={{ margin: 0 }}>WhatsApp Number</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>
              <input type="checkbox" checked={sameAsPhone} onChange={handleCheckbox} style={{ width: '16px', height: '16px', accentColor: 'var(--primary-alt)' }} />
              Same as phone
            </label>
          </div>
          {!sameAsPhone && (
            <input required type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="input-field" />
          )}
        </div>

        <div className="input-wrapper">
          <label className="input-label">Age</label>
          <input required type="number" name="age" min="10" value={formData.age} onChange={handleChange} className="input-field" />
        </div>

        <div className="input-wrapper" ref={dropdownRef}>
          <label className="input-label">School Name</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              value={schoolSearch} 
              onChange={e => {
                setSchoolSearch(e.target.value);
                setFormData(prev => ({ ...prev, school: e.target.value }));
                setShowSchoolDropdown(true);
              }}
              onFocus={() => setShowSchoolDropdown(true)}
              className="input-field" 
              placeholder="select your school"
              required
            />
            
            {showSchoolDropdown && (
              <ul style={{ 
                position: 'absolute', 
                top: 'calc(100% + 8px)', 
                left: 0, 
                right: 0, 
                background: 'white', 
                zIndex: 10, 
                maxHeight: '220px', 
                overflowY: 'auto', 
                borderRadius: '16px', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                padding: '8px 0',
                listStyle: 'none'
              }}>
                {filteredSchools.length > 0 ? (
                  filteredSchools.map(s => (
                    <li 
                      key={s} 
                      style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '0.95rem', color: '#334155' }} 
                      onClick={() => {
                        setSchoolSearch(s);
                        setFormData(prev => ({ ...prev, school: s }));
                        setShowSchoolDropdown(false);
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {s}
                    </li>
                  ))
                ) : (
                  <li style={{ padding: '12px 20px', color: '#94a3b8', fontSize: '0.95rem' }}>No schools found</li>
                )}
              </ul>
            )}
          </div>
        </div>

        <div className="input-wrapper">
          <label className="input-label">Position</label>
          <select required name="position" value={formData.position} onChange={handleChange} className="input-field" style={{ appearance: 'none', color: formData.position ? 'var(--foreground)' : '#94a3b8' }}>
            <option value="" disabled>select your position</option>
            <option value="Head of Institution">Head of Institution</option>
            <option value="ICT Coordinator">ICT Coordinator</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '24px' }}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
