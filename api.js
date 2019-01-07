const Homey = require('homey');

module.exports = [
  {
    // Get all groups.
    method : 'GET',
    path   : '/group',
    fn     : async (args) => {
      let groups = await Homey.app.getGroups();
      return groups.map(group => ({
        id    : group.getData().id,
        name  : group.getName(),
        class : group.getClass(),
      }));
    }
  },
  {
    // Get a specific group.
    method : 'GET',
    path   : '/group/:id',
    fn     : async (args) => {
      let group = await Homey.app.getGroup(args.params.id);
      return {
        id           : args.params.id,
        name         : group.getName(),
        class        : group.getClass(),
        capabilities : group.getCapabilities(),
        data         : group.getData(),
        settings     : group.getSettings(),
      };
    }
  },
  {
    // Update the devices in a  group.
    method : 'PUT',
    path   : '/group/:id',
    fn     : async (args) => {
      await Homey.app.setDevicesForGroup(args.params.id, args.body);
    }
  },
  {
    // Update the group capability methods.
    method : 'PUT',
    path   : '/group/:id/capabilities',
    fn     : async (args) => {
      await Homey.app.setMethodForCapabilityOfGroup(args.params.id, args.body);
    }
  },
  {
    // Get a specific group.
    method : 'GET',
    path   : '/category/:id',
    fn     : async (args) => {
      let groups = await Homey.app.getCategory(args.params.id);
      if (groups) {
        // return groups;
        // groups = Object.values(groups);

        for (let g in groups) {
          groups[g].name = groups[g].getName();
          groups[g].class = args.params.id;
          groups[g].capabilities = groups[g].getCapabilities();
          groups[g].data         = groups[g].getData();
          groups[g].settings     = groups[g].getSettings();
        }
       return groups;
      }
      return false;
    }
  },
  {
    // Get a specific group.
    method : 'GET',
    path   : '/newGroups',
    fn     : async (args) => {
      return await Homey.app.getNewGroups();

    }
  },
  {
    // Get a list of all devices.
    method : 'GET',
    path   : '/devices',
    fn     : async (args) => {
      let devices = await Homey.app.getDevices();
      return Object.values(devices);
    }
  },
  {
    method : 'GET',
    path   : '/library',
    fn     : async (args) => {
      return await Homey.app.library.getJSON();
    }
  },
  {
    // We cant save the settings using  await api.devices.setDeviceSettings({id: args.params.id, settings: args.body});
    // As the SDK doesnt have this scope to the webAPI.

    // We cant save the setting using await Homey.ManagerDrivers.getDriver(driver).getDevice({id});
    // Because Athom have now made the getDevice to require the 'data' as a paramater rather then the Id.
    // and the data is always undefined.

    // So we have to get all the devices, then find the one we want, and then
    method : 'PUT',
    path   : '/settings/:driver',
    fn     : async (args) => {
      let group = await Homey.ManagerDrivers.getDriver(args.params.driver).getDevice(args.body.settings.data);
      let result = await group.setSettings(args.body.settings);
      await group.refresh();
      return result;
      // let api =  await Homey.app.getApi();
      // return await api.devices.setDeviceSettings({id: args.params.id, settings: args.body});
    }
  }
]
