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
        success: 'hsl(130, 45%, 50%)', // зелёный
        warning: '#ffdf80', // жёлтый
        error: '#f07f75', // красный
        info: 'hsl(210, 70%, 50%)', // голубой
        /* Белые/светлые для чатов */
        chatLeft: 'hsl(202, 76%, 95%)' /* Голубоватый белый */,
        chatRight: 'hsl(60, 85%, 95%)' /* Желтоватый белый */,
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
