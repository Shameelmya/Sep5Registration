"use client";

import { useState } from 'react';
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

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
      <button onClick={() => router.back()} style={{ background: 'transparent', color: 'var(--primary-alt)', fontWeight: '600', marginBottom: '24px', fontSize: '1rem', padding: '0', border: 'none', cursor: 'pointer' }}>
        &larr; Back
      </button>
      
      <h1 style={{ marginBottom: '32px', textAlign: 'center' }}>Create An Account</h1>

      {error && (
        <div style={{ backgroundColor: '#fee2e2', color: 'var(--danger)', padding: '16px', borderRadius: '16px', marginBottom: '24px', fontWeight: '500', fontSize: '0.9rem', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        
        <div className="input-wrapper">
          <label className="input-label">Full name</label>
          <input required type="text" name="name" value={formData.name} onChange={handleChange} className="input-field" placeholder="enter your name" />
        </div>
        
        <div className="input-wrapper">
          <label className="input-label">Phone Number</label>
          <input required type="tel" name="phone" value={formData.phone} onChange={(e) => {
            handleChange(e);
            if(sameAsPhone) setFormData(prev => ({...prev, whatsapp: e.target.value}));
          }} className="input-field" placeholder="enter mobile number" />
        </div>

        <div className="input-wrapper">
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', marginLeft: '12px', fontSize: '0.85rem', fontWeight: '500', color: 'var(--primary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={sameAsPhone} onChange={handleCheckbox} style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
            WhatsApp number is same as phone
          </label>
          {!sameAsPhone && (
            <input required type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="input-field" placeholder="enter WhatsApp number" />
          )}
        </div>

        <div className="input-wrapper">
          <label className="input-label">Age</label>
          <input required type="number" name="age" value={formData.age} onChange={handleChange} className="input-field" placeholder="enter your age" />
        </div>

        <div className="input-wrapper">
          <label className="input-label">School Name</label>
          <select required name="school" value={formData.school} onChange={handleChange} className="input-field" style={{ appearance: 'none' }}>
            <option value="" disabled>select your school</option>
            {schools.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="input-wrapper">
          <label className="input-label">Position</label>
          <select required name="position" value={formData.position} onChange={handleChange} className="input-field" style={{ appearance: 'none' }}>
            <option value="" disabled>select your position</option>
            <option value="Head of Institution">Head of Institution</option>
            <option value="ICT Coordinator">ICT Coordinator</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '24px' }}>
          {loading ? 'Submitting...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}
