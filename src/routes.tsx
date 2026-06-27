import React from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import WalletsPage from './pages/WalletsPage';
import SendMoneyPage from './pages/SendMoneyPage';
import ReceiveMoneyPage from './pages/ReceiveMoneyPage';
import VirtualCardPage from './pages/VirtualCardPage';
import CardPaymentPage from './pages/CardPaymentPage';
import SavingsPage from './pages/SavingsPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AdminPanel from './pages/AdminPanel';
import type { ReactNode } from 'react';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  public?: boolean;
}

export const routes: RouteConfig[] = [
  { name: 'Landing', path: '/', element: <LandingPage />, public: true },
  { name: 'Login', path: '/login', element: <LoginPage />, public: true },
  { name: 'Register', path: '/register', element: <RegisterPage />, public: true },
  { name: 'Dashboard', path: '/dashboard', element: <DashboardPage /> },
  { name: 'Wallets', path: '/wallets', element: <WalletsPage /> },
  { name: 'Send Money', path: '/send', element: <SendMoneyPage /> },
  { name: 'Receive Money', path: '/receive', element: <ReceiveMoneyPage /> },
  { name: 'Virtual Card', path: '/card', element: <VirtualCardPage /> },
  { name: 'Card Payment', path: '/card-payment', element: <CardPaymentPage /> },
  { name: 'Savings', path: '/savings', element: <SavingsPage /> },
  { name: 'Transactions', path: '/transactions', element: <TransactionHistoryPage /> },
  { name: 'Notifications', path: '/notifications', element: <NotificationsPage /> },
  { name: 'Profile', path: '/profile', element: <ProfilePage /> },
  { name: 'Settings', path: '/settings', element: <SettingsPage /> },
  { name: 'Admin Panel', path: '/admin', element: <AdminPanel />, public: true },
];
