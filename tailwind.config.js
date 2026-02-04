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
        greenLight: 'hsl(130, 70%, 70%)', // светлый зелёный
        greenDark: 'hsl(130, 50%, 40%)', // тёмный зелёный
        // Backgrounds
        bgMain: 'hsl(36, 33%, 97%)', // светло-бежевый
        bgSide: 'hsl(33, 26%, 93%)', // бежевый для карточек
        bgCard: 'hsl(32, 25%, 88%)', // средний бежевый
        // Text
        textHead: 'hsl(32, 19%, 15%)', // тёмно-коричневый
        textTitle: 'hsl(34, 16%, 30%)', // коричневый
        textText: 'hsl(29, 10%, 55%)', // средний коричневый
        textDis: 'hsl(36, 20%, 80%)', // светлый
        // Borders
        brd: 'hsl(30, 10%, 40%)', // основная граница
        brdLight: 'hsl(36, 20%, 80%)', // светлая граница
        divider: 'hsl(30, 20%, 70%)', // разделитель
        // Tier colors
        tierFree: 'hsl(130, 45%, 50%)', // зелёный
        tierPro: 'hsl(260, 60%, 50%)', // фиолетовый
        tierPremium: 'hsl(40, 75%, 50%)', // золотой
        tierTrial: 'hsl(210, 70%, 50%)', // голубой
        // Semantic colors
        success: 'hsl(130, 45%, 50%)', // зелёный
        warning: 'hsl(45, 100%, 75%)', // жёлтый
        error: 'hsl(5, 80%, 70%)', // красный
        info: 'hsl(210, 70%, 50%)', // голубой
        /* Белые/светлые для чатов */
        chatLeft: 'hsl(200, 75%, 95%)' /* Голубоватый белый */,
        chatRight: 'hsl(60, 85%, 95%)' /* Желтоватый белый */,
      },
      fontFamily: {
        roboto: ['RobotoCondensed_400Regular'],
        robotoBold: ['RobotoCondensed_700Bold'],
      },
    },
  },
  plugins: [],
};
