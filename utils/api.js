// API utilities for Coverflex Transaction Downloader

const API_BASE = 'https://menhir-api.coverflex.com/api/employee';
const TOKEN_KEY = 'cvrflx_flightdeck_token';

// Get token from localStorage (content script context)
export function getTokenFromLocalStorage() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    return token;
  } catch (e) {
    console.error('Failed to read token from localStorage:', e);
    return null;
  }
}

// Send token to service worker for storage
export async function sendTokenToBackground(token) {
  return chrome.runtime.sendMessage({ action: 'setToken', token });
}

// Request token from service worker
export async function getTokenFromBackground() {
  const response = await chrome.runtime.sendMessage({ action: 'getToken' });
  return response?.token;
}

// Fetch operations via service worker
export async function fetchOperations(fromDate, toDate) {
  const response = await chrome.runtime.sendMessage({
    action: 'fetchOperations',
    fromDate,
    toDate
  });

  if (!response.success) {
    throw new Error(response.error);
  }

  return response.data;
}

// Get date range for current year
export function getCurrentYearRange() {
  const year = new Date().getFullYear();
  return {
    from: `${year - 1}-12-31T23:00:00.000Z`,
    to: `${year}-12-31T22:59:59.999Z`
  };
}

// Get date range for specific year
export function getYearRange(year) {
  return {
    from: `${year - 1}-12-31T23:00:00.000Z`,
    to: `${year}-12-31T22:59:59.999Z`
  };
}

// Convert date inputs to API format
export function formatDateRange(fromDateStr, toDateStr) {
  const from = new Date(fromDateStr);
  from.setHours(0, 0, 0, 0);

  const to = new Date(toDateStr);
  to.setHours(23, 59, 59, 999);

  return {
    from: from.toISOString(),
    to: to.toISOString()
  };
}
