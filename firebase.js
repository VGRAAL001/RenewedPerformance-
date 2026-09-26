import { getAuth } from 'firebase/auth'
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'local-development-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'local-development.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'local-development',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'local-development.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'local-development-sender',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'local-development-app',
}

export const hasFirebaseConfig = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY
  && import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
  && import.meta.env.VITE_FIREBASE_PROJECT_ID
  && import.meta.env.VITE_FIREBASE_APP_ID,
)

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)