'use strict';


const Homey = require('homey');
const Helper = require('../../lib/helper');


/**
 *
 * For sake of consistency - this device is called the 'group' where as the devices with in this group
 * are referred to as the 'devices'
 *
 * i: capability key, x: groupedDevice key
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
        this.auditTimer = 30;                                    // how often to audit device - in seconds - 0 for disabled
        this.settings = await this.getSettings();
        this.id = await this.getData().id;
        this.capabilities = await this.getCapabilities();


        // audit all devices ensuring they are not deleted.
        // this.audit();
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
		    this.audit();
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
     * @returns {Promise<boolean>}
     */
    async refresh() {

        this.log('[' + this.getName() + ']<refresh/>');

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
     *
     *  Loops through all the  group capabilities, calling onStateChange, to get then set all capabilities values
	 *
	 * @returns {Promise<void>}
	 */
	async initValues() {
	    this.log('[' + this.getName() + ']<initValues/>'); ;
        // Loop through each of the capabilities gathering the values and assigning them back to the group.
	    for (let i in this.capabilities) {
		    this.onStateChange(this.capabilities[i])
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

	    this.log('[' + this.getName() + ']<initGroupListener/>'); ;

        /**
         * Register all of the capabilities at once with a (async) call back.
         *
         * values : An object with the changed capability values, e.g. { dim: 0.5 }
         * options : An object with optional properties, per capability, e.g. { dim: { duration: 300 } }
         *
         * Increase the time out - as large groups will require more time. Especially via 3rd Party server (alexa/google)
         * The time out is documented as "The debounce timeout"
         */

        return this.registerMultipleCapabilityListener(this.capabilities, async (values, options) => {
	        this.log('[' + this.getName() + ']<registerMultipleCapabilityListener>' + JSON.stringify(values) + '</registerMultipleCapabilityListener>');
            return this.updateDevicesCapabilities(values, options);
        }, this.settings.debounce);

    }

    /**
     * Updates the devices capabilities called from the groups capability listener.
     *
     * @param values
     * @returns {Promise<boolean>}
     */
    async updateDevicesCapabilities(values) {
	    this.log('[' + this.getName() + ']<updateDevicesCapabilities/>');
        // Loop through each devices in the group
        let i = 0;
        for (let x in this.settings.devices) {

            for (let capability in values) {

                let a = {
                    instance: this.instances[this.settings.devices[x]][capability]
                };

                // GIGO, in case the device isn't working :: will also allow us to have groups with flexible capabilities later on.
                if (this.instances[this.settings.devices[x]].hasOwnProperty(capability)) {

                    setTimeout( () => {
                        try {
                            a.instance.setValue(values[capability]).then(() => {
	                            this.log('[' + this.getName() + ']<updateDevicesCapabilities>Set ' + a.instance.title + ' for ' + a.instance.device.name + '(' + values[capability] + ')</updateDevicesCapabilities>')
                            }).catch((error) => {

	                            this.log('[' + this.getName() + ']<setValue:ERROR:' + error.code + '>' + error.name + '</setValue:ERROR:>');

                                a.instance.setValue(values[capability]).then( () => {
                                    this.log('[' + this.getName() + ']<updateDevicesCapabilities:RETRY>Set ' + a.instance.title + ' for ' + a.instance.device.name + '(' + values[capability] + ')</updateDevicesCapabilities:RETRY>')
                                }).catch(() => {
                                    this.setWarning('Homey was unable to communicate with ' + a.instance.device.name + ' while setting ' + a.instance.title + ' to ' + values[capability]);
                                    this.log('[' + this.getName() + ']<updateDevicesCapabilities:FAILED>Set ' + a.instance.title + ' for ' + a.instance.device.name + '(' + values[capability] + ')</updateDevicesCapabilities:FAILED>');
                                });

                            });
                        } catch (error) {
                            this.error(error);
                        }
                    }, this.settings.delay * i++);
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
     * Checks whether the device is ready and whether or not it has an instance for each of the capabilities.
     *
     * If either is not true then it will either create or destroy the capability instance accordingly.
     *
     * @param deviceId
     * @returns {Promise<*>}
     */
    async validateDeviceInstances(deviceId) {

        let device, ready, exists = false;

        // requires the API, stored in memory - see getDevice() for details.
        device = await this.getDevice(deviceId);

        if (device) {

            // Whether or not the device is ready device which have not loaded (yet), are disabled, crashed will not be ready.
            ready = Boolean(device.ready);
            exists = Boolean(this.instances[device.id]) && Boolean(Object.getOwnPropertyNames(this.instances[device.id]).length > 0);

            // Beware logical deduction dragons below. (XOR - then deduce from there)
            if (ready !== exists) {

                if (exists) {

                    // If exists therefore - not ready.
                    this.log('[' + this.getName() + ']<validateDeviceInstances>' +deviceId+': Removing (unavailable) device instances ('+device.name+')</validateDeviceInstances>');

                    // Listener exists but the device is not ready - so delete.
                    await this.destroyDeviceInstances(device.id);

                    // Reset the instance back to nothing.
                    this.instances[device.id] = {};

                } else {
                    // if doesn't exists - there for ready.
                    this.log('[' + this.getName() + ']<validateDeviceInstances>' +deviceId+': Creating device instances ('+device.name+') on ' + this.capabilities.length  + ' capabilities</validateDeviceInstances>>');

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
                            this.error('validateDeviceInstances: error setting ' + device.id + ' capability ' + this.capabilities[i] + ' for ' +  device.name + '. Is device is ready? : ' + device.ready + '. Does the instance exist ' + exists)
                        }

                    }
                }

	            // Update the group values as devices change state becoming available going unavailable.
	            this.initValues();

            }
            else
            {
                //DEBUG : this.log('<validateDeviceInstances['+ this.getName() +']:' +deviceId+': No change>');
            }

        } else {

            // We don't have a device, log then throw an error which will get caught by auditDevice.
            this.log('[' + this.getName() + ']<validateDeviceInstances>' +deviceId+': Removing (deleted) device instances</validateDeviceInstances>');

            const   err = new Error('device_not_found');
                    err.code = 404;
                    err.name = 'device_not_found';

            throw err;

        }

        // Everything is great here, or not
        return device && ready && exists;
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

            let working = await this.validateDeviceInstances(deviceId);

            if (this.auditTimer) {

                // Check the device 10x more often if its not ready, defaults to 30 seconds / 5 min.
                this.audits[deviceId] = setTimeout(this.auditDevice.bind(this,deviceId), 1000 * (this.auditTimer + (!!working * (this.auditTimer * 9))));
            }

        } catch (e) {
            if (e.name === 'device_not_found') {
                // if the device is not found, destroy its instance/poll.
                // JIC - Manual delete is still required to permanently remove (see: settings).
                this.destroyDevice(deviceId);
            } else {

                // Otherwise use normal app error handling.
                throw e;
            }
        }
    }


    /**
     * When a device is deleted check to see if it will affect this group
     * and if then call the validateDeviceInstances to speed up the process of it being removed.
     *
     * @todo - perhaps all of the code checking for deleted devices should be handled here rather then with in the audit.
     *
     * @returns {Promise<void>}
     * @private
     */
    async audit() {

        // Gather the API from the app.js
        Homey.app.getApi().then((api) => {

            // Listen for devices being deleted. (Note there is another check with in the app - keeping the cache clean).
            api.devices.on('device.delete', async (device) => {

                // If the deleted device is with in this group.
                if (this.settings.devices.includes(device.id)) {

                    // Gigo - we could just delete it, but run through the process, just in case.
                    this.log('[' + this.getName() + ']<audit>' +device.id+': Detected device in group has been deleted');
                    this.log(this.settings.devices);
                    this.log('</audit>');

                    try {

                        let working = await this.validateDeviceInstances(device.id);

                    } catch (e) {
                        if (e.name === 'device_not_found') {
                            // if the device is not found, destroy its instance/poll.
                            // JIC - Manual delete is still required to permanently remove (see: settings).
                            this.destroyDevice(device.id);
                        } else {

                            // Otherwise use normal app error handling.
                            throw e;
                        }
                    }
                }
            });
        })
    }



    /**
     * Called when ever the state (capability values) of a device is changed.
     * Call code which determine the value off all devices, and then assign the correct value to the group (card).
     *
     * @param capability
     * @param value
     * @param device
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

        // DEBUG force block scope variable, sanity check for memory debugging.
        let a = {key: null, value: null, method: null, type: null}

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

                // Log for debugging.
                this.log('[' + this.getName() + ']<setGroupCapabilityValue>Setting group capability : ' + a.key + ' to ' + a.value + ' :: [' + values.join(', ') + '](' + a.method + ')</setGroupCapabilityValue>');
            } catch (error) {

                // Log for error
                this.error('Error on setting capability value : ' + a.key + ' ' + a.value + ' Error:' + error.message);
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

        // Alias
        let a = {capability: null, method: null};
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
                this.log('[' + this.getName() + ']<getDevice>' +deviceId+': device no longer exists.</getDevice>>');
            }
            this.error(e);
            return false;
        }
    }


    /**
     * On Delete, destroy the capability instances.
     */
    async onDeleted() {

        await this.destroyAllInstances();
        await this.destroyAllAudits();
    }

    /**
     * Destroys all of the audits for the current group
     * @returns {Promise<void>}
     */
    async destroyAllAudits() {

        for (let a in this.audits) {
            await this.destroyDeviceAudit(a)
        }

        this.audits = {}
    }


    async destroyDevice(deviceId) {

        this.log('[' + this.getName() + ']<destroyDevice> destroying  ' + deviceId +'</destroyDevice>');

        // Listener exists but the device is not ready - so delete.
        await this.destroyDeviceInstances(deviceId);

        // Reset the instance back to nothing.
        this.instances[deviceId] = {};

        await this.destroyDeviceAudit(deviceId);

        this.audits[deviceId] = {};
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
     * Removes auditing for the supplied device.
     *
     * @param deviceId
     * @returns {Promise<void>}
     */
    async destroyDeviceAudit(deviceId) {
        this.log('[' + this.getName() + ']<destroyDeviceAudit> clearing audit  ' + deviceId +'</destroyDeviceAudit>');
        return await clearTimeout(this.audits[deviceId]);
    }

    /**
     * Removes all instances of a capability event listeners from upon a device
     * @param deviceId the ID of the device to destroy instances for.
     * @returns {Promise<void>}
     */
    async destroyDeviceInstances(deviceId) {

        this.log('[' + this.getName() + ']<destroyDeviceInstances> clearing instances  ' + deviceId +'</destroyDeviceInstances>');

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
