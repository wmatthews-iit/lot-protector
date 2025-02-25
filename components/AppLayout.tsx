'use client';

import { auth } from '@/lib/firebase/app';
import { useUser } from '@/lib/firebase/useUser';
import { theme } from '@/theme';
import { Anchor, AppShell, Burger, Button, Group, MantineProvider, NavLink, rem, Stack, Tabs, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { signOut } from 'firebase/auth';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AppLayout({ children }: { children: any }) {
  const user = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [opened, { close, toggle }] = useDisclosure();
  
  const links = [
    {
      href: '/live',
      label: 'Live Alerts',
      requiresManager: true,
    },
    {
      href: '/find',
      label: 'Find a Spot',
    },
    {
      href: '/manage',
      label: 'Manage Lot',
      requiresManager: true,
    },
    {
      href: '/people',
      label: 'Manage People',
      requiresManager: true,
    },
    {
      href: '/account',
      label: 'Account',
    },
  ];
  
  const signOutRedirect = async () => {
    try {
      await signOut(auth);
      if (pathname.length > 1) router.push('/signin');
    } catch (error) {
      console.log(error);
    }
  };
  
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
              display={typeof(user) !== 'string' ? 'block' : 'none'}
              onChange={(value) => router.push(`/${value}`)}
              value={pathname.slice(1)}
            >
              <Tabs.List>
                {links.filter((link) => !link.requiresManager || user && typeof(user) !== 'string' && user.role === 1)
                  .map((link) => <Tabs.Tab
                    key={link.href}
                    onClick={close}
                    value={link.href.slice(1)}
                  >{link.label}</Tabs.Tab>)}
              </Tabs.List>
            </Tabs>
          </Group>
          
          <Group
            display={typeof(user) !== 'string' ? 'none' : 'flex'}
            gap="sm"
          >
            <Button
              component={Link}
              display={pathname.startsWith('/signin') ? 'none' : 'block'}
              href="/signin"
              onClick={close}
              variant="outline"
            >
              Sign In
            </Button>
            <Button
              component={Link}
              display={pathname.startsWith('/signup') ? 'none' : 'block'}
              href="/signup"
              onClick={close}
              variant={pathname.startsWith('/signin') ? 'outline' : 'filled'}
            >
              Sign Up
            </Button>
          </Group>
          <Group
            display={typeof(user) !== 'string' ? 'flex' : 'none'}
            gap="sm"
          >
            <Button
              onClick={signOutRedirect}
              variant="outline"
            >
              Sign Out
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <Stack
          display={typeof(user) !== 'string' ? 'flex' : 'none'}
          gap={0}
        >
          {links.filter((link) => !link.requiresManager || user && typeof(user) !== 'string' && user.role === 1)
            .map((link) => <NavLink
              active={pathname.startsWith(link.href)}
              component={Link}
              href={link.href}
              key={link.href}
              label={link.label}
              onClick={close}
            />)}
        </Stack>
        <Text
          display={typeof(user) !== 'string' ? 'none' : 'block'}
          p="md"
        >
          <Anchor
            component={Link}
            href="/signin"
            onClick={close}
          >Sign in</Anchor> or&nbsp;
          <Anchor
            component={Link}
            href="/signup"
            onClick={close}
          >sign up</Anchor> to use this app
        </Text>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  </MantineProvider>;
}