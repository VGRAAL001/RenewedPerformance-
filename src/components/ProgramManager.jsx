import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore'
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi'
import { useEffect, useState } from 'react'
import { db } from '../../firebase'
import { plans as defaultPlans } from '../data'

const emptyProgram = { name: '', price: '', detail: '', extra: '', classSessions: 0, oneOnOneSessions: 0, purchaseType: 'membership', featured: false }

function ProgramManager({ onSaved, onError }) {
  const [programs, setPrograms] = useState(defaultPlans)
  const [form, setForm] = useState(emptyProgram)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    async function loadPrograms() {
      try {
        const snapshot = await getDocs(collection(db, 'plans'))
        if (!snapshot.empty) {
          setPrograms(snapshot.docs.map(item => ({ id: item.id, ...item.data() })))
          return
        }
        const seededPrograms = await Promise.all(defaultPlans.map(program => addDoc(collection(db, 'plans'), { ...program, createdAt: serverTimestamp() })))
        setPrograms(defaultPlans.map((program, index) => ({ ...program, id: seededPrograms[index].id })))
      } catch {
        onError('Programmes could not be loaded. Check the published Firestore rules.')
      }
    }
    loadPrograms()
  }, [onError])

  async function save(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.price.trim() || !form.detail.trim() || Number(form.classSessions) < 0 || Number(form.oneOnOneSessions) < 0) {
      onError('Complete the programme details with valid session counts before saving.')
      return
    }
    const record = { ...form, classSessions: Number(form.classSessions || 0), oneOnOneSessions: Number(form.oneOnOneSessions || 0), updatedAt: serverTimestamp() }
    try {
      if (editing?.id) {
        await updateDoc(doc(db, 'plans', editing.id), record)
        setPrograms(current => current.map(item => item.id === editing.id ? { ...item, ...record } : item))
        onSaved('Programme updated.')
      } else {
        const reference = await addDoc(collection(db, 'plans'), { ...record, createdAt: serverTimestamp() })
        setPrograms(current => [...current, { id: reference.id, ...record }])
        onSaved('Programme added.')
      }
      setForm(emptyProgram)
      setEditing(null)
      setShowForm(false)
    } catch {
      onError('Programme could not be saved. Check your Firestore rules.')
    }
  }

  function edit(program) {
    setEditing(program)
    setForm({ name: program.name || '', price: program.price || '', detail: program.detail || '', extra: program.extra || '', classSessions: program.classSessions || 0, oneOnOneSessions: program.oneOnOneSessions || 0, purchaseType: program.purchaseType || 'membership', featured: Boolean(program.featured) })
    setShowForm(true)
  }

  async function remove(program) {
    if (!program.id) return
    if (!window.confirm(`Delete the ${program.name} programme?`)) return
    try {
      await deleteDoc(doc(db, 'plans', program.id))
      setPrograms(current => current.filter(item => item.id !== program.id))
      onSaved('Programme deleted.')
    } catch {
      onError('Programme could not be deleted.')
    }
  }

  return <><div className="admin-section admin-view-heading"><div><p className="eyebrow green">Programme catalogue</p><h3>Memberships and programmes</h3></div><button className="icon-button" type="button" onClick={() => { setEditing(null); setForm(emptyProgram); setShowForm(!showForm) }} aria-label="Add programme" title="Add programme"><FiPlus /></button></div>{showForm && <form className="admin-form" onSubmit={save}><p className="eyebrow green">Admin tools</p><h3>{editing ? 'Edit programme' : 'Add programme'}</h3><label>Programme name<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required /></label><label>Price<input value={form.price} onChange={event => setForm({ ...form, price: event.target.value })} placeholder="R2000" required /></label><label>Description<input value={form.detail} onChange={event => setForm({ ...form, detail: event.target.value })} required /></label><label>Extra details<input value={form.extra} onChange={event => setForm({ ...form, extra: event.target.value })} /></label><label>Class sessions<input type="number" min="0" value={form.classSessions} onChange={event => setForm({ ...form, classSessions: event.target.value })} /></label><label>One-on-one sessions<input type="number" min="0" value={form.oneOnOneSessions} onChange={event => setForm({ ...form, oneOnOneSessions: event.target.value })} /></label><label>Purchase type<select value={form.purchaseType} onChange={event => setForm({ ...form, purchaseType: event.target.value })}><option value="membership">Membership</option><option value="program">Programme</option></select></label><label className="admin-checkbox"><input type="checkbox" checked={form.featured} onChange={event => setForm({ ...form, featured: event.target.checked })} /> Featured programme</label><button className="button button-green" type="submit">{editing ? 'Save programme' : 'Add programme'}</button></form>}<section className="admin-section special-admin-grid">{programs.map(program => <article className="special-admin-card" key={program.id || program.name}><p className="eyebrow green">{program.purchaseType === 'program' ? 'Programme' : 'Membership'}</p><h3>{program.name}</h3><strong className="price">{program.price}</strong><p>{program.detail}</p><small>{program.classSessions || 0} class sessions · {program.oneOnOneSessions || 0} one-on-one sessions</small><div><button className="icon-button" type="button" onClick={() => edit(program)} aria-label={`Edit ${program.name}`} title="Edit programme"><FiEdit2 /></button>{program.id && <button className="icon-button danger" type="button" onClick={() => remove(program)} aria-label={`Delete ${program.name}`} title="Delete programme"><FiTrash2 /></button>}</div></article>)}</section></>
}

export default ProgramManager
