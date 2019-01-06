'use strict';
require('events').EventEmitter.prototype._maxListeners = 100;



const Homey = require('homey');
const Helper = require('../../lib/helper');


/**
 *
 * For sake of consistency - this device is called the 'group' where as the devices with in this group
 * are referred to as the 'devices'
 *
 * i: capability key, x: groupedDevice key
 *
 * @todo bug on first capability until reload
 *
 */
class Device extends Homey.Device {

    /**
     * Resets our properties,
     *
     * Note how this does not include the 'events' property which needs to persist.
     * @returns {Promise<void>}
     */
    async load() {
        this.states = {};                                     // State of all group capabilities
        this.instances = {};
        this.settings = await this.getSettings();
        this.capabilities = await this.getCapabilities();
    }

    /**
     * Automatically runs
     * Gathers the required properties, sets our listeners, and polls
     */
    async onInit() {
        this.log('Initialising ' + this.getName());

        await this.load();

        try {
            await this.checkForUpdates();
            await this.initGroupListener();
            await this.initEvents();
            await this.initValues();

        } catch (error) {
            this.error(error);
        }

        this.log('Completed Initialising ' + this.getName());
    }

    /**
     * When a device is added, set our label values.
     *
     * Happens prior to the initialisation
     *
     * @returns {Promise<void>}
     */
    async onAdded() {
        this.log('Adding Group ' + this.getName());
        await this.load();
        await this.updateDevicesLabels();
        await this.updateCapabilityLabels();

        // Sanity Check
        await this.setAvailable();
    }


    /**
     * Reload the settings & capability listeners
     *
     * Sets device unavailable/available while updating, regathers the latest,
     * settings empties all devices for them to rebuilt, and updates the group labels.
     *
     * @todo Previously there was a race condition (generally caused from settings page) which would cause havock.
     * @returns {Promise<boolean>}
     */
    async refresh() {
        this.log('Refreshing Group ' + this.getName());

        await this.load();
        try {
            this.updateDevicesLabels();
            this.updateCapabilityLabels();
            await this.destroyInstances();
            await this.initEvents();
            await this.initValues();
        } catch (error) {
            this.console.log(error);
            this.error(error);
        }

        return true;
    }


    /**
     * Sets the initial value of the Group based off of the values with in the Devices.
     * @returns {Promise<boolean>}
     */
    async initValues() {

        // Loop through each of the devices in the group
        for (let x in this.settings.devices) {
            if (this.settings.devices.hasOwnProperty(x)) {

                // requires the API, stored in memory - see getDevice() for details.
                let device = await this.getDevice(this.settings.devices[x]);

                // Set the initial value.
                this.states[this.settings.devices[x]] = {};

                let capabilities = await device.capabilitiesObj;

                for (let c in capabilities) {
                    this.states[this.settings.devices[x]][c] = capabilities[c].value
                }
            }
        }

        // Loop through each of the capabilities gathering the values and assigning them back to the group.
        for (let i in this.capabilities) {
            let values = await this.getDevicesCapabilityValues(this.capabilities[i]);
            await this.setGroupCapabilityValue(this.capabilities[i], values);
        }
    }


    /**
     * Initialises the capability listener.
     *
     * Basically : Registers every capability the group (MultipleCapabilityListener) has, so
     * when any of the group capabilities are changed, the function is called  which sets the
     * value of all of the devices to said value.
     *
     * As this is only listening for capabilities (which cant be changed in the settings), we never have to reload this.
     *
     * @returns {Promise<void>}
     */
    async initGroupListener() {
        this.log('Initialising Listener Group ' + this.getName());

        /**
         * Register all of the capabilities at once with a (async) call back.
         *
         * values : An object with the changed capability values, e.g. { dim: 0.5 }
         * options : An object with optional properties, per capability, e.g. { dim: { duration: 300 } }
         *
         * Increase the time out - as large groups will require more time. Especially via 3rd Party server (alexa/google)
         */
        return this.registerMultipleCapabilityListener(this.capabilities, async (values, options) => {
            return this.updateDevicesCapabilities(values, options);
        }, 1000);
    }

