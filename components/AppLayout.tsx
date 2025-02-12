'use client';

import { theme } from '@/theme';
import { Anchor, AppShell, Burger, Button, Group, MantineProvider, NavLink, rem, Stack, Tabs } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AppLayout({ children }: { children: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const [opened, { close, toggle }] = useDisclosure();
  
  const links = [
    {
      href: '/live',
      label: 'Live Alerts',
    },
    {
      href: '/find',
      label: 'Find a Spot',
    },
    {
      href: '/manage',
      label: 'Manage Lot',
    },
    {
      href: '/people',
      label: 'Manage People',
    },
    {
      href: '/account',
      label: 'Account',
    },
  ];
  
  return <MantineProvider
    cssVariablesResolver={(theme) => ({
      variables: {
        '--app-shell-header-z-index': '1100',
        '--mantine-z-index-app': '1100',
        '--mantine-z-index-modal': '1200',
        '--mantine-z-index-popover': '1300',
        '--mantine-z-index-overlay': '1400',
        '--overlay-z-index': '1400',
      },
      light: {},
      dark: {},
    })}
    defaultColorScheme="dark"
    theme={theme}
  >
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { desktop: true, mobile: !opened } }}
      padding="md"
      zIndex={1100}
    >
      <AppShell.Header>
        <Group
          h="100%"
          justify="space-between"
          px="sm"
        >
          <Group gap={0}>
            <Burger
              hiddenFrom="sm"
              onClick={toggle}
              opened={opened}
              size="md"
            />
            <Anchor
              c="white"
              component={Link}
              href="/"
              ml={rem(8)}
              onClick={close}
            >
              Lot Protector
            </Anchor>
          </Group>
          
          <Group
            align="end"
            gap={0}
            h="100%"
            visibleFrom="sm"
          >
            <Tabs
              onChange={(value) => router.push(`/${value}`)}
              value={pathname.slice(1)}
            >
              <Tabs.List>
                {links.map((link) => <Tabs.Tab
                  key={link.href}
                  onClick={close}
                  value={link.href.slice(1)}
                >{link.label}</Tabs.Tab>)}
              </Tabs.List>
            </Tabs>
          </Group>
          
          <Group gap="sm">
            {/* <Button
              component={Link}
              href="/signin"
              onClick={close}
              variant="outline"
            >
              Sign In
            </Button>
            <Button
              component={Link}
              href="/signup"
              onClick={close}
            >
              Sign Up
            </Button> */}
            <Button
              onClick={close}
              variant="outline"
            >
              Sign Out
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <Stack gap={0}>
          {links.map((link) => <NavLink
            active={pathname.startsWith(link.href)}
            component={Link}
            href={link.href}
            key={link.href}
            label={link.label}
            onClick={close}
          />)}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  </MantineProvider>;
}