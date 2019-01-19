'use strict';


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
        this.states = {};                                       // State of all group capabilities
        this.instances = {};
        this.audits = {};                                       // Timeout audits checking grouped devices are ready and have an instance
        this.auditTimer = 5;                                    // how often to audit device - in seconds - 0 for disabledvv
        this.settings = await this.getSettings();
        this.capabilities = await this.getCapabilities();
    }

    /**
     * Automatically runs
     * Gathers the required properties, sets our listeners, and polls
     */
    async onInit() {

        await this.load();
        try {
            await this.checkForUpdates();
            await this.initGroupListener();
            await this.initInstances();
            await this.initValues();

        } catch (error) {
            this.error(error);
            throw error;
        }

    }

    /**
     * When a device is added, set our label values.
     *
     * Happens prior to the initialisation
     *
     * @returns {Promise<void>}
     */
    async onAdded() {

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

        try {
            this.updateDevicesLabels();
            this.updateCapabilityLabels();
            await this.destroyAllInstances();
            await this.destroyAllAudits();
            this.settings = await this.getSettings();
            this.capabilities = await this.getCapabilities();
            await this.initInstances();
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

                // Added a sanity check against device.ready - as after a homey restart, as the apps load in "whatever" order
                // So its possible race condition that we might be attempting to get the value of a device which hasn't been loaded yet.
                // Thanks to @DaneedeKruyff : https://community.athom.com/t/groups/3168/71?u=jamie
                if (device && device.ready) {
                    // Set the initial value.
                    this.states[this.settings.devices[x]] = {};

                    let capabilities = await device.capabilitiesObj;

                    for (let c in capabilities) {
                        this.states[this.settings.devices[x]][c] = capabilities[c].value
                    }
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

        // Loop through each devices in the group
        for (let x in this.settings.devices) {

            for (let capability in values) {

                let a = {
                    instance: this.instances[this.settings.devices[x]][capability]
                };

                // GIGO, in case the device isn't working :: will also allow us to have groups with flexible capabilities later on.
                if (this.instances[this.settings.devices[x]].hasOwnProperty(capability)) {

                    // Sanity, only update the devices which require updating : note there *could* be an issue with this when a gateway times out.
                    if (a.instance.value !== values[capability]) {

                        a.instance.setValue(values[capability]);

                        this.log('<updateDevicesCapabilities[' + this.getName() + '] setting ' + a.instance.title + ' for ' + a.instance.device.name + '(' + values[capability] + ')');

                    } else {
                        this.log('<updateDevicesCapabilities[' + this.getName() + '] ignore ' + a.instance.title + ' for ' + a.instance.device.name + '(' + a.instance.title  + ' is ' + values[capability] + ')');
                    }
                }
            }
        }

        // setWarning seems to be disabled with in the v2 app at the moment.
        //this.setWarning('Not all devices with in the group are available to be changed.');

        return true;
    }


    /**
     * Initialises our instance - and the start the monitoring of the devices in the group
     *
     * @returns {Promise<void>}
     */
    async initInstances() {

        // Store our events, so we can remove them if needed.
        this.events = [];

        // Loop through each of the devices in the group
        for (let x in this.settings.devices) {

            // Sanity Check
            if (this.settings.devices.hasOwnProperty(x)) {

                // Initialise the instance if it has not been set.
                this.instances[this.settings.devices[x]] = {};

                // Keep checking.
                this.auditDevice(this.settings.devices[x]);

            }
        }
    }

    /**
     * Manages a devices instances,
     *
     * Checks whether the device is ready and whether or not it has an instance for each of the capaibilities.
     *
     * If either is not true then it will either create or destroy the capability instance accordingly.
     *
     * @param deviceId
     * @returns {Promise<*>}
     */
    async validateDeviceInstances(deviceId) {


            // requires the API, stored in memory - see getDevice() for details.
            let device = await this.getDevice(deviceId);

            if (device) {

                // Whether or not the device is ready device which have not loaded (yet), are disabled, crashed will not be ready.
                let ready = Boolean(device.ready);
                let exists = (this.instances[device.id]) && (Object.getOwnPropertyNames(this.instances[device.id]).length > 0);

                // Beware logical deduction dragons below. (XOR - then deduce from there)
                if (ready !== exists) {

                    if (exists) {

                        this.log('<:validateDeviceInstances['+ this.getName() +']:' +deviceId+': Deleting device instances ('+device.name+')>');

                        // Listener exists but the device is not ready - so delete.
                        await this.destroyDeviceInstances(device.id);

                        // Reset the instance back to nothing.
                        this.instances[device.id] = {};

                    } else {

                        this.log('<validateDeviceInstances['+ this.getName() +']:' +deviceId+': Creating device instances ('+device.name+') on ' + this.capabilities.length  + ' capabilities>');

                        // Listener doesnt exist but device is ready - so create
                        for (let i in this.capabilities) {

                            // There was a very good reason for setting the listener to a anon function, I believe it had to do with variable scope?
                            let listener = async (value) => {
                                this.onStateChange(this.capabilities[i], value, device.id);
                            };

                            try {
                                // Link our event to a state change of the capability.
                                 this.instances[device.id][this.capabilities[i]] = device.makeCapabilityInstance(this.capabilities[i], listener);
                            } catch (error) {
                                this.error('validateDeviceInstances: error setting ' + device.id + ' capability ' + this.capabilities[i] + ' for ' +  device.name + '. Is deivce is ready? : ' + device.ready + '. Does the instance exist ' + exists)
                            }
                        }
                    }
                }
            } else {
                throw new Error({name: 'device_not_found', code: 404});
            }

        // return ready && exists;
    }



    /**
     * This little function will poll a specific device with the group and check to see if they are available.
     *
     * How often they are polled depends on the current status of the device, if the device is not ready it will run 10x more frequently.
     *
     * Currently defaults to once every 30 seconds if not ready and once every 5 min if the device is ready.
     *
     * Set this.auditTimer to  0 to disable.
     *
     * @param deviceId the deviceID which to audit.
     * @returns {Promise<void>}
     */
    async auditDevice(deviceId) {

        try {

            let ready = await this.validateDeviceInstances(deviceId);

            if (this.auditTimer) {

                // Check the device 10x more often if its not ready, defaults to 30 seconds / 5 min.
                this.audits[deviceId] = setTimeout(this.auditDevice.bind(this,deviceId), 1000 * (this.auditTimer + (!!ready * (this.auditTimer * 9))));
            }


        } catch (e) {
            // Listener exists but the device is not ready - so delete.
            await this.destroyDeviceInstances(deviceId);

            await clearTimeout(this.audits[deviceId]);

            // Reset the instance back to nothing.
            this.instances[deviceId] = {};
        }

    }


    /**
     * Called when ever the state (capability values) of a device is changed.
     *
     * @param state
     * @returns {Promise<void>}
     */
    async onStateChange(capability, value, device) {

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
            if (this.settings.devices.hasOwnProperty(x) && this.instances.hasOwnProperty(this.settings.devices[x])) {

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
        a.value = values;                                       // Alias the value
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
                this.log('<setGroupCapabilityValue['+this.getName()+']: Setting group capability : ' + a.key + ' to ' + a.value + ' :: [' + values.join(', ') + '](' + a.method + ')'); // DEBUG
            } catch (error) {
                this.error('Error on setting capability value : ' + a.key + ' ' + a.value + ' Error:' + error.message); // DEBUG

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
        let labels = [];

        for (let x in this.settings.devices) {
            let device = await this.getDevice(this.settings.devices[x]);

            if (device) {
                labels.push(device.name);
            }
        }

        await this.setSettings({labelDevices: labels.join(', ')});
        return true;
    }


    /**
     * Will update the capabilities label setting to the current capabilities.
     *
     * @returns {Promise<boolean>}
     */
    async updateCapabilityLabels() {

        let a = {capability: null, method: null};   // Alias
        let labels = [];

        for (let i in this.capabilities) {

            a.capability = Homey.app.library.getCapability(this.capabilities[i]);
            a.method = this.settings.capabilities[this.capabilities[i]].method;

            labels.push(Homey.__('capability.' + this.capabilities[i] + '.title'));

            // If we have a method assigned, attach it to our description.
            if (a.method) {
                labels[labels.length - 1] += ' (' + Homey.__('method.' + a.method + '.title')  + ')';
            }
        }
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
    async getDevice(deviceId) {

        try {

            return await Homey.app.getDevice(deviceId);

        } catch (e) {

            if (e.name === 'device_not_found') {
                this.log('<:validateDeviceInstances['+ this.getName() +']:' +deviceId+': device no longer exists.>');
            }
            return false;
        }
    }


    /**
     * On Delete, destroy the capability instances.
     */
    async onDeleted() {

        await this.destroyAllInstances();
        this.destroyAllAudits();
    }

    /**
     * Destroys all of the audits for the current group
     * @returns {Promise<void>}
     */
    async destroyAllAudits() {

        for (let a in this.audits) {
            await clearTimeout(this.audits[a]);
        }

        this.audits = {}
    }

    /**
     * Removes the event listeners upon the devices.
     */
    async destroyAllInstances() {

        // Ensure events have been set prior to attempting to delete
        if (this.hasOwnProperty('instances')) {

            // Loop ALL instances
            for (let i in this.instances) {
                await this.destroyDeviceInstances(i);
            }

            this.instances = {};
        }
        return true;
    }


    /**
     * Removes all instances of a capability event listeners from upon a device
     * @param id
     * @returns {Promise<void>}
     */
    async destroyDeviceInstances(deviceId) {

        if (this.instances.hasOwnProperty(deviceId)) {
            for (let i in this.capabilities) {
                // Sanity there is a possible discrepancy when a device is deleted - it will 'practically immediately'
                // be removed from the devices list, however it might not be polled yet to see if it exists.
                // You can destroy a watcher if the device has been destroyed. - though im not sure why this gets called
                if (this.instances[deviceId].hasOwnProperty(this.capabilities[i])) {
                    await this.instances[deviceId][this.capabilities[i]].destroy();
                }
            }
            this.instances[deviceId] = {};
        }
    }

    async _auditDevice() {
        api.devices.on('device.delete', async (device) => {
            console.log('driver device.delete: ' + device.id);
        });
    }
}

// Proof of concept to watch device.ready instead of using a timer to update when devices become available
// But .. there is no way to know when I device is no longer 'ready' unless it is deleted - so the timeOut would
// still be required regardless.
// async _auditDevice() {
//
//     Homey.app.getApi().then( (api) => {
//         // When a new device is added to homey, clear the cache
//         api.devices.on('device.create', async (device) => {
//             console.log('device.create: ' + device.name + '(' + device.id + ')');
//         });
//
//         // When a new device is added to homey, clear the cache
//         api.devices.on('device.update', async (device) => {
//             if (device.ready) {
//                 console.log('device.update.ready: '  + device.name)
//             } else {
//                 console.log('device.update.not: ' + device.name);
//             }
//         });
//         api.devices.on('device.delete', async (device) => {
//             console.log('device.delete: ' + device');
//             this.api = false;
//         });
//     });
// }

module.exports = Device;
