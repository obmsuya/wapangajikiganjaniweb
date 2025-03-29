// lib/fonts.ts
import localFont from 'next/font/local';

export const futura = localFont({
  src: [
    {
      path: '../public/fonts/futura medium bt.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Futura Heavy font.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Futura Heavy font.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/Futura Light font.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/Futura Extra Black font.ttf',
      weight: '800',
      style: 'normal',
    },  
    {
      path: '../public/fonts/Futura Bold Italic font.ttf',
      weight: '700',
      style: 'italic',
    },
    {
      path: '../public/fonts/Futura Light Italic font.ttf',
      weight: '300',
      style: 'italic',
    },
    {
      path: '../public/fonts/Futura Heavy Italic font.ttf',
      weight: '800',
      style: 'italic',
    },
    {
      path: '../public/fonts/Futura Medium Italic font.ttf',
      weight: '500',
      style: 'italic',
    },
  ],
  display: 'swap',
  variable: '--font-futura',
});