# Groups [v2.0.108]

With this app you can group devices with the same capabilities as one device. This means you an control multiple devices from the one place.

---

Please note that this app now only supports v2, while legacy code should continue to work, new installations are not possible nor supported.

## Notes

When upgrading from Homey v1 to Homey v2, you will have to re-create your groups.

Stable - Currently set to v1.1.
Beta - Currently set to v1.1. Generally stable, final testing prior to roll out to stable.
Alpha - Generally stable, with latest changes stage for beta, items may change.
Omega - The highly appreciated testers, get features and bug fixes as they happen.

## Using

1. After installing, to add a new Group, click  + (add) upon the devices tab select "Group".
2. Now select the group device's class. (e.g. Light).
3. You will now see all the capabilities supported by this class. Now chose the ones you need. (e.g. Turned on" and "Dim level", "Temperature" ).
4. On this page you will find all devices that have the capabilties you selected, simply select the devices you want to group.
5. On this final page you change change the icon of the device if you would like, or select next to use the default.
6. Now you have one device to control all the grouped devices.

## Feature List :

###  :white_check_mark: Groups different  (or the same) devices together
You can group as many devices as you would like together, allowing them all to be controlled / or viewed as one device.

_eg. Group all the lights in your house and control the all at once, either as a device or flow_
_eg. Group all your contact sensors and be able to see if any doors or windows have been left open_
_eg. Group all your temperature sensors and if the average temp of your house goes down, turn on the heater_

### :white_check_mark: Simplify your flows
Simplify your flows by adding a group to any part of the flow and have the action carried out upon the entire group.

_eg. If any motion sensor detects motion then turn on all the lights in your house  _
_eg. If the sum of power used by all devices is greater 700W then turn set all the heaters in your house for 5 min _


### :white_check_mark: Enhance your flows
Enhance your flows by having them only trigger when you want, you can even make it so that a group will only turn on if the (sum, average, mean average, min, max) meets a criteria.

###  :white_check_mark: Supports most device classes
You can now add groups for any category from kettles to sensors and everything between 18 categories are supported, the rest to be added once available in Homey 2.

### :white_check_mark: Now supports all device capabilities
All standard device capabilities are now supported, this means that you can now group anything from  temperature sensors, lux sensors, motion alarms, vacuum cleaner states, power measurements. All 72 capabilities have been added.

### :white_check_mark: Give feedback on device status

Your group cards will now give feedback if something changes with in the group, either in or outside of the Homey App.

_eg. In a grouped set of Hue lights, if you change the colour of the lights to red with in the Hue app, your device group card will now show as red._

<ins>This is working, however some people (including me) are experiencing an issue where the gen 2 app is not updating devices</ins>

### :negative_squared_cross_mark: Choose how information is display method

You can now choose how each groups capability will be reported back to you.

_eg. Set the grouped temperature sensors to show the average temperature, but the highest humidity value._
_eg. Show the total amount of power used for all grouped lights, but median average dim levels_
_eg. Only set the light card on if all lights are on, but turn on the grouped motion sensors if any detect motion._

<ins>Currently disabled while awaiting Athom to fix [this issue](https://github.com/athombv/homey-apps-sdk-issues/issues/4).</ins>

### :negative_squared_cross_mark: See more information, quicker.
You can now click on a group's settings to see which devices, which capabilities have been included and which method is being used to display the results. As always you can still change the values from the app settings, along with which method is being used.

<ins>Currently disabled while awaiting Athom to an issue with the Gen2 App - [https://support.athom.com/hc/en-us/requests/new](http://click here) and ask for Athom to fix this issue.</ins>

### :negative_squared_cross_mark: hoose your language.
Added (technical) support for NL, please note - I don't speak Dutch, and adding translations is a work in progress.


### Other

Lots of other small fixes, and features

Otherwise everything else is as advertised in the post, hit me up on Slack (@jamie) if you have any questions or issues.

Finally if you could let me know what does work, as well as what doesn’t, it would be really helpful as I am unable to test some devices myself.

## Bugs

Please report all issues, bugs, enhancements and features here :

https://github.com/hive/com.groups/issues

See the complete change logs here :

https://github.com/hive/com.groups/


#### Images

![image|281x499](upload://4L9fRI7M73Q3Na1lCXq9okP7bPd.png)
![image1(3)|281x499](upload://rtE0RAmbDzgnTeQOQQG7xD0zI68.jpeg)
![image1(4)|281x499](upload://eOK5qSUEAnhCkuhfxdmHyIrERaI.png)