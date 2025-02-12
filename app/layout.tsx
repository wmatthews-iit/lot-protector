import React from 'react';
import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import AppLayout from '@/components/AppLayout';
import './global.css';

export const metadata = {
  title: '',
  description: '',
};

export default function RootLayout({ children }: { children: any }) {
  return <html lang="en" {...mantineHtmlProps}>
    <head>
      <ColorSchemeScript />
      {/* <link rel="shortcut icon" href="/favicon.svg" /> */}
      <meta
        name="viewport"
        content="minimum-scale=1, initial-scale=1, width=device-width"
      />
    </head>
    <body>
      <AppLayout>{children}</AppLayout>
    </body>
  </html>;
}
