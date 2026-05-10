/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#ea9dc5", // hồng chính
        sidebar: "#ea9dc5",
      },
    },
  },
  plugins: [],
}