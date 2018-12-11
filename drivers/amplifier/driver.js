'use strict';

const Group = require('../group');

class AmplifierDriver extends Group.Driver {


    onInit( ) {

        this.class = 'amplifier';

        super.onInit();
    }

    onPair( socket ) {
        super.onPair(socket);
    }
}

module.exports = AmplifierDriver;
