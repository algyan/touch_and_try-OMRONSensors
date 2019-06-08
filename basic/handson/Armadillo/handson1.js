'use strict';

const noble = require('noble');

noble.on('stateChange', (state) => {
  if (state === 'poweredOn') {
    noble.startScanning();
  } else {
    noble.stopScanning();
  }
});

noble.on('discover', (peripheral) => {
  const address = peripheral.address;
  const rssi = peripheral.rssi;
  const localName = peripheral.advertisement.localName;

  if (rssi > -50 && localName == 'Rbt') {
    console.log('OMRON環境センサ id = ' + address +
     ' が見つかりました。信号強度は ' + rssi + 'dBm です。');
    peripheral.connect();
  }

  peripheral.once('connect', () => {
    console.log('connected');
    peripheral.discoverServices([]);
  });

  peripheral.once('disconnect', () => {
    console.log('disconnected');
  });

  peripheral.once('servicesDiscover', (services) => {
    prettyPrint(services);
    peripheral.disconnect();
  });
});

async function prettyPrint(services) {
  await Promise.all(
      services.sort(compareUuid).map( async (service) => {
        const uuid = service.uuid;
        await console.log('service discovered: ' + uuidString(uuid));
      })
  );
}

function uuidString(uuid) {
  if (uuid.length == 4) {
    return '0x' + uuid;
  } else {
    return '0x' +
       uuid.slice(4, 8) + ' (' +
       uuid.slice(0, 8) + '-' +
       uuid.slice(8, 12) + '-' +
       uuid.slice(12, 16) + '-' +
       uuid.slice(16, 20) + '-' +
       uuid.slice(20) + ')';
  }
}

function compareUuid(a, b) {
  if (a.uuid.length > b.uuid.length) return -1;
  if (a.uuid.length < b.uuid.length) return 1;
  if (a.uuid > b.uuid) return 1;
  if (a.uuid < b.uuid) return -1;
  return 0;
}
