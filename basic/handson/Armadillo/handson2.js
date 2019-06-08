'use strict';

const noble = require('noble');

const deviceId = process.env.ID;
const controlServiceId = 'AB705110-0A3A-11E8-BA89-0ED5F89F718B'.toLowerCase().replace(/-/g, '');
const ledSettingId = 'AB705111-0A3A-11E8-BA89-0ED5F89F718B'.toLowerCase().replace(/-/g, '');
const newRule = 6; //Sound Noise

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

  if (address == deviceId) {
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
    services.map( (service) => {
      if(service.uuid == controlServiceId) {
        service.discoverCharacteristics();
      }

      service.once('characteristicsDiscover', (characteristics) => {
        characteristics.map( (characteristic) => {
          if(characteristic.uuid == ledSettingId) {
            characteristic.read();

            characteristic.on('data', (data, isNotification) => {
              const rule  = data.readUInt16LE();

              console.log('環境センサのLED設定を読み込みました。');
              console.log('設定ルールは ' + hexString(rule, 4) + ' です。');
              console.log('環境センサに新しい設定 ' + hexString(newRule, 4) + ' を書き込みます。');
              const buf = Buffer.alloc(5);
              buf[0] = newRule;
              characteristic.write(buf, false);
            });

            characteristic.once('write', () => {
              console.log('書き込みが完了しました。');
              peripheral.disconnect();
            });

          }
        });
      })
    });
  });
});

function hexString(value, digit) {
  const hex = '0000' + value.toString(16);
  return '0x' + hex.slice(-digit);

}

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
