/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}', // พาธสำหรับหน้าเพจ
    './src/components/**/*.{js,ts,jsx,tsx,mdx}', // พาธสำหรับคอมโพเนนต์
    './src/app/**/*.{js,ts,jsx,tsx,mdx}', // พาธสำหรับ App Router
    // ถ้าไฟล์ LoginForm ของพี่อยู่ในโฟลเดอร์อื่น ให้เพิ่มพาธเข้าไปตรงนี้ครับ
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}