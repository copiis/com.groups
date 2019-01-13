'use strict';

const Homey = require('homey');
const HomeyAPI = require('athom-api').HomeyAPI;
const Librarian = require('./lib/librarian');

/**
 *
 */
class Groups extends Homey.App {

    onInit() {
        this.log('<onInit>');

        // Set our library reference
        this.library = new Librarian();

        // Prime the API into memory, set its events.
        this.cache();

        // Initialise the devices objects.
        this.devices = {};

        this.log('</onInit>');
    }


    /**
     * IF the API hasn't been set, get it otherwise just returned cached API for current homey.
     *
     * @returns {object}
     */
    getApi() {

        if (!this.api) {
            this.api = HomeyAPI.forCurrentHomey();
        }
        return this.api;
    }


    /**
     * Gets all API devices from the Homey
     *
     * @todo should this be cached?
     *
     * @param id
     * @returns {Promise<*>}
     */
    async getDevices() {
        const api = await this.getApi();
        return await api.devices.getDevices();
    }


    /**
     * Gets an API device from the APP, cache it
     *
     * Was added as storing the entire device with in a variable, in order to reduce the calls to the API
     *
     * @param id
     * @returns {Promise<*>}
     */
    async getDevice(id) {
        if (!this.devices[id]) {
            this.devices[id] = await (await this.getApi()).devices.getDevice({
                id: id
            });
        }
        return this.devices[id];
    }


    /**
     * Primes the cache - then set watchers of when to clear it.
     *
     * When ever a device is added/deleted from Home, ensure that the cache is cleared
     * so we can then add the new devices to a group, or stop old device from being added.
     *
     * Will also reset the cache when we add a new group (as it is a device).
     */
    cache() {

        this.getApi().then((api) => {

            // When a new device is added to homey, clear the cache
            api.devices.on('device.create', async (device) => {
                console.log('device.create: ' + device.name);
                this.api = false;
            });

            // when a device is deleted from homey, clear the cache.
            // @todo investigate removing all devices from settings of groups which have been deleted.
            api.devices.on('device.delete', async (device) => {
                console.log('device.delete: ' + device);
                this.api = false;
            });
        })

    }
}

module.exports = Groups;



