'use strict';

const Homey = require('homey');

/**
 * Global device driver all other device drivers inherit from.
 */
class Driver extends Homey.Driver {


    /**
     * Set the defaul values of the current group, called onPair as onInit only occurs once.
     *
     * @returns {Promise<void>}
     */
    async refresh () {

        // Due to an issue where the data attribute is not sent to the webAPI, we need to save it in the settings.
        // This is so that we are able to retrieve devices fom the SDK using the data attribute from the webAPI.
        let data = {id: Math.random().toString(36).substring(7)};

        this.group = {
            name: this.name,
            class: this.class,
            icon: this.appPath + '/assets/icon.svg',
            settings: {
                capabilities: {},
                devices: {},
                labelVersion: this.version
            },
            data: data,
            store: {
                version: this.version
            }
        };

    }

    /**
     * Call when driver is first initialised after the app loads.
     * Sets our defaults for us, which do not change device to device.
     */
    async onInit() {

        // Define the current version, Add for future backwards compatibility checks
        this.version = Homey.app.manifest.version;

        // Define the current application root directory by its relative path from the driver.
        this.appPath = '../../../';

        // Set the path to our icons - note in order to be useful its relative.
        this.assetPath = '/app/' + Homey.manifest.id + '/assets/icons/categories/';

        // Assign the i18n title @todo full i18n integration Homey.__("hello", { "name": "Dave" })
        this.name = Homey.__('category.' + this.class + '.title') + ' < ' + Homey.__('_.group') + ' >';

        this.icons =  {};

        let icons = await Homey.app.library.getCategory(this.class).icons;

        // If the icons have been assigned use them otherwise default.
        if (icons.length) {

            // Loop through and add all of the category icons.
            for (let i in icons) {
                this.icons[this.assetPath + icons[i] + '.svg'] = this.appPath + 'assets/icons/categories/' + icons[i] + '.svg';
            }

        } else {

            // Add the category icon
            this.icons['/app/' + Homey.manifest.id + '/drivers/' + this.class + '/assets/icon.svg'] =  'icon.svg';
        }

        // Add the default icons.
        this.icons['/app/' + Homey.manifest.id + '/assets/icon.svg'] = this.appPath + '/assets/icon.svg';

    }

    /**
     * Return all of the capabilities assigned to the category selected by the user.
     *
     * Capabilities assigned to a category (deviceClass) are a throw back home v1. While
     * they are no longer 'needed' as we can use what ever capability we like with any category.
     *
     * They still are a logical way to group capabilities (for now).
     *
     * @param data
     * @param callback
     */
    onCapabilitiesInitialised (data, callback) {

        this.group.name = this.name;
        this.group.settings.labelClass = this.class;

        let categoryCapabilities = Homey.app.library.getCategory(this.class).capabilities;

        let result = {};
        for (let i in categoryCapabilities) {
            result[categoryCapabilities[i]] = Homey.app.library.getCapability(categoryCapabilities[i]);
        }

        callback(null, result)
    }

    /**
     * Every time the capabilities change reset which capabilities are assigned to the group.
     * ALso assign the (default) method to use to aggregate the capability results
     *
     * @param data
     * @param callback
     */
    onCapabilitiesChanged (data, callback) {

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

        this.group.icon = data.icon;

        callback(null, true);
    }

    onGroupInitialised (data, callback) {

        try {
            callback(null, this.group);
        } catch (error) {
            callback(error, null);
        }
    }

    onGroupFinalised (data, callback) {

        this.group = null;
        callback(null, true);
    }

    onPair(socket) {

        // Set our default values.
        this.refresh();

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
