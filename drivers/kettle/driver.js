'use strict';

const Homey = require('homey');

// REMOVE ID HASH




class Driver extends Homey.Driver {

    onInit() {
        this.appRoot = '../../../';
        this.class = 'light';
        const version = '1.0.0';
    }

    onPair(socket) {

        /*
         * Add for future backwards compatibility checks : will require npm semver
         * Currently being stored with in the devices store object @ onAlmostDone
         */

        let pairingDevice = {
            name: 'Group',
            class: this.class,
            settings:  {capabilities: {}},
            data: {}
        };

        let icons = this.icons;

        // This default icons.
        icons['/app/' + Homey.manifest.id + '/assets/icon.svg'] = this.appRoot +'/assets/icon.svg';
        icons['/app/' + Homey.manifest.id + '/drivers/' + this.class + '/assets/icon.svg'] =  'icon.svg';

        socket.on('startedCapabilities', function (data, callback) {

            pairingDevice.settings.labelClass = Homey.app.library.getCategory(pairingDevice.class).title[Homey.app.i18n];
            pairingDevice.name = pairingDevice.settings.labelClass =  pairingDevice.settings.labelClass + ' Group';    // @todo : i18n

            // @todo hardcoded values for current category
            let categoryCapabilities = Homey.app.library.getCategory(pairingDevice.class).capabilities;

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
                if (data.devices[i].hasOwnProperty('iconObj') && data.devices[i].iconObj.hasOwnProperty('url')) {

                    // @todo :: Hardcoded overwrite -  I can't figure out the relative path to the docroot /icons folder.
                    icons[data.devices[i].iconObj.url] = this.appRoot +'/assets/icon.svg';//data.devices[i].iconObj.url;
                }
            }

            pairingDevice.settings.groupedDevices = ids;
            callback(null, pairingDevice);
        });


        socket.on('startedIcons', function (data, callback) {
            callback(null, icons);
        });


        socket.on('selectIcon', function (data, callback) {

            // These work
            // pairingDevice.icon = 'par.svg'; '../led.svg'; '../../../assets/icons/light/gu.svg'; '../../../temp.svg'; // root dir
            pairingDevice.icon = data.icon;

            callback(null, icons);
        });


        // Adds the Unique ID, returns to the view for it to be added.
        socket.on('almostDone', function (data, callback) {
            try {
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
