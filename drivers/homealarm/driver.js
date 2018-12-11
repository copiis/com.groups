'use strict';

const Group = require('/lib/group');

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
