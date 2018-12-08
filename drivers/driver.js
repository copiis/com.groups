'use strict';

const Homey = require('homey');

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

class Driver extends Homey.Driver {


    onPair(socket) {

        /*
         * Add for future backwards compatibility checks : will require npm semver
         * Currently being stored with in the devices store object @ onAlmostDone
         */
        const version = '1.0.0';

        let pairingDevice = {
            name: 'Group',
            class: false,
            settings:  {capabilities: {}},
            data: {}
        };

        // This default value should be immediately overwritten.
        let icons = {
            default : '/app/' + Homey.manifest.id + '/assets/icon.svg'
        };

        socket.on('startedCapabilities', function (data, callback) {

            // Proof of concept

            // Disabled as it shouldn't be needed anymore.
            pairingDevice.class = 'light';

            // pairingDevice.settings.labelClass = Homey.app.library.getCategory(data.class).title[Homey.app.i18n];
            // pairingDevice.name = pairingDevice.settings.labelClass = ' Group';    // @todo : i18n

            // @todo hardcoded values for current category
            let categoryCapabilities = Homey.app.library.getCategory('light').capabilities;

            let result = {};
            for (let i in categoryCapabilities) {
                result[categoryCapabilities[i]] = Homey.app.library.getCapability(categoryCapabilities[i]);
            }

            callback(null, result)
        });


        socket.on('capabilitiesChanged', function (data, callback) {
            pairingDevice.settings.capabilities = {};
            pairingDevice.capabilities = data.capabilities;

            // Set the capability method to the default
            for (let i in data.capabilities) {
                pairingDevice.settings.capabilities[data.capabilities[i]] = {}; // reset
                pairingDevice.settings.capabilities[data.capabilities[i]].method = Homey.app.library.getCapability(data.capabilities[i]).method;
            }
            callback(null, pairingDevice);
        });


        socket.on('startedDevices', function (data, callback) {
            let result = {devices: []};

            result.pairingDevice = pairingDevice;

            Homey.app.getDevices().then(res => {
                result.devices = res;
                callback(null, result);
            }).catch(error => callback(error, null));
        });


        socket.on('devicesChanged', function (data, callback) {
            let ids = [];
            let svgs = {};

            for (let i in data.devices) {
                ids.push(data.devices[i].id);

                // Gigo check
                if (data.devices[i].iconObj.hasOwnProperty('url')) {
                    icons[data.devices[i].icon] = data.devices[i].iconObj.url;
                }
            }
            pairingDevice.settings.groupedDevices = ids;
            callback(null, pairingDevice);
        });


        socket.on('startedIcons', function (data, callback) {
            callback(null, icons);
        });


        socket.on('selectIcon', function (data, callback) {

            console.log('------');
            console.log(data);
            console.log('>>>><<<<');
            pairingDevice.icon = data.icon;
            pairingDevice.icon = 'icon.svg';
            callback(null, icons);
        });


        // Adds the Unique ID, returns to the view for it to be added.
        socket.on('almostDone', function (data, callback) {
            try {
                console.log(pairingDevice);


                pairingDevice.data.id = guid();
                pairingDevice.store = {version: this.version};
                callback(null, pairingDevice);
            } catch (error) {
                callback(error, null);
            }
        });


        socket.on('done', function (data, callback) {
            pairingDevice = null;
            callback(null, true);
        });
    }
}

module.exports = Driver;
