/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#E8EDF7',
                    100: '#C6D2EB',
                    200: '#A0B5DE',
                    300: '#7A98D1',
                    400: '#5D82C7',
                    500: '#1B4CA1',
                    600: '#184499',
                    700: '#133A8F',
                    800: '#0F3185',
                    900: '#082074',
                    DEFAULT: '#1B4CA1',
                },
                secondary: {
                    50: '#FEF4ED',
                    100: '#FDE3D2',
                    200: '#FBD1B4',
                    300: '#F9BF96',
                    400: '#F8B17F',
                    500: '#F69953',
                    600: '#F4914C',
                    700: '#F28642',
                    800: '#F07C39',
                    900: '#ED6B29',
                    DEFAULT: '#F69953',
                },
                neutral: {
                    50: '#F9FAFB',
                    100: '#F3F4F6',
                    200: '#E5E7EB',
                    300: '#D1D5DB',
                    400: '#9CA3AF',
                    500: '#6B7280',
                    600: '#4B5563',
                    700: '#374151',
                    800: '#1F2937',
                    900: '#111827',
                },
            },
        },
    },
    plugins: [],
}
