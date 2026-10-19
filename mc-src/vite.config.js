import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    base: '/modo-competicao/',
    plugins: [react()],
    build: {
        outDir: '../modo-competicao',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    data: ['./src/data/exercicios.json', './src/data/jogosCompeticao.ts'],
                },
            },
        },
    },
});
// vitest config is in vitest.config.ts
