'use strict';

const Group = require('/lib/group');

class HeaterDriver extends Group.Driver {


    onInit() {

        this.class = 'heater';

        super.onInit();
    }

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = HeaterDriver;
