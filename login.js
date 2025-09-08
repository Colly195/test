// login.js

// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.5/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.6.5/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.5/firebase-firestore.js";

// Your web app's Firebase configuration
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

// Function to save user data to Firestore
async function saveUserData(user, countryCode) {
    const userRef = doc(db, 'users', user.uid);
    const data = {
        email: user.email,
        country: countryCode || 'KE',
        balance: 1000.00
    };
    await setDoc(userRef, data, { merge: true });
}

// Function to populate countries, this can be an async function
async function populateCountries() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,flag');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const countries = await response.json();
        const sorted = countries.sort((a, b) => a.name.common.localeCompare(b.name.common));
        const signupCountrySelect = $("#signup-country");
        sorted.forEach(country => {
            const option = new Option(`${country.flag} ${country.name.common}`, country.cca2);
            signupCountrySelect.append(option);
        });
        signupCountrySelect.select2({
            placeholder: "Select your country",
            allowClear: true
        });
    } catch (err) {
        console.error("Country fetch failed:", err);
        $("#signup-country").append(new Option("🇰🇪 Kenya", "KE"));
        $("#signup-country").select2();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const signinSection = document.getElementById('signin-section');
    const signupSection = document.getElementById('signup-section');
    const showSignupLink = document.getElementById('show-signup');
    const showSigninLink = document.getElementById('show-signin');
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const signinErrorMessage = document.getElementById('signin-error-message');
    const signupErrorMessage = document.getElementById('signup-error-message');
    const googleSignInBtn = document.getElementById('google-signin-btn');
    const signupCountrySelect = $("#signup-country");

    populateCountries();

    // --- CHECK URL PARAMETER ON PAGE LOAD ---
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('form') === 'signup') {
        if (signinSection && signupSection) {
            signinSection.style.display = 'none';
            signupSection.style.display = 'block';
        }
    }

    // --- Form Toggling Logic for links on the page ---
    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (signinSection && signupSection) {
                signinSection.style.display = 'none';
                signupSection.style.display = 'block';
                signinErrorMessage.textContent = "";
            }
        });
    }

    if (showSigninLink) {
        showSigninLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (signupSection && signinSection) {
                signupSection.style.display = 'none';
                signinSection.style.display = 'block';
                signupErrorMessage.textContent = "";
            }
        });
    }

    // --- Firebase Auth Logic ---
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = signupForm['signup-email'].value;
            const password = signupForm['signup-password'].value;
            const country = signupCountrySelect.val();

            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    return saveUserData(userCredential.user, country);
                })
                .then(() => {
                    alert('Account created successfully!');
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    if (signupErrorMessage) {
                        signupErrorMessage.textContent = error.message;
                    }
                });
        });
    }

    if (signinForm) {
        signinForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = signinForm['signin-email'].value;
            const password = signinForm['signin-password'].value;

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // This function is still needed to update user's last sign-in data
                    return saveUserData(userCredential.user, null);
                })
                .then(() => {
                    alert('Successfully signed in!');
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    if (signinErrorMessage) {
                        signinErrorMessage.textContent = error.message;
                    }
                });
        });
    }

    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', () => {
            const provider = new GoogleAuthProvider();

            signInWithPopup(auth, provider)
                .then((result) => {
                    return saveUserData(result.user, null);
                }).then(() => {
                    alert('Successfully signed in with Google!');
                    window.location.href = 'index.html';
                }).catch((error) => {
                    if (signinErrorMessage) {
                        signinErrorMessage.textContent = error.message;
                    }
                });
        });
    }
});