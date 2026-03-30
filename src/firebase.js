import { getApps, initializeApp } from 'firebase/app'

// Fill these values with your Firebase project configuration before deployment.
const firebaseConfig = {}

const app =
  Object.keys(firebaseConfig).length > 0
    ? getApps().length
      ? getApps()[0]
      : initializeApp(firebaseConfig)
    : null

export default app
