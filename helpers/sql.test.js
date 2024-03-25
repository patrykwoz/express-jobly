const { sqlForPartialUpdate } = require('./sql');
const { BadRequestError } = require('../expressError');

describe('sqlForPartialUpdate', () => {
    test('works: returns proper SQL for single item update', () => {
        const result = sqlForPartialUpdate(
            { firstName: 'Test' },
            { firstName: 'first_name' }
        );
        expect(result).toEqual({
            setCols: '"first_name"=$1',
            values: ['Test'],
        });
    });

    test('works: returns proper SQL for multiple items update', () => {
        const result = sqlForPartialUpdate(
            { firstName: 'Test', lastName: 'Tester', age: 30 },
            { firstName: 'first_name', lastName: 'last_name' }
        );
        expect(result).toEqual({
            setCols: '"first_name"=$1, "last_name"=$2, "age"=$3',
            values: ['Test', 'Tester', 30],
        });
    });

    test('throws BadRequestError with empty data', () => {
        expect(() => {
            sqlForPartialUpdate({}, {})
        }).toThrow(BadRequestError);
    });

    // Test to check handling of fields not explicitly mapped in jsToSql
    test('works: handles fields not mapped in jsToSql', () => {
        const result = sqlForPartialUpdate(
            { firstName: 'Test', country: 'Neverland' },
            { firstName: 'first_name' } // Note: 'country' is not mapped
        );
        expect(result).toEqual({
            setCols: '"first_name"=$1, "country"=$2',
            values: ['Test', 'Neverland'],
        });
    });
});
