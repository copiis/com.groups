'use strict';

const Group = require('../group');

class SocketDriver extends Group.Driver {


    onInit() {
        this.class = 'socket';
        super.onInit();
    }

    onPair( socket ) {
        this.icons = {
            '/app/com.groups/assets/icons/socket/f.svg' : this.appRoot + 'assets/icons/socket/f.svg',
            '/app/com.groups/assets/icons/socket/i.svg' :  this.appRoot + 'assets/icons/socket/i.svg',
            '/app/com.groups/assets/icons/socket/k.svg' :  this.appRoot + 'assets/icons/socket/k.svg',
            '/app/com.groups/assets/icons/socket/wall.svg' :  this.appRoot + 'assets/icons/socket/wall.svg',
        };


        super.onPair(socket);
    }

}

module.exports = SocketDriver;
