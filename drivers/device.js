'use strict';

const Homey = require('homey');
const Helper = require('../../lib/helper');


/**
 * i: capability key, x: groupedDevice key
 *
 * @todo bug on first capability until reload
 * @todo bug where devices not showing in 'getDevices' until restart?
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
    this.states = {};                                     // State of all groupDevices capabilities
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
      await this.initListener();
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
    this.log('Adding Device Group ' + this.getName());
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
    this.log('Refreshing Device Group ' + this.getName());

    await this.load();
    try {
      this.updateDevicesLabels();
      this.updateCapabilityLabels();
      await this.destroyEvents();
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
    for (let x in this.settings.groupedDevices) {
      if (this.settings.groupedDevices.hasOwnProperty(x)) {

        // requires the API, stored in memory - see getDevice() for details.
        let device = await this.getDevice(this.settings.groupedDevices[x]);

        // Set the initial value.
        // @todo : gathers all of the states from the devices so we can calculate the results and update the group on init.
        // this.states[this.settings.groupedDevices[x]] = await device.capabilitiesObj;

        this.states[this.settings.groupedDevices[x]] = {};

        let capabilities = await device.capabilitiesObj;

        for (let c in capabilities) {
          this.states[this.settings.groupedDevices[x]][c] = capabilities[c].value
        }

      }
    }

    let values = await this.getDevicesCapabilityValues();
    await this.setCardCapabilityValues(values);
  }


  /**
   * Initialises the capability listener.
   *
   * Basically : Registers every capability this device (MultipleCapabilityListener) has, so
   * when any of the devices capabilities are changed, the function is called  which sets the
   * value of all of the 'grouped/real' devices to said value.
   *
   * As this is only listening for capabilities (which cant be changed in the settings), we never have to reload this.
   *
   * @returns {Promise<void>}
   */
  async initListener() {
    this.log('Initialising Listener Device Group ' + this.getName());

    // Register all of the capabilities at once with a (async) call back.
    return this.registerMultipleCapabilityListener(this.capabilities, async (valueObj, optsObj) => {
      return this.updateCapability(valueObj, optsObj);
    }, 500);
  }


  /**
   * Update the value of all the grouped items
   *
   * Note that it's using the API to set the values.
   *
   * @param valueObj
   * @param optsObj
   * @returns {Promise<*>}
   */
  async updateCapability(valueObj, optsObj) {
    this.log('Update Capability Device Group ' + this.getName());

    // Loop through each 'real' device in the group
    for (let x in this.settings.groupedDevices) {

      // Get the WebAPI reference 'real' device ::
      let device = await this.getDevice(this.settings.groupedDevices[x]);

      // Using the API for the 'real' device, set the capability value, to what ever we just changed.
      for (let capabilityId in valueObj) {
        // @todo updates the capability value of the device when a group value is changed
        await device.setCapabilityValue(capabilityId, valueObj[capabilityId]).catch((error) => {
          this.log('Error setting capability ' + capabilityId + ' on ' + this.getName() + '(' + error.message + ')');
        });
      }
    }
    return true;
  }



  /**
   * Will initialise the states by adding an event when ever a groupedDevice state (capability) is changed.
   * This event will gather the values of the Devices capabilities and then update the group card/mobile values.
   *
   * @returns {Promise<void>}
   */
  async initEvents() {
    this.log('Initialising States for Grouped Devices on ' + this.getName());

    // Store our events, so we can remove them if needed.
    this.events = [];

    // Loop through each of the devices in the group
    for (let x in this.settings.groupedDevices) {

      if (this.settings.groupedDevices.hasOwnProperty(x)) {

        // requires the API, stored in memory - see getDevice() for details.
        let device = await this.getDevice(this.settings.groupedDevices[x]);

        // Store our events, so we can remove them if needed.
        this.events[this.settings.groupedDevices[x]] = async (state) => { this.onStateChange(state, this.settings.groupedDevices[x]); }


        device.makeCapabilityInstance('onoff', (self) => {
          console.log('what is this ???');
          console.log(self);
        });

        // Set our event listener
        // @todo :: when the device is updated - call the event defined above.
        device.on('device.update' , this.events[this.settings.groupedDevices[x]]);
        device.on('$update' , this.events[this.settings.groupedDevices[x]]);
      }
    }
  }


  /**
   * Called when ever the state (capability values) of a groupedDevice is changed.
   *
   * @param state
   * @returns {Promise<void>}
   */
  async onStateChange(state, device) {

    this.log(state);
    // Set which capabilities to update to empty.
    let updateCapabilities = [];

    // Loop through all of the group capabilities and add any items to updateCapabilities which have changed
    // This is how we ignore the state changes made to items not in this group.
    for (let i in this.capabilities) {
      this.log(this.states[device] + ' ::::: ' + state[this.capabilities[i]]);
      // If one of the capabilities with in DG we care about has changed.
      if (this.states[device][this.capabilities[i]] != state[this.capabilities[i]])  {

        updateCapabilities.push(this.capabilities[i]);
      }
    }


    // Update values to the latest ones we have, prior to using the value to set capability values
    this.states[device] = state;


    // If we have changed - go forth and update.
    if (updateCapabilities.length) {
      let values = await this.getDevicesCapabilityValues(updateCapabilities);
      await this.setCardCapabilityValues(values,updateCapabilities);
    }
  }


  /**
   * Get all of the grouped capability values for all of the devices
   *
   * @returns {Promise<void>}
   */
  async getDevicesCapabilityValues(capabilities) {

    let values = [];

    // If no capability is sent set all capabilities.
    capabilities = (capabilities) ? capabilities : this.capabilities;

    // Initialise the values
    for (let i in capabilities) {
      values[capabilities[i]] = [];
    }

    // Loop through each of the devices in the group
    for (let x in this.settings.groupedDevices) {

      // There is a bug where this is called while group devices is empty ..
      // Seems to be prevalent when updating the settings using the API, possibly race condition
      if (this.settings.groupedDevices.hasOwnProperty(x)) {

        // Loop through each of the capabilities checking each of the devices value.
        for (let i in capabilities) {
          values[capabilities[i]].push(this.states[this.settings.groupedDevices[x]][capabilities[i]]);
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
  async setCardCapabilityValues(values, capabilities = false) {

    // If no capability is sent set all capabilities.
    capabilities = (capabilities) ? capabilities : this.capabilities;

    // DEBUG force block scope variable, sanity check for memory debugging. @todo to be removed.
    let a = {key: null, value: null, method : null, type: null}

    // loop through each of the capabilities calculating the values.
    for (let i in capabilities) {
      // Aliases
      a.key = capabilities[i];                                // Alias the capability key
      a.value = values[a.key];                                // Alias the value
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
          this.log('************************************');
          this.log(this.getName() + ': Setting : ' + a.key + ' (' + a.method + ') ' + a.value + ' : ' + values[a.key]); // DEBUG
          await this.setCapabilityValue(a.key, a.value);
        } catch (error) {
          this.log('Error on setting capability value : ' + a.key + ' ' + a.value + ' Error:' +  error.message); // DEBUG

          throw new error;
        }
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
    this.log('Update Device Labels Device Group ' + this.getName());
    let labels = [];

    for (let x in this.settings.groupedDevices) {
      let device = await this.getDevice(this.settings.groupedDevices[x]);
      // @todo this should actually work :: test
      labels.push(device.name);
    }

    await this.setSettings({labelDevices : labels.join(', ')});
    return true;
  }

  /**
   * Will update the capabilities label setting
   *
   * @returns {Promise<boolean>}
   */
  async updateCapabilityLabels() {
    this.log('Update Capability Labels Device Group ' + this.getName());

    let a = {capability: null, method: null};   // Alias
    let labels = [];

    for (let i in this.capabilities) {

      a.capability = Homey.app.library.getCapability(this.capabilities[i]);
      a.method = this.settings.capabilities[this.capabilities[i]].method;

      labels.push(a.capability.title[Homey.app.i18n]);

      // If we have a method assigned, attach it to our description.
      if (a.method) {
        labels[labels.length -1] += ' (' + Homey.app.library.getMethod(a.method).title[Homey.app.i18n] + ')';
      }
    }
    this.log('Setting Capability Labels for ' + this.getName() + ' to ' + labels.join(', '));
    this.setSettings({labelCapabilities : labels.join(', ')});
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

      if (!this.store.hasOwnProperty('version')) {

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
   * On Delete, destroy the events.
   */
  onDeleted() {
    this.log('Deleting  Device Group ' + this.getName());
    this.destroyEvents();
  }

  /**
   * Removes the event listeners upon the devices.
   */
  async destroyEvents() {
    this.log('Destroying Poll Device Group ' + this.getName());

    // Ensure events have been set prior to attempting to delete
    if (this.hasOwnProperty('events')) {

      // Loop ALL grouped devices
      for (let x in this.settings.groupedDevices) {
        if (this.events.hasOwnProperty(this.settings.groupedDevices[x])) {
          let device = await this.getDevice(this.settings.groupedDevices[x]);
          // @todo this should also work, so long as the event is named correctly.
          await device.removeListener('$update', this.events[this.settings.groupedDevices[x]]);
          this.events[this.settings.groupedDevices[x]] = null; // @todo GC should handle this
        }
      }
    }
    return true;
  }
}

module.exports = Device;