'use client';

import { Button, Card, Checkbox, createTheme, Input, MantineTheme, Paper, PopoverDropdown, rem } from '@mantine/core';
import { Ubuntu } from 'next/font/google';

const font = Ubuntu({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
});

export const cssResolver = (theme: MantineTheme) => ({
  variables: {
    '--mantine-radius-default': 'var(--mantine-radius-md)',
    '--control-border': `${rem(2)} solid var(--mantine-color-gray-8)`,
  },
  light: {},
  dark: {
    '--mantine-color-body': 'var(--mantine-color-gray-9)',
    '--mantine-color-default-border': 'var(--mantine-color-gray-8)',
    '--mantine-color-blue-outline': 'var(--mantine-color-blue-3)',
    '--mantine-color-red-outline': 'var(--mantine-color-red-4)',
    '--mantine-color-red-filled': 'var(--mantine-color-red-4)',
    '--mantine-color-red-filled-hover': 'var(--mantine-color-red-5)',
  },
});

export const theme = createTheme({
  fontFamily: font.style.fontFamily,
  headings: { fontFamily: font.style.fontFamily },
  autoContrast: true,
  respectReducedMotion: true,
  primaryShade: 3,
  components: {
    Button: Button.extend({
      styles: {
        root: {
          borderWidth: rem(2),
        },
      },
    }),
    Card: Card.extend({
      defaultProps: {
        bg: 'var(--mantine-color-gray-8)',
      },
    }),
    Input: Input.extend({
      styles: {
        input: {
          backgroundColor: 'var(--mantine-color-gray-9)',
          borderColor: 'var(--mantine-color-gray-8)',
          borderWidth: rem(2),
        },
      },
    }),
    Paper: Paper.extend({
      styles: {
        root: {
          borderColor: 'var(--mantine-color-gray-8)',
          borderWidth: rem(2),
        },
      },
    }),
    PopoverDropdown: PopoverDropdown.extend({
      defaultProps: {
        bg: 'var(--mantine-color-gray-8)',
        style: {
          borderWidth: 0,
        },
      },
    }),
  },
});