    /**
     * Updates the devices capabilities called from the groups capability listener.
     *
     * @param values
     * @returns {Promise<boolean>}
     */
    async updateDevicesCapabilities(values) {
        this.log('Update Device Capability ' + this.getName());

        // Loop through each devices in the group
        for (let x in this.settings.devices) {

            for (let capability in values) {

                let a = {
                    instance: this.instances[this.settings.devices[x]][capability]
                };

                // Sanity
                if ( a.instance.value !==  values[capability] ) {
                    a.instance.setValue(values[capability]);
                    this.log('Setting capability ' + a.instance.title + ' on ' + this.getName() + ':' + a.instance.device.name + '(' + values[capability] + ')');
                } else {
                    this.log('Ignore Setting capability ' + a.instance.title  + ' on ' + this.getName() + ':' + a.instance.device.name + '(' + a.instance.title.value  + ' is ' + values[capability] + ')');
                }
            }

        }
        return true;
    }


    /**
     * Will initialise the instances by adding an event when ever a capability is changed.
     * This event will gather the values of the Devices capabilities and then update the group card/mobile values.
     *
     * @returns {Promise<void>}
     */
    async initEvents() {
        this.log('Initialising States for Grouped Devices on ' + this.getName());

        // Store our events, so we can remove them if needed.
        this.events = [];
        // Loop through each of the devices in the group
        for (let x in this.settings.devices) {

            if (this.settings.devices.hasOwnProperty(x)) {

                // requires the API, stored in memory - see getDevice() for details.
                let device = await this.getDevice(this.settings.devices[x]);

                this.instances[this.settings.devices[x]] = {};

                for (let i in this.capabilities) {
                    let listener = async (value) => {
                        this.onStateChange(this.capabilities[i], value, this.settings.devices[x]);
                    };

                    // Link our event to a state change of the capability.
                    // @todo investigate doing this through the app - to reduce event watchers.

                    this.instances[this.settings.devices[x]][this.capabilities[i]] = device.makeCapabilityInstance(this.capabilities[i], listener);


                }
            }
        }
    }


    /**
     * Called when ever the state (capability values) of a device is changed.
     *
     * @param state
     * @returns {Promise<void>}
     */
    async onStateChange(capability, value, device) {

        this.log('State Change ' + this.getName() + ' ' + capability + ' ' + value);

        let values = await this.getDevicesCapabilityValues(capability);
        await this.setGroupCapabilityValue(capability, values);
    }


    /**
     * Get all of the grouped capability values for all of the devices
     *
     * @returns {Promise<void>}
     */
    async getDevicesCapabilityValues(capability) {

        let values = [];

        // Loop through each of the devices in the group
        for (let x in this.settings.devices) {

            // There is a bug where this is called while group devices is empty ..
            // Seems to be prevalent when updating the settings using the API, possibly race condition
            if (this.settings.devices.hasOwnProperty(x)) {

                // Add a check that the capability exists - future proofing when we mix'n match device capabilities
                if (this.instances[this.settings.devices[x]].hasOwnProperty(capability)) {
                    // Loop through each of the capabilities checking each of the devices value.
                    values.push(this.instances[this.settings.devices[x]][capability].value);
                }

            }
        }

        return values;
    }


