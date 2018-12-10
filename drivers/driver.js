'use strict';

const Homey = require('homey');

/**
 * @todo refactor onInit to be rest when pairing starts
 * @todo fix onInit to be callable correclt from child.
 */
class Driver extends Homey.Driver {



    onInit() {

        /**
         * Define the current version
         *
         * Add for future backwards compatibility checks : will require npm semver
         * Currently being stored with in the devices store object.
         *
         * @type {string}
         */
        this.version = '1.0.0';

        /**
         * Define the current application root directory by its relative path
         * from the driver.
         *
         * This the ./ path seems to be coded to be the driver folder rather than the app folder
         * with in the HomeyCore.
         *
         * @type {string}
         */
        this.appRoot = '../../../';

        /**
         * Default the device class.
         *
         * Sets a default fro the device class.
         * @type {string}
         */
        this.class = 'light';

        this.icons = {};

        /**
         * Define our group.
         *
         * Sets our structure and default values.
         *
         * This is the device we are building up to be added to Homey, while it is a a group of device
         * itself is obviously also a device. For clarity here on this will simply be referred to as  the 'group'.
         *
         *
         * @type {{settings: {capabilities: {}}, data: {}, name: string, class: string}}
         */
        this.group = {
            name: 'Group',
            class: 'light',
            icon: this.appRoot + '/assets/icon.svg',
            settings:  {
                capabilities: {},
                devices: {}
            },
            data: {
                id: Math.random().toString(36).substring(7)
            },
            store: {
                version: this.version
            }
        };
    }

    onCapabilitiesInitialised (data, callback) {

        console.log('onCapabilitiesInitialised');

        // get the i18n title
        let title = Homey.app.library.getCategory(this.class).title[Homey.app.i18n];

        // Assign the i18n title @todo full i18n integration Homey.__("hello", { "name": "Dave" })
        this.group.name = title;// + ' ' + Homey.__('_.group');
        this.group.settings.labelClass = title;

        let categoryCapabilities = Homey.app.library.getCategory(this.class).capabilities;

        let result = {};
        for (let i in categoryCapabilities) {
            result[categoryCapabilities[i]] = Homey.app.library.getCapability(categoryCapabilities[i]);
        }

        callback(null, result)
    }

    onCapabilitiesChanged (data, callback) {

        console.log('onCapabilitiesChanged');

        this.group.settings.capabilities = {};
        this.group.capabilities = data.capabilities;

        // Set the capability method to the default
        for (let i in data.capabilities) {
            this.group.settings.capabilities[data.capabilities[i]] = {}; // reset
            this.group.settings.capabilities[data.capabilities[i]].method = Homey.app.library.getCapability(data.capabilities[i]).method;
        }
        callback(null, this.group);
    }

    /**
     * On devices initialisation, send the group and all Homey devices to the view.
     *
     * @param data
     * @param callback
     */
    onDevicesInitialised (data, callback) {

        console.log('onDevicesInitialised');

        let result = {
            devices: [],
            group: this.group
        };

        Homey.app.getDevices().then(res => {
            result.devices = res;
            callback(null, result);
        }).catch(error => callback(error, null));
    }

    /**
     * When a device is changed, all devices are sent back to us.
     *
     * This will loop through all the devices sent and assign them into the group.settings.devices.
     * Also - as devices are added, their icons are added to the property to be displayed later.
     * @param data
     * @param callback
     */
    onDevicesChanged (data, callback) {

        console.log('onDevicesChanged');

        let devices = [];

        // When a device
        for (let i in data.devices) {

            // Add the device to our group
            devices.push(data.devices[i].id);
        }

        this.group.settings.devices = devices;
        callback(null, this.group);
    }

    /**
     * On icons initialisation, send the icons back the view.
     *
     * @param data
     * @param callback
     */
    onIconsInitialised (data, callback) {

        console.log('onIconsInitialised');

        callback(null, this.icons);
    }

    /**
     * When the icon is clicked, just update the current group icons.
     *
     * 'par.svg', '../led.svg', '../../../assets/icons/light/gu.svg', '../../../temp.svg';
     *
     * @param data
     * @param callback
     */
    onIconsChanged (data, callback) {

        console.log('onIconsChanged');

        this.group.icon = data.icon;

        callback(null, true);
    }

    onGroupInitialised (data, callback) {

        console.log('onGroupInitialised');

        try {
            callback(null, this.group);
        } catch (error) {
            callback(error, null);
        }
    }

    onGroupFinalised (data, callback) {

        console.log('onGroupFinalised');

        this.group = null;
        callback(null, true);
    }

    onPair(socket) {

        this.onInit();

        // Add the default icons.
        this.icons['/app/' + Homey.manifest.id + '/assets/icon.svg'] = this.appRoot + '/assets/icon.svg';
        this.icons['/app/' + Homey.manifest.id + '/drivers/' + this.class + '/assets/icon.svg'] =  'icon.svg';

        let capabilitiesInitialised  = async (data, callback) => { this.onCapabilitiesInitialised(data, callback); };
        let capabilitiesChanged  = async (data, callback) => { this.onCapabilitiesChanged(data, callback); };
        let devicesInitialised  = async (data, callback) => { this.onDevicesInitialised(data, callback); };
        let deviceChanged  = async (data, callback) => { this.onDevicesChanged(data, callback); };
        let iconsInitialised = async (data, callback) => { this.onIconsInitialised(data, callback); };
        let iconsChanged  = async (data, callback) => { this.onIconsChanged(data, callback); };
        let groupInitialised  = async (data, callback) => { this.onGroupInitialised(data, callback); };
        let groupFinalised  = async (data, callback) => { this.onGroupFinalised(data, callback); };

        socket.on('capabilities.initialised', capabilitiesInitialised);
        socket.on('capabilities.changed', capabilitiesChanged);
        socket.on('devices.initialised', devicesInitialised);
        socket.on('devices.changed', deviceChanged);
        socket.on('icons.initialised', iconsInitialised);
        socket.on('icons.changed', iconsChanged);
        socket.on('group.initialised', groupInitialised);
        socket.on('group.finalised', groupFinalised);
    }
}

module.exports = Driver;