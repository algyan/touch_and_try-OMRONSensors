'use strict';

const noble = require('noble');
const clientFromConnectionString
  = require('azure-iot-device-mqtt').clientFromConnectionString;
const Message = require('azure-iot-device').Message;

const connectionString = process.env.CS;
const deviceId = process.env.ID;

let   isAzureIoTConnected = false;
let   latestSequenceNumber = 0;

// Handle device connection to Azure IoT Central.
const connectCallback = (err) => {
  if (err) {
    console.log(`Device could not connect to Azure IoT Central: 
    ${err.toString()}`);
  } else {
    console.log('Device successfully connected to Azure IoT Central');
    isAzureIoTConnected = true;
  }
};

// Start the device (connect it to Azure IoT Central).
const client = clientFromConnectionString(connectionString);
client.open(connectCallback);

noble.on('stateChange', (state) => {
  if (state === 'poweredOn') {
    noble.startScanning([], true);
  } else {
    noble.stopScanning();
  }
});

noble.on('discover', (peripheral) => {
  const address = peripheral.address;

  if (address == deviceId) {
    const advertisement = peripheral.advertisement;
    const manufacturerData = advertisement.manufacturerData;
    const companyId = manufacturerData.readUInt16LE(0);
    const dataType  = manufacturerData.readUInt8(2);

    if(companyId != 0x02d5 || dataType != 1) return;

    const sequenceNumber  = manufacturerData.readUInt8(3);
    if(sequenceNumber == latestSequenceNumber) return;
    const sensorData = formatData(manufacturerData);

    prettyPrintSensorData(sequenceNumber, sensorData);

    if(isAzureIoTConnected) {
      const sound = sensorData.soundNoise.value / 10 ** sensorData.soundNoise.digit;
      sendTelemetry(sound, client);
    }

    latestSequenceNumber = sequenceNumber;
  }
});

const formatData = (data) => {
  const result = {
    'temperature': {
        'value': data.readInt16LE(4),
        'unit' : 'degC',
        'digit': 2,
    },
    'relativeHumidity': {
        'value': data.readInt16LE(6),
        'unit' : '%RH',
        'digit': 2,
    },
    'ambientLight': {
        'value': data.readInt16LE(8),
        'unit' : 'lx',
        'digit': 0,
    },
    'barometricPressure': {
        'value': data.readInt32LE(10),
        'unit' : 'hPa',
        'digit': 3,
    },
    'soundNoise': {
        'value': data.readInt16LE(14),
        'unit' : 'dB',
        'digit': 2,
    },
    'eTVOC': {
        'value': data.readInt16LE(16),
        'unit' : 'ppb',
        'digit': 0,
    },
    'eCO2': {
        'value': data.readInt16LE(18),
        'unit' : 'ppm',
        'digit': 0,
    },
  };
  return result;
}

const prettyPrintSensorData = (sequence, data) => {

    const r = Object.keys(data).map((item) => {
      const rawValue = data[item].value;
      const unit     = data[item].unit;
      const digit    = data[item].digit;
      const value    = rawValue / 10 ** digit;

      const result = item.padEnd(20, ' ') + ': ' + value.toString(10).padStart(8, ' ') + ' ' + unit;    
      return result;
    });

    console.log(`\n-----\nsequece             : ${sequence.toString(10).padStart(8, ' ')}`);

    r.map((item) => {console.log(item)});

};


const sendTelemetry = (sound, client) => {
  const data = JSON.stringify({
    sound: sound,
  });

  const message = new Message(data);

  client.sendEvent(message, (err, res) =>
    console.log(`Sent message: ${message.getData()}` +
      (err ? `; error: ${err.toString()}` : '') +
      (res ? `; status: ${res.constructor.name}` : '')));
}

