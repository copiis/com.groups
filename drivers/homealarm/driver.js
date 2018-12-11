'use strict';

const Group = require('../group');

class HomeAlarmDriver extends Group.Driver {

    onInit() {

        this.class = 'homealarm';

        super.onInit();
    }

    onPair( socket ) {
        super.onPair(socket);
    }
}

module.exports = HomeAlarmDriver;
