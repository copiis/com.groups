
# Group

With this app you can group devices with the same capabilities as one device.

1. After installing, to add a new Group, click  + (add) upon the devices tab select "Group".
2. Now select the group device's class. (e.g. Light).
3. You will now see all the capabilities supported by this class. Now chose the ones you need. (e.g. Turned on" and "Dim level", "Temperature" ).
4. On this page you will find all devices that have the capabilties you selected, simply select the devices you want to group.
5. On this final page you change change the icon of the device if you would like, or select next to use the default.
6. Now you have one device to control all the grouped devices.

### Group Settings

There are two sets of settings associated with device groups, first the settings are available from the group, which offers overview information only.
The second more important method is currently unavailable due to a bug in the Homey v2 core.

### Contributions

This app is based off of the original 'Device Groups' app by Swttt for Homey v1.

### Changelog


##### 2.1

- 2.1.0 : Update settings to use new i18n subsystem.
- 2.1.1 : Settings Update
- New UI
- Bug Fixes



##### 2.0

- 2.1.2 : Convert settings to full webAPI implementation.
- 2.1.1 : Settings concept
- 2.1.0 : Settings UX
- 2.0.2 : Beta Release
- 2.0.1 : Disabled changing a devices settings.
- 2.0.1 : Added support for choosing an icon.
- 2.0.1 : Standardised the classes and inheritance.
- 2.0.1 : Updated code to use the new makeCapabilityInstance
- 2.0.1 : Keeps track created/deleted devices refreshes device cache
- 2.0.1 : Updated code base to Homey v2 Spec
- 2.0.1 : Reliability, Stability and Performance
- 2.0.0 : Feedback on device status
- 2.0.0 : Added Ability to group read only capabilities.
- 2.0.0 : Allow device status to be calculated from grouped devices
- 2.0.0 : Device Classes (Categories) & Capabilities will now display correct name rather than tag.
- 2.0.0 : Device Classes (Categories) & Capabilities now support en/nl languages.
- 2.0.0 : Addition of all new categories
- 2.0.0 : Addition of all new capabilities
- 2.0.0 : Groups will now refresh and update their devices immediately when changed in the settings, rather then waiting for  restart.
- 2.0.0 : Added class and capabilities to the device settings page, with in devices, Read Only.
- 2.0.0 : Change calculated method from the settings
- 2.0.0 : Added the ability to store your notes against a device group.
- 2.0.0 : Added i18n support to the device settings page labels, currently support en only.

##### 1.1

- 1.1.0 : Change grouped devices via settings

##### 1.0

- 1.0.0 : Ability to group settable devices

---

For all questions, suggestions and support please visit :

https://community.athom.com/t/groups-v1-0/3168/27