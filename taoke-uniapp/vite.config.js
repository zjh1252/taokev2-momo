import uni from '@dcloudio/vite-plugin-uni'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [uni()],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        silenceDeprecations: ['mixed-decls', 'color-functions'],
      },
    },
  },
})
