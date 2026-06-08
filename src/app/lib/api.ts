/// <reference types="vite/client" />

/**
 * API Base URL - lấy từ biến môi trường VITE_API_URL
 *
 * Cách dùng:
 * - Dev local (chạy backend riêng port 3001): để VITE_API_URL=http://localhost:3001 trong .env
 * - Kết nối server Vercel thực tế:            để VITE_API_URL=https://your-app.vercel.app
 * - Production build trên Vercel:             để VITE_API_URL= (trống) → dùng relative URL
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';
