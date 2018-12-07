'use strict';

const Group = require('../group');

class AmplifierDriver extends Group.Driver {

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = AmplifierDriver;
