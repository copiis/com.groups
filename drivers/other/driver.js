'use strict';

const Group = require('../group');

class OtherDriver extends Group.Driver {

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = OtherDriver;
