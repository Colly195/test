// digit-analysis.js
import { connectWebSocket } from './websocket.js';

// Get DOM elements
const latestPriceElement = document.getElementById('latestPrice');
const digitStreamElement = document.getElementById('digitStream');
const volatilityIndexSelect = document.getElementById('volatilityIndex');
const numDigitsInput = document.getElementById('numDigits');
const chartCanvas = document.getElementById('digitDistributionChart');

let digitHistory = [];
const MAX_DIGITS = 60;
let chartInstance = null;
let activeSymbol = volatilityIndexSelect.value;
let ws = null;

// Function to update the digit stream display
function updateDigitStream(digit) {
    const digitElement = document.createElement('span');
    const isEven = digit % 2 === 0;
    digitElement.className = `digit-dot ${isEven ? 'even' : 'odd'}`;
    digitElement.textContent = isEven ? 'E' : 'O';

    digitStreamElement.prepend(digitElement);

    if (digitStreamElement.children.length > MAX_DIGITS) {
        digitStreamElement.removeChild(digitStreamElement.lastChild);
    }
}

// Function to update the chart with the latest digit distribution
function updateChart() {
    const evenCount = digitHistory.filter(d => d % 2 === 0).length;
    const oddCount = digitHistory.length - evenCount;
    const totalDigits = digitHistory.length;

    const evenPercentage = totalDigits > 0 ? ((evenCount / totalDigits) * 100).toFixed(2) : 0;
    const oddPercentage = totalDigits > 0 ? ((oddCount / totalDigits) * 100).toFixed(2) : 0;

    const data = {
        labels: ['Even', 'Odd'],
        datasets: [{
            label: 'Percentage',
            data: [evenPercentage, oddPercentage],
            backgroundColor: [
                'rgba(0, 255, 0, 1)', // Green for Even
                'rgba(255, 0, 0, 1)'  // Red for Odd
            ],
            borderColor: [
                'rgba(0, 255, 0, 1)',
                'rgba(255, 0, 0, 1)'
            ],
            borderWidth: 1
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'Percentage'
                },
                ticks: {
                    color: '#f1f1f1'
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#f1f1f1'
                }
            }
        },
        plugins: {
            legend: {
                display: true,
                labels: {
                    color: '#f1f1f1'
                }
            },
            datalabels: {
                anchor: 'end',
                align: 'end',
                formatter: (value, context) => {
                    return value + '%';
                },
                color: '#f1f1f1'
            }
        }
    };

    if (chartInstance) {
        chartInstance.data = data;
        chartInstance.update();
    } else {
        chartInstance = new Chart(chartCanvas, {
            type: 'bar',
            data: data,
            options: options,
            plugins: [ChartDataLabels]
        });
    }
}

// Function to handle incoming real-time ticks
function handleTick(tick) {
    const latestPrice = tick.quote;
    const lastDigit = parseInt(latestPrice.slice(-1));

    // Update the latest price display
    latestPriceElement.textContent = latestPrice;

    // Update the digit history
    digitHistory.unshift(lastDigit);
    if (digitHistory.length > MAX_DIGITS) {
        digitHistory.pop();
    }
    
    // Update the UI
    updateDigitStream(lastDigit);
    updateChart();
}

// Function to subscribe to a new symbol's ticks
async function subscribeToTicks(symbol) {
    if (ws) {
        ws.close();
    }

    try {
        ws = await connectWebSocket();
        const request = {
            "ticks": symbol,
            "subscribe": 1
        };
        ws.send(JSON.stringify(request));

        ws.onmessage = (msg) => {
            const response = JSON.parse(msg.data);
            if (response.msg_type === 'tick') {
                handleTick(response.tick);
            }
        };

        ws.onclose = () => {
            console.log("WebSocket connection closed. Retrying in 5 seconds...");
            setTimeout(() => subscribeToTicks(activeSymbol), 5000);
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };
    } catch (error) {
        console.error("Failed to establish WebSocket connection:", error);
    }
}

// Event listeners for UI controls
volatilityIndexSelect.addEventListener('change', (e) => {
    activeSymbol = e.target.value;
    digitHistory = []; // Reset history when symbol changes
    digitStreamElement.innerHTML = ''; // Clear display
    subscribeToTicks(activeSymbol);
});

numDigitsInput.addEventListener('change', (e) => {
    MAX_DIGITS = parseInt(e.target.value);
    // Trim history if the new max is smaller
    if (digitHistory.length > MAX_DIGITS) {
        digitHistory = digitHistory.slice(0, MAX_DIGITS);
    }
    // Update UI
    updateDigitStream();
    updateChart();
});

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    subscribeToTicks(activeSymbol);
});