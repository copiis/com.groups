'use strict';

const Group = require('../group');

class HomeAlarmDriver extends Group.Driver {

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = HomeAlarmDriver;
