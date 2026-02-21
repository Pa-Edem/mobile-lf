// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Primary - зелёный акцент
        greenDefault: 'hsl(130, 40%, 50%)', // основной зелёный
        greenLight: '#7de88f', // светлый зелёный
        greenDark: '#339944', // тёмный зелёный
        // Backgrounds
        bgMain: '#faf8f5', // светло-бежевый
        bgSide: 'hsl(33, 26%, 93%)', // бежевый для карточек
        bgCard: '#e8e1d9', // средний бежевый
        // Text
        textHead: '#2e271f', // тёмно-коричневый
        textTitle: '#594e40', // коричневый
        textText: '#988c81', // средний коричневый
        textDis: '#d6cec2', // светлый
        // Borders
        brd: '#70665c', // основная граница
        brdLight: '#d6cec2', // светлая граница
        divider: '#c2b3a3', // разделитель
        // Tier colors
        tierFree: 'hsl(130, 45%, 50%)', // зелёный
        tierPro: 'hsl(260, 60%, 50%)', // фиолетовый
        tierPremium: 'hsl(40, 75%, 50%)', // золотой
        tierTrial: 'hsl(210, 70%, 50%)', // голубой
        // Semantic colors
        success: 'hsl(130, 80%, 80%)', // зелёный
        textSuccess: '#0a5c18', // зелёный
        warning: 'hsl(45, 100%, 75%)', // жёлтый
        error: 'hsl(5, 80%, 80%)', // красный
        textError: 'hsl(5, 80%, 20%)', // красный
        // info: 'hsl(210, 70%, 50%)',
        info: 'hsl(210, 80%, 80%)', // голубой
        textInfo: '#0a335c', // голубой
        /* Белые/светлые для чатов */
        chatLeft: 'hsl(202, 76%, 95%)' /* Голубоватый белый */,
        chatRight: 'hsl(60, 85%, 95%)' /* Желтоватый белый */,
        flipCard: 'hsl(130, 85%, 95%)' /* Зеленоватый белый */,
      },
      fontFamily: {
        roboto: ['RobotoCondensed_400Regular'],
        robotoItalic: ['RobotoCondensed_400Regular_Italic'],
        robotoMedium: ['RobotoCondensed_500Medium'],
        robotoBold: ['RobotoCondensed_700Bold'],
      },
    },
  },
  plugins: [],
};
