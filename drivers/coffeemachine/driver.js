'use strict';

const Group = require('../group');

class CoffeeMachineDriver extends Group.Driver {

    onPair( socket ) {
        this.icons = {};
        this.class = 'coffeemachine';
        super.onPair(socket);
    }

}

module.exports = CoffeeMachineDriver;
