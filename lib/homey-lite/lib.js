'use strict';

const Capabilities = require('./lib/capability');
const Categories = require('./lib/category');
const Methods = require('./lib/method');

class Lib {

    get capability () {
        return Capabilities;
    }

    get category () {
        return Categories;
    }

    get method () {
        return Methods;
    }

    getCapabilities() {
        return Capabilities.getCapabilities();
    }

    getCapability(id) {
        return Capabilities.getCapability(id);
    }

    getCapabilityMethods(id) {
        return Capabilities.getMethods(id);
    }

    getCategories() {
        return Categories.getCategories();
    }

    getCategory(id) {
        return Categories.getCategory(id);
    }

    getCategoryCapabilities(id) {
        return Categories.getCapabilities(id);
    }

}

module.exports = Lib;