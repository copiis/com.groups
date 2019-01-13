
# Group

With this app you can group devices with the same capabilities as one device.

1. After installing, to add a new Group, click  + (add) upon the devices tab select "< group >".
2. Now select the group device's class. (e.g. Light).
3. You will now see all the capabilities supported by this class. Now chose the ones you need. (e.g. Turned on" and "Dim level", "Temperature" ).
4. On this page you will find all devices that have the capabilities you selected, simply select the devices you want to group.
5. On this final page you change change the icon of the device if you would like, or select next to use the default.
6. Now you have one device to control all the grouped devices.

### Group Settings

There are two sets of settings associated with device groups, first the settings are available from the group, which offers overview information only.
The second more important method is currently unavailable due to a bug in the Homey v2 core.

### Contributions

This app is based off of the original 'Device Groups' app by Swttt for Homey v1.

### Changelog

**2.1.7**
- NL transactions, pairing fixes.
- Code consolidation and clean up
- Remove superfluous information from library
-

**2.1.6**
- Now polls grouped devices to ensure they are running/ready
- Consistent loader icon between pair/settings.

**2.1.5**
- Add Breadcrumb to settings, WIP
- Update app Icon
- Update app image
- Add Changelog
- Add local css/js files
- In app settings - Hide breadcrumbs if there are no groups

**2.1.4**
- Set Settings back to devices

**2.1.3**
- Get methods and devices.

**2.1.2**
- Convert settings to full webAPI implementation.

**2.1.1**
- Settings UX concept

**2.1.0**
- Update settings to use new i18n subsystem.

**2.0.2**
- Beta Release

**2.0.1**
- Disabled changing a devices settings.
- Added support for choosing an icon.
- Standardised the classes and inheritance.
- Updated code to use the new makeCapabilityInstance
- Keeps track created/deleted devices refreshes device cache
- Updated code base to Homey v2 Spec
- Reliability, Stability and Performance

**2.0.0**
- Feedback on device status
- Added Ability to group read only capabilities.
- Allow device status to be calculated from grouped devices
- Device Classes (Categories) & Capabilities will now display correct name rather than tag.
- Device Classes (Categories) & Capabilities now support en/nl languages.
- Addition of all new categories
- Addition of all new capabilities
- Groups will now refresh and update their devices immediately when changed in the settings, rather then waiting for  restart.
- Added class and capabilities to the device settings page, with in devices, Read Only.
- Change calculated method from the settings
- Added the ability to store your notes against a device group.
- Added i18n support to the device settings page labels, currently support en only.

**1.1.0**
- Change grouped devices via settings

**1.0.0**
- Ability to group settable devices

---

For all questions, suggestions and support please visit :

https://community.athom.com/t/groups-v1-0/3168/27