document.addEventListener('DOMContentLoaded', () => {
    // Public App ID, does not require a personal API token.
    const APP_ID = '99626'; 
    const API_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`; 

    const assetSelect = document.getElementById('asset-select');
    const chartCanvas = document.getElementById('price-chart');
    let priceChart;
    let ws = null;
    let activeSymbol = 'R_100'; // Default to a reliable, 24/7 market

    // Function to create and initialize the chart
    const initializeChart = (labels, data) => {
        if (priceChart) {
            priceChart.destroy();
        }
        priceChart = new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Price',
                    data: data,
                    borderColor: '#6a1b9a',
                    backgroundColor: 'rgba(106, 27, 154, 0.2)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'second',
                            tooltipFormat: 'HH:mm:ss',
                            displayFormats: {
                                second: 'HH:mm:ss'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Price'
                        }
                    }
                }
            }
        });
    };

    // Function to update the chart with new data
    const updateChart = (time, price) => {
        if (priceChart) {
            priceChart.data.labels.push(new Date(time * 1000));
            priceChart.data.datasets[0].data.push(price);

            const maxDataPoints = 100;
            if (priceChart.data.labels.length > maxDataPoints) {
                priceChart.data.labels.shift();
                priceChart.data.datasets[0].data.shift();
            }

            priceChart.update();
        }
    };

    // WebSocket connection and message handling
    const connectToAPI = () => {
        if (ws) {
            ws.close();
        }
        ws = new WebSocket(API_URL);

        ws.onopen = () => {
            console.log('WebSocket connected to Deriv API.');
            // Request the list of active symbols immediately, since authorization is not needed.
            ws.send(JSON.stringify({ active_symbols: 'brief', product_type: 'basic' }));
        };

        ws.onmessage = (msg) => {
            const data = JSON.parse(msg.data);
            if (data.error) {
                console.error('API Error:', data.error.message);
                if (data.error.code === 'MarketIsClosed') {
                    // Alert and switch to a valid market if the selected one is closed
                    alert(`The selected market is closed. Switching to Volatility 100 Index.`);
                    activeSymbol = 'R_100';
                    assetSelect.value = activeSymbol;
                    requestChartData(activeSymbol);
                }
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

    const handleAPIResponse = (data) => {
        if (data.msg_type === 'active_symbols' && data.active_symbols) {
            // Populate the dropdown with available symbols
            populateAssetSelect(data.active_symbols);
            // Request data for the initially selected symbol
            requestChartData(activeSymbol);
        } else if (data.msg_type === 'history' && data.history) {
            // Use historical data to initialize the chart
            const prices = data.history.prices;
            const times = data.history.times.map(t => new Date(t * 1000));
            initializeChart(times, prices);
            // After getting historical data, subscribe to real-time ticks
            ws.send(JSON.stringify({ ticks: activeSymbol, subscribe: 1 }));
        } else if (data.msg_type === 'tick' && data.tick) {
            // Update the chart with each new real-time tick
            updateChart(data.tick.epoch, data.tick.ask);
        }
    };

    const populateAssetSelect = (symbols) => {
        assetSelect.innerHTML = '';
        const syntheticSymbols = symbols.filter(s => s.market === 'synthetic_index');
        const otherSymbols = symbols.filter(s => s.market !== 'synthetic_index');
        const allSymbols = [...syntheticSymbols, ...otherSymbols];

        allSymbols.forEach(symbol => {
            const option = document.createElement('option');
            option.value = symbol.symbol;
            option.textContent = symbol.display_name;
            assetSelect.appendChild(option);
        });
        
        // Ensure the default symbol is selected
        assetSelect.value = activeSymbol;
    };

    const requestChartData = (symbol) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            // Forget previous subscriptions to avoid duplicate streams
            ws.send(JSON.stringify({ forget_all: 'ticks' }));
            // Request historical data and subscribe to ticks in a single call
            ws.send(JSON.stringify({
                ticks_history: symbol,
                end: 'latest',
                count: 100, // Number of historical ticks to fetch
                subscribe: 1 // Keep receiving live ticks
            }));
        }
    };

    // Event listener for asset selection change
    assetSelect.addEventListener('change', (e) => {
        activeSymbol = e.target.value;
        requestChartData(activeSymbol);
    });

    // Start the process by connecting to the API
    connectToAPI();
});