/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx}", // <--- IMPORTANT: Scans all your pages and components
    ],
    theme: {
        extend: {
            // You can extend the theme here if needed, but standard tailwind is enough for your mini-project
        },
    },
    plugins: [],
};
