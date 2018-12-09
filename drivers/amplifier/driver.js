'use strict';

const Group = require('../group');

class AmplifierDriver extends Group.Driver {

    onPair( socket ) {
        this.icons = {};
        this.class = 'amplifier';
        super.onPair(socket);
    }

}

module.exports = AmplifierDriver;