    /**
     * Assigns a card's values to the values of the supplied devices
     *
     * Based off of the capabilities and their values supplied and which methods they have assigned to them
     * setCardValues will determine what value each of the capabilities of this device should be then assigns it
     *
     * @param values
     * @param capabilities
     * @returns {Promise<boolean>}
     */
    async setGroupCapabilityValue(capability, values) {

        // DEBUG force block scope variable, sanity check for memory debugging. @todo to be removed.
        let a = {key: null, value: null, method: null, type: null}


        // loop through each of the capabilities calculating the values.
        // Aliases
        a.key = capability;                                     // Alias the capability key
        a.value = values;                                // Alias the value
        a.method = this.settings.capabilities[a.key].method;    // Alias the method we are going to use
        a.capability = Homey.app.library.getCapability(a.key);   // Alias the capability

        // if the method is false - its disabled if it's set to ignore, don't update use the card behaviour.
        if (a.method !== false && a.method !== 'ignore') {

            // Calculate our value using our function
            a.value = Helper[Homey.app.library.getMethod(a.method).function](a.value);

            // Convert the value in the to capabilities required type
            a.value = Helper[a.capability.type](a.value);

            // Validate the value against capability rules (min/max/decimals)
            // a.value = Helper.validate(a.value, a.capability);

            try {
                // Set the capability of the group
                await this.setCapabilityValue(a.key, a.value);
                console.log('Setting group capability value : ' + a.key + ' to ' + a.value + ' :: [' + values.join(', ') + '](' + a.method + ')'); // DEBUG
            } catch (error) {
                console.log('Error on setting capability value : ' + a.key + ' ' + a.value + ' Error:' + error.message); // DEBUG

                throw new error;
            }
        }

        return true;
    }


    /**
     * Will update the devices label setting to the current devices.
     *
     * @returns {Promise<void>}
     */
    async updateDevicesLabels() {
        this.log('Update Devices Label ' + this.getName());
        let labels = [];

        for (let x in this.settings.devices) {
            let device = await this.getDevice(this.settings.devices[x]);
            labels.push(device.name);
        }

        await this.setSettings({labelDevices: labels.join(', ')});
        return true;
    }

    /**
     * Will update the capabilities label setting to the current capabilties.
     *
     * @returns {Promise<boolean>}
     */
    async updateCapabilityLabels() {
        this.log('Update Capability Label ' + this.getName());

        let a = {capability: null, method: null};   // Alias
        let labels = [];

        for (let i in this.capabilities) {

            a.capability = Homey.app.library.getCapability(this.capabilities[i]);
            a.method = this.settings.capabilities[this.capabilities[i]].method;

            labels.push(a.capability.title[Homey.app.i18n]);

            // If we have a method assigned, attach it to our description.
            if (a.method) {
                labels[labels.length - 1] += ' (' + Homey.app.library.getMethod(a.method).title[Homey.app.i18n] + ')';
            }
        }
        this.log('Setting Capability Labels for ' + this.getName() + ' to "' + labels.join(', ') + '"');
        this.setSettings({labelCapabilities: labels.join(', ')});
        return true;
    }


    /**
     * Check for application updates, and then update if required
     * @todo On-Hold pending data/feature freeze when tagged for beta.
     * @returns {Promise<*>} true if update installed, false if no update
     */
    async checkForUpdates() {
        return false;
        try {

            if (this.store.hasOwnProperty('version')) {

            }

        } catch (error) {
            throw new error;
        }
        return false;
    }

    /**
     * Gets an API device from the APP, cache it
     *
     * Was added as storing the entire device with in a variable, in order to reduce the calls to the API
     * which appears to have a memory leak where "something" with in there is not getting GC().
     *
     * @param id
     * @returns {Promise<*>}
     */
    async getDevice(id) {
        return await Homey.app.getDevice(id);
    }

    /**
     * On Delete, destroy the capability instances.
     */
    onDeleted() {
        this.log('Deleting  Device Group ' + this.getName());
        this.destroyInstances();
    }

    /**
     * Removes the event listeners upon the devices.
     */
    async destroyInstances() {
        this.log('Destroying Devices Capability Instances ' + this.getName());
        // Ensure events have been set prior to attempting to delete
        if (this.hasOwnProperty('instances')) {
            // Loop ALL devices
            for (let x in this.settings.devices) {
                if (this.instances.hasOwnProperty(this.settings.devices[x])) {
                    for (let i in this.capabilities) {
                        this.instances[this.settings.devices[x]][this.capabilities[i]].destroy();
                    }
                }
            }
        }
        return true;
    }
}

module.exports = Device;