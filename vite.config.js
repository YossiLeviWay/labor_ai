import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // החלף את 'labor_ai' בשם המדויק של המאגר (Repository) שלך ב-GitHub
  base: '/labor_ai/', 
})