// Tailwind config for tailwind-rn (React Native)
// Note: tailwind-rn does not use the `content` key. It reads this theme to generate styles.json
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: '#0b0d0f',
        pixelGreen: '#00ff9c',
        pixelYellow: '#ffd700',
        pixelRed: '#ff5252',
        pixelBlue: '#00e5ff',
        white: '#ffffff',
        black: '#000000',
      },
      fontFamily: {
        vt323: ['VT323_400Regular'],
        press: ['PressStart2P_400Regular'],
      },
    },
  },
};
