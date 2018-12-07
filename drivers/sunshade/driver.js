'use strict';

const Group = require('../group');

class SunshadeDriver extends Group.Driver {

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = SunshadeDriver;
