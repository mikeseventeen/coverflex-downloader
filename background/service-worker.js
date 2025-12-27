// Service worker for Coverflex Transaction Downloader
// Manages token storage and API interception

let cachedToken = null;

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setToken') {
    cachedToken = request.token;
    chrome.storage.local.set({ authToken: request.token });
    sendResponse({ success: true });
  } else if (request.action === 'getToken') {
    getToken().then(token => sendResponse({ token }));
    return true; // Keep channel open for async response
  } else if (request.action === 'fetchOperations') {
    fetchOperations(request.fromDate, request.toDate)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Get token from cache or storage
async function getToken() {
  if (cachedToken) return cachedToken;

  const result = await chrome.storage.local.get('authToken');
  if (result.authToken) {
    cachedToken = result.authToken;
    return cachedToken;
  }

  return null;
}

// Fetch operations from Coverflex API
async function fetchOperations(fromDate, toDate) {
  const token = await getToken();

  if (!token) {
    throw new Error('No authentication token available. Please visit the Coverflex activity page first.');
  }

  const params = new URLSearchParams({
    'pagination': 'no',
    'usage': 'all',
    'filters[executed_from]': fromDate,
    'filters[executed_to]': toDate
  });

  const url = `https://menhir-api.coverflex.com/api/employee/operations?${params}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired, clear it
      cachedToken = null;
      await chrome.storage.local.remove('authToken');
      throw new Error('Authentication expired. Please log in to Coverflex and try again.');
    }
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// Intercept requests to capture auth token from Coverflex's own API calls
chrome.webRequest?.onBeforeSendHeaders?.addListener(
  (details) => {
    const authHeader = details.requestHeaders?.find(h => h.name.toLowerCase() === 'authorization');
    if (authHeader && authHeader.value.startsWith('Bearer ')) {
      const token = authHeader.value.substring(7);
      if (token !== cachedToken) {
        cachedToken = token;
        chrome.storage.local.set({ authToken: token });
      }
    }
  },
  { urls: ['https://menhir-api.coverflex.com/*'] },
  ['requestHeaders']
);
