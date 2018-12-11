'use strict';

const Group = require('../group');

class KettleDriver extends Group.Driver {

    onInit() {

        this.class = 'kettle';

        super.onInit();
    }

}

module.exports = KettleDriver;
