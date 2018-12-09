'use strict';

const Group = require('../group');

class SpeakerDriver extends Group.Driver {

    onPair( socket ) {
        this.icons = {};
        this.class = 'speaker';
        super.onPair(socket);
    }

}

module.exports = SpeakerDriver;
