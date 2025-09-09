const APP_ID = '99973'; // Replace with your Deriv app ID if needed

document.addEventListener('DOMContentLoaded', () => {
    const authLinksContainer = document.getElementById('auth-links');
    const userDisplayContainer = document.getElementById('user-display');
    const userInitials = document.getElementById('user-initials');
    const userBalance = document.getElementById('user-balance');
    const logoutBtn = document.getElementById('logout-btn');
    const derivAuthBtn = document.getElementById('deriv-auth-btn');

    // Initialize UI based on login state
    function updateUIForLoginState(isLoggedIn) {
        console.log('Updating UI for login state:', isLoggedIn);
        if (isLoggedIn) {
            if (authLinksContainer) authLinksContainer.classList.add('hidden');
            if (userDisplayContainer) {
                userDisplayContainer.classList.remove('hidden');
                userInitials.textContent = 'RT'; // Replace with actual initials if available
                fetchBalance();
            }
        } else {
            if (authLinksContainer) authLinksContainer.classList.remove('hidden');
            if (userDisplayContainer) {
                userDisplayContainer.classList.add('hidden');
                userBalance.textContent = '$0.00';
            }
        }
    }

    // Fetch balance from Deriv API
    function fetchBalance() {
        const token = sessionStorage.getItem('deriv_token');
        console.log('Fetching balance with token:', token ? 'Token present' : 'No token');
        if (!token) {
            console.warn('No token found for balance fetch');
            updateUIForLoginState(false);
            return;
        }
        const wsBalance = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
        wsBalance.onopen = () => {
            console.log('Balance WebSocket opened');
            wsBalance.send(JSON.stringify({ authorize: token }));
        };
        wsBalance.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            console.log('Balance WebSocket message:', data);
            if (data.msg_type === 'authorize' && !data.error) {
                wsBalance.send(JSON.stringify({ balance: 1, subscribe: 1 }));
            } else if (data.msg_type === 'balance') {
                userBalance.textContent = `$${data.balance.balance.toFixed(2)}`;
            } else if (data.error) {
                console.error('Balance fetch error:', data.error.message);
                sessionStorage.removeItem('deriv_token');
                updateUIForLoginState(false);
                alert('Authentication failed: ' + data.error.message + '. Please log in again.');
            }
        };
        wsBalance.onerror = () => {
            console.error('Balance WebSocket error');
            wsBalance.close();
        };
    }

    // Handle login button click
    if (derivAuthBtn) {
        derivAuthBtn.addEventListener('click', () => {
            console.log('Initiating Deriv OAuth login...');
            const oauthUrl = `https://oauth.deriv.com/oauth2/authorize?app_id=${APP_ID}&l=en&brand=deriv`;
            window.location.href = oauthUrl;
        });
    }

    // Handle logout button click
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            console.log('Logging out...');
            sessionStorage.removeItem('deriv_token');
            updateUIForLoginState(false);
            window.location.reload();
        });
    }

    // Check for token from OAuth redirect
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    console.log('URL Token:', token);
    if (token) {
        console.log('Saving token to sessionStorage');
        sessionStorage.setItem('deriv_token', token);
        updateUIForLoginState(true);
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        const storedToken = sessionStorage.getItem('deriv_token');
        console.log('Stored Token:', storedToken);
        updateUIForLoginState(!!storedToken);
    }
});
