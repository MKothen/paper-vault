# Troubleshooting Guide

## ✅ FIXED: Module Import Errors

### Error Message
```
The requested module '/paper-vault/src/types.ts' does not provide an export named 'Paper'
```

### ✅ Solution Applied

Changed imports from:
```typescript
import { Paper, ReadingSession } from '../types';
```

To:
```typescript
import type { Paper, ReadingSession } from '../types';
```

### Why This Works

TypeScript has two import syntaxes:
1. **Value imports** - `import { X } from './file'` - imports actual code
2. **Type imports** - `import type { X } from './file'` - imports only types (compile-time only)

When Vite processes TypeScript, it needs to know which imports are types vs values. The `type` keyword explicitly tells Vite: "This is only used for TypeScript checking, don't look for runtime code."

### Files Fixed
- ✅ `src/components/AnalyticsDashboard.tsx`
- ✅ `src/components/MultiFilterSidebar.tsx`

### Still Getting Errors?

**Try these steps in order:**

1. **Restart Dev Server** (90% fix rate):
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. **Clear Vite Cache**:
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

3. **Check Browser Console**: Press F12 and look for actual error (not just TypeScript)

4. **Verify File Exists**: Make sure `src/types.ts` exists in your project

---

## Common Errors & Solutions

### 1. "Cannot find module 'recharts'"

**Solution**: Install missing dependency
```bash
npm install recharts
```

### 2. "Module not found: Can't resolve './firebase'"

**Solution**: Make sure `src/firebase.ts` exists with your Firebase config:
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const logout = () => auth.signOut();
```

### 3. CSS Classes Not Working (nb-button, nb-card, etc.)

**Solution**: Add neobrutalist styles to `src/index.css`:
```css
.nb-button {
  @apply px-4 py-2 border-4 border-black font-black uppercase transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none;
  box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);
}

.nb-card {
  @apply border-4 border-black;
  box-shadow: 8px 8px 0px 0px rgba(0,0,0,1);
}

.nb-input {
  @apply w-full px-3 py-2 border-4 border-black font-bold focus:outline-none focus:ring-2 focus:ring-black;
}

.shadow-nb {
  box-shadow: 8px 8px 0px 0px rgba(0,0,0,1);
}

.shadow-nb-sm {
  box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);
}

.shadow-nb-lg {
  box-shadow: 12px 12px 0px 0px rgba(0,0,0,1);
}

.bg-nb-yellow { background-color: #FFD90F; }
.bg-nb-cyan { background-color: #22d3ee; }
.bg-nb-pink { background-color: #FF90E8; }
.bg-nb-lime { background-color: #a3e635; }
.bg-nb-purple { background-color: #c084fc; }
.bg-nb-orange { background-color: #fb923c; }
.bg-nb-gray { background-color: #f5f5f5; }
```

### 4. "React is not defined"

**Solution**: In newer React, you don't need to import React. But if error persists:
```typescript
import React from 'react';
```

### 5. Dark Mode Not Persisting

**Solution**: Check localStorage permissions and add to App:
```typescript
useEffect(() => {
  localStorage.setItem('darkMode', darkMode.toString());
  document.documentElement.classList.toggle('dark', darkMode);
}, [darkMode]);
```

### 6. Firebase Authentication Not Working

**Checklist**:
- ✅ Firebase config added to `src/firebase.ts`
- ✅ Google sign-in enabled in Firebase Console
- ✅ Authorized domain added (localhost + your domain)
- ✅ `npm install firebase` completed

### 7. PDF Not Loading

**Solution**: PDF.js worker issue
```typescript
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
```

### 8. TypeScript Errors in IDE but Code Runs

**Solution**: Restart TypeScript server in VS Code
- Press `Cmd/Ctrl + Shift + P`
- Type "TypeScript: Restart TS Server"
- Press Enter

---

## Debugging Checklist

When something breaks:

1. ✅ Check browser console (F12)
2. ✅ Check terminal for build errors
3. ✅ Verify file paths are correct
4. ✅ Ensure all dependencies installed (`npm install`)
5. ✅ Clear cache and restart dev server
6. ✅ Check Firebase config exists
7. ✅ Verify import statements use `type` for types

---

## Getting Help

If still stuck:

1. Check the error message carefully
2. Look at browser console AND terminal
3. Try the QUICK_FIX.md steps
4. Check Firebase console for auth/storage issues
5. Verify all files from repo are present

## Success Indicators

✅ Dev server starts without errors
✅ No red errors in browser console
✅ Can sign in with Google
✅ Can upload PDF files
✅ Can see analytics dashboard
✅ Can filter papers

If all above work, you're good to go! 🎉
