'use strict';

var JSONFormatter = require('../../../app/scripts/modules/ui/JSONFormatter.js');

var mockData = {
    title: 'Example Schema',
    type: 'object',
    properties: {
        firstName: {
            type: 'string'
        },
        lastName: {
            type: 'string'
        },
        age: {
            description: 'Age in years',
            type: 'integer',
            minimum: 0
        }
    },
    required: ['firstName', 'lastName'],
    boolean: true,
    null: null
};

describe('JSONFormatter', function () {
    var fixtures = document.getElementById('fixtures');

    beforeEach(function () {
        // Create HTML elements from mockData object
        fixtures.innerHTML = JSONFormatter.formatJSONtoHTML(mockData);
    });
    afterEach(function () {
        fixtures.innerHTML = '';
    });

    it('should create HTML elements from JSON object', function () {
        // Get all created elements from JSONFormater
        var result = JSON.parse(fixtures.firstChild.innerText);

        // Stringify the result, so that it can be compared to the mockData
        result = JSON.stringify(result);

        // Compaction
        result.should.equal(JSON.stringify(mockData));
    });
});
