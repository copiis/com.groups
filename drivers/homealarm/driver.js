'use strict';

const Group = require('../group');

class HomeAlarmDriver extends Group.Driver {

    onPair( socket ) {
        this.icons = {};
        this.class = 'homealarm';
        super.onPair(socket);
    }

}

module.exports = HomeAlarmDriver;
