document.addEventListener('DOMContentLoaded', () => {
    // Replace with your actual Deriv API token and WebSocket URL
    const API_TOKEN = 'YOUR_DERIV_API_TOKEN';
    const API_URL = 'wss://ws.derivws.com/websockets/v3?app_id=1089';

    const marketSelect = document.getElementById('marketSelect');
    const tickCountSelect = document.getElementById('tickCount');
    const currentPriceElement = document.getElementById('currentPrice');
    const digitCirclesContainer = document.getElementById('digitCircles');

    // Analysis display elements
    const overPercentageBar = document.getElementById('overPercentage');
    const underPercentageBar = document.getElementById('underPercentage');
    const overHistoryList = document.getElementById('overHistory');
    const underHistoryList = document.getElementById('underHistory');

    const matchesPercentageBar = document.getElementById('matchesPercentage');
    const differsPercentageBar = document.getElementById('differsPercentage');
    const matchesHistoryList = document.getElementById('matchesHistory');
    const differsHistoryList = document.getElementById('differsHistory');

    const evenPercentageBar = document.getElementById('evenPercentage');
    const oddPercentageBar = document.getElementById('oddPercentage');
    const evenHistoryList = document.getElementById('evenHistory');
    const oddHistoryList = document.getElementById('oddHistory');

    const risePercentageBar = document.getElementById('risePercentage');
    const fallPercentageBar = document.getElementById('fallPercentage');
    const riseHistoryList = document.getElementById('riseHistory');
    const fallHistoryList = document.getElementById('fallHistory');

    let ws = null;
    let tickHistory = [];
    let activeSymbol = marketSelect.value;
    let activeTickCount = parseInt(tickCountSelect.value);

    // Function to initialize WebSocket connection
    const connectToAPI = () => {
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
            ws.close();
        }

        ws = new WebSocket(API_URL);

        ws.onopen = () => {
            console.log('WebSocket connected to Deriv API.');
            // Authorize and get active symbols
            ws.send(JSON.stringify({ authorize: API_TOKEN }));
            ws.send(JSON.stringify({ active_symbols: 'brief', product_type: 'multi-barrier' }));
        };

        ws.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            if (data.error) {
                console.error('API Error:', data.error.message);
                return;
            }
            handleAPIResponse(data);
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected.');
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };
    };

    // Handle incoming API data
    const handleAPIResponse = (data) => {
        if (data.msg_type === 'authorize' && data.authorize) {
            console.log('Authorization successful. Account ID:', data.authorize.loginid);
            // Once authorized, request initial tick history
            requestTickHistory(activeSymbol, activeTickCount);
        } else if (data.msg_type === 'active_symbols' && data.active_symbols) {
            // Populate market select dropdown with active symbols
            marketSelect.innerHTML = data.active_symbols
                .map(symbol => `<option value="${symbol.symbol}">${symbol.display_name}</option>`)
                .join('');
            // Set the active symbol after populating
            activeSymbol = marketSelect.value;
        } else if (data.msg_type === 'history' && data.history) {
            tickHistory = data.history.prices;
            // Subscribe to real-time ticks
            ws.send(JSON.stringify({ ticks: activeSymbol, subscribe: 1 }));
            updateAllAnalyses();
        } else if (data.msg_type === 'tick' && data.tick) {
            // Add new tick to history and remove oldest
            const newPrice = parseFloat(data.tick.ask);
            const prevPrice = tickHistory[tickHistory.length - 1];

            tickHistory.push(newPrice);
            if (tickHistory.length > activeTickCount) {
                tickHistory.shift();
            }

            // Update price and last digit display
            currentPriceElement.textContent = newPrice.toFixed(2);
            updateAllAnalyses(prevPrice, newPrice);
        }
    };

    // Request historical tick data from Deriv API
    const requestTickHistory = (symbol, count) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            // Unsubscribe from any previous tick subscriptions
            ws.send(JSON.stringify({ forget_all: 'ticks' }));
            // Request a new history
            ws.send(JSON.stringify({
                ticks_history: symbol,
                end: 'latest',
                count: count,
                subscribe: 1
            }));
        }
    };

    // Update all analysis sections
    const updateAllAnalyses = (prevPrice, newPrice) => {
        const lastDigits = tickHistory.map(price => parseInt(price.toString().slice(-1)));
        
        updateDigitCircles(lastDigits);
        updateOverUnderAnalysis(lastDigits);
        updateMatchesDiffersAnalysis(lastDigits);
        updateEvenOddAnalysis(lastDigits);
        updateRiseFallAnalysis(prevPrice, newPrice);
    };

    // Update UI functions for each analysis type
    const updateDigitCircles = (lastDigits) => {
        const counts = new Array(10).fill(0);
        lastDigits.forEach(digit => {
            if (digit >= 0 && digit <= 9) {
                counts[digit]++;
            }
        });
        
        const total = lastDigits.length;
        digitCirclesContainer.innerHTML = '';
        for (let i = 0; i <= 9; i++) {
            const percentage = total > 0 ? ((counts[i] / total) * 100).toFixed(2) : '0.00';
            const circle = document.createElement('div');
            circle.classList.add('digit-circle');
            circle.style.backgroundColor = getDigitColor(i);
            circle.innerHTML = `
                ${i}
                <span>${percentage}%</span>
            `;
            digitCirclesContainer.appendChild(circle);
        }
    };

    const updateOverUnderAnalysis = (lastDigits) => {
        // Implementation based on logic and provided images
        // This will require more context to be fully functional
    };
    
    // ... (Similar functions for Matches/Differs, Even/Odd, Rise/Fall)

    // Helper function for digit colors
    const getDigitColor = (digit) => {
        // Example logic for colors based on the images
        if (digit === 4) return '#81c784';
        if (digit === 5) return '#e57373';
        return '#37474f';
    };

    // Event listeners for user input
    marketSelect.addEventListener('change', (e) => {
        activeSymbol = e.target.value;
        requestTickHistory(activeSymbol, activeTickCount);
    });

    tickCountSelect.addEventListener('change', (e) => {
        activeTickCount = parseInt(e.target.value);
        requestTickHistory(activeSymbol, activeTickCount);
    });

    // Initial connection
    connectToAPI();
});