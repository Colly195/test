// websocket.js
const app_id = 1089; // Your Deriv App ID. You must register an app on Deriv's platform to get this.
const ws_url = `wss://ws.binaryws.com/websockets/v3?app_id=${app_id}`;
let connection = null;

function connectWebSocket() {
    return new Promise((resolve, reject) => {
        if (connection) {
            resolve(connection);
            return;
        }

        connection = new WebSocket(ws_url);

        connection.onopen = () => {
            console.log('WebSocket connected successfully.');
            resolve(connection);
        };

        connection.onclose = () => {
            console.log('WebSocket connection closed.');
            connection = null; // Reset connection on close
        };

        connection.onerror = (error) => {
            console.error('WebSocket error:', error);
            reject(error);
        };
    });
}

function sendRequest(request) {
    return new Promise((resolve, reject) => {
        connectWebSocket().then(ws => {
            const requestData = JSON.stringify(request);
            ws.send(requestData);

            ws.onmessage = (msg) => {
                const response = JSON.parse(msg.data);
                if (response.msg_type === request.msg_type) {
                    resolve(response);
                }
            };

            ws.onerror = (error) => {
                reject(error);
            };
        }).catch(err => {
            reject(err);
        });
    });
}

export { connectWebSocket, sendRequest };