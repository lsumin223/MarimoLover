import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 배포 시 레포지토리명을 base로 설정
export default defineConfig({
  plugins: [react()],
  base: '/MarimoLover/',
})
