'use strict';

const clientFromConnectionString
  = require('azure-iot-device-mqtt').clientFromConnectionString;
const Message = require('azure-iot-device').Message;

const connectionString = process.env.CS;

const targetSound = 50;
const client = clientFromConnectionString(connectionString);

// Send device measurements.
function sendTelemetry() {
  const sound = targetSound + (Math.random() * 15);
  const data = JSON.stringify({
    sound: sound,
  });
  const message = new Message(data);
  client.sendEvent(message, (err, res) =>
    console.log(`Sent message: ${message.getData()}` +
      (err ? `; error: ${err.toString()}` : '') +
      (res ? `; status: ${res.constructor.name}` : '')));
}

// Handle device connection to Azure IoT Central.
const connectCallback = (err) => {
  if (err) {
    console.log(`Device could not connect to Azure IoT Central: 
    ${err.toString()}`);
  } else {
    console.log('Device successfully connected to Azure IoT Central');

    // Send telemetry measurements to Azure IoT Central every 1 second.
    setInterval(sendTelemetry, 1000);
  }
};

// Start the device (connect it to Azure IoT Central).
client.open(connectCallback);
