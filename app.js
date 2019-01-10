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

        // Force i18n to en or nl, as we are accessing the i18n directly,
        this.i18n = (Homey.ManagerI18n.getLanguage() === 'nl') ? 'nl' : 'en';

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

    async getGroups() {
        //return Homey.ManagerDrivers.getDriver('light').getDevices();
    }
    async getNewGroups() {

        let devices = await this.getDevices();
        this.groups = {};
        for (let d in devices) {
            if (devices[d].driverUri == 'homey:app:com.groups') {
                this.groups[devices[d].id] = devices[d];
            }
        }

        return this.groups;
    }

    async getCategory(id) {
        let groups = await Homey.ManagerDrivers.getDriver(id).getDevices();
        if (groups instanceof Error) {this.log(Error); throw groups;}
        return groups;
    }

    async getGroup(id) {
        let device = await Homey.ManagerDrivers.getDriver(id).getDevice({id});
        if (device instanceof Error) {this.log(Error); throw device;}
        return device;
    }

    async setDevicesForGroup(id, devices) {
        let group = await this.getGroup(id);

        // Find all devices that should be grouped.
        let allDevices = await this.getDevices();

        // Looks like vue (upon settings) is sending a padded array with undefined items
        // Checks that the devices sent exist in allDevices, filters out any that do not.
        let groupedDevices = Object.values(allDevices).filter(d => devices.includes(d.id));

        let ids = [];
        for (let i in groupedDevices) {
            ids.push(groupedDevices[i].id);
        }

        group.settings.devices = ids;

        // Update the group settings.
        let result = await group.setSettings(group.settings);
        await group.refresh();

        return result;
    }

    async setMethodForCapabilityOfGroup(id, capabilities) {

        let group = await this.getGroup(id);

        group.settings.capabilities = capabilities;

        // Update the group settings.
        let result = await group.setSettings(group.settings);
        await group.refresh();
        return result;
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



