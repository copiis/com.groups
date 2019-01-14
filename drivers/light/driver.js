'use strict';

const Group = require('/lib/group');

class LightDriver extends Group.Driver {

    onInit( ) {

        this.class = 'light';

        super.onInit();

    }

    onPair( socket ) {
        console.log('<LightDriver:onPair>');
        super.onPair(socket);

    }
}

module.exports = LightDriver;
