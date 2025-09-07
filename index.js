// index.js

// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.5/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.5/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCXHQHEpxaGPay2XGBug2Et11TsZxXLAyw",
    authDomain: "royal-traders-e2b3a.firebaseapp.com",
    projectId: "royal-traders-e2b3a",
    storageBucket: "royal-traders-e2b3a.firebasestorage.app",
    messagingSenderId: "884997197767",
    appId: "1:884997197767:web:3c723b8bd065edecec53e2",
    measurementId: "G-SFY4BWJZ3L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Get references to the header elements
const userDisplay = document.getElementById('user-display');
const authLinks = document.getElementById('auth-links');
const logoutBtn = document.getElementById('logout-btn');

// Get references to the login and signup buttons within authLinks
const loginBtn = authLinks ? authLinks.querySelector('.btn-secondary') : null;
const signupBtn = authLinks ? authLinks.querySelector('.btn-primary') : null;

// Add click event listeners to the login and signup buttons
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        window.location.href = 'login.html';
    });
}

if (signupBtn) {
    signupBtn.addEventListener('click', () => {
        window.location.href = 'login.html';
    });
}

// --- START: WebSocket and Live Data Integration ---

// Get references to the live data elements
const runBtn = document.getElementById('runButton');
const runBtnText = document.getElementById('runBtnText');
const statusChip = document.getElementById('statusTag');
const livePriceElement = document.getElementById('live-price');
const digitsContainer = document.getElementById('digits-container');
const evenCountElement = document.getElementById('even-count');
const oddCountElement = document.getElementById('odd-count');

let ws = null;
let isRunning = false;
let digitCounts = { even: 0, odd: 0 };

function startWebSocket() {
    // UPDATED: Using your App ID
    ws = new WebSocket('wss://ws.deriv.com/websockets/v3?app_id=99626');
    
    ws.onopen = (event) => {
        console.log('WebSocket connection opened.');
        ws.send(JSON.stringify({ "ticks": "R_100" }));
        if (runBtn) runBtn.classList.add('running');
        if (runBtnText) runBtnText.textContent = 'Stop';
        if (statusChip) {
            statusChip.textContent = 'Running';
            statusChip.className = 'status-tag running';
        }
        isRunning = true;
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.msg_type === 'tick') {
            const price = parseFloat(data.tick.quote).toFixed(5);
            const lastDigit = parseInt(price.charAt(price.length - 1));
            const parity = lastDigit % 2 === 0 ? 'even' : 'odd';

            if (livePriceElement) livePriceElement.textContent = price;

            if (digitsContainer) {
                const digitChip = document.createElement('div');
                digitChip.className = `digit-chip ${parity}`;
                digitChip.textContent = lastDigit;
                digitsContainer.prepend(digitChip);
                if (digitsContainer.children.length > 20) {
                    digitsContainer.lastChild.remove();
                }
            }

            digitCounts[parity]++;
            if (evenCountElement) evenCountElement.textContent = digitCounts.even;
            if (oddCountElement) oddCountElement.textContent = digitCounts.odd;
        }
    };

    ws.onclose = (event) => {
        console.log('WebSocket connection closed.', event.code, event.reason);
        if (runBtn) runBtn.classList.remove('running');
        if (runBtnText) runBtnText.textContent = 'Run';
        if (statusChip) {
            statusChip.textContent = 'Not Running';
            statusChip.className = 'status-tag not-running';
        }
        isRunning = false;
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

function stopWebSocket() {
    if (ws) {
        ws.close();
        ws = null;
    }
}

if (runBtn) {
    runBtn.addEventListener('click', () => {
        if (isRunning) {
            stopWebSocket();
        } else {
            startWebSocket();
        }
    });
}

// --- END: WebSocket and Live Data Integration ---

// --- START: Dark Mode Toggle ---

const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

// Function to set the mode and save it to localStorage
function setMode(mode) {
    if (mode === 'dark') {
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
        // Update icon to sun
        darkModeToggle.querySelector('i').className = 'fa-solid fa-sun';
    } else {
        body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
        // Update icon to moon
        darkModeToggle.querySelector('i').className = 'fa-solid fa-moon';
    }
}

// Check for saved mode on page load
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    setMode(savedTheme);
} else {
    // Check for user's system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
        setMode('dark');
    } else {
        setMode('light');
    }
}

// Add click event listener to the toggle button
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        if (body.classList.contains('dark-mode')) {
            setMode('light');
        } else {
            setMode('dark');
        }
    });
}

// --- END: Dark Mode Toggle ---


// Existing Firebase and user logic
/**
 * Fetches and displays user data from Firestore.
 * @param {object} user - The Firebase Auth user object.
 */
async function displayUserData(user) {
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const email = userData.email;
        const initials = email ? email.charAt(0).toUpperCase() : '';
        document.getElementById('user-initials').textContent = initials;

        const countryCode = userData.country;
        if (countryCode) {
            const flagUrl = `https://www.countryflagicons.com/FLAT/64x64/${countryCode}.png`;
            document.getElementById('country-flag').src = flagUrl;
        }

        const balance = userData.balance ? userData.balance.toFixed(2) : '0.00';
        document.getElementById('user-balance').textContent = `$${balance}`;

    } else {
        console.log("No user data found!");
        signOut(auth);
    }
}

// Listen for authentication state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        userDisplay.style.display = 'flex';
        authLinks.style.display = 'none';
        displayUserData(user);
    } else {
        userDisplay.style.display = 'none';
        authLinks.style.display = 'flex';
    }
});

// Add logout event listener
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error("Error signing out: ", error);
        });
    });
}