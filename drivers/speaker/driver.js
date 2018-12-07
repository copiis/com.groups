'use strict';

const Group = require('../group');

class SpeakerDriver extends Group.Driver {

    onPair( socket ) {
        super.onPair(socket);
    }

}

module.exports = SpeakerDriver;
