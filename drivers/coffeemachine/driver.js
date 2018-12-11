'use strict';

const Group = require('../group');

class CoffeeMachineDriver extends Group.Driver {

    onInit( ) {

        this.class = 'coffeemachine';

        super.onInit();
    }

    onPair( socket ) {
        super.onPair(socket);
    }
}

module.exports = CoffeeMachineDriver;
