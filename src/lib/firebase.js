// Firebase 연동 준비 파일
// 현재는 미사용 — 로컬 스토리지(Zustand persist) + IndexedDB로 동작합니다.
//
// Firebase를 사용하려면:
// 1. .env.example을 참고해 .env.local 생성
// 2. `npm install firebase` 설치
// 3. 아래 주석 해제 후 각 스토어에서 import해 사용

/*
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const storage = getStorage(app)
export const auth = getAuth(app)
*/

export {}
