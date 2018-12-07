'use strict';

const Group = require('../group');

class CoffeeMachineDriver extends Group.Driver {

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = CoffeeMachineDriver;
