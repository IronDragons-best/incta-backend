#!/usr/bin/env node
import { io } from 'socket.io-client';
import readline from 'readline';

// Твой JWT токен
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzYwMzUyNDA2LCJleHAiOjE3NjAzNTU5NDZ9.2XnLFPtzABI6mUuVFKXzlZec8ti-tbUX7xuhm3mLZg0';

// URL твоего Gateway (namespace)
const URL = 'http://localhost:3000/notifications';

const socket = io(URL, {
  extraHeaders: {
    Cookie: `accessToken=${token}`,
  },
  withCredentials: true,
});

socket.on('connect', () => {
  console.log('✅ Connected to WS, socket id:', socket.id);
});

socket.on('connected', (msg) => {
  console.log('ℹ️ Server message:', msg);
});

socket.on('notification', (data) => {
  console.log('🔔 Notification:', data);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

// Простая команда для ручной отправки тестовых сообщений
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on('line', (input) => {
  socket.emit('test', input);
});
