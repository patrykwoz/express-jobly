// Required module for error handling.
const { BadRequestError } = require("../expressError");

/**
 * Generates SQL for partial update query.
 * 
 * This function takes an object representing data to be updated and 
 * an object that maps JavaScript object keys to database column names. 
 * It constructs a string for use in a SQL UPDATE statement and 
 * an array of values for parameterized query execution.
 * 
 * @param {Object} dataToUpdate - Object where keys represent the column names
 *                                to be updated and the values represent the new
 *                                data for those columns.
 * @param {Object} jsToSql - Object mapping JavaScript style camelCase 
 *                           property names to SQL style snake_case column names.
 * 
 * @returns {Object} Contains two properties:
 *                   - setCols: String, formatted column assignments for SQL UPDATE,
 *                   - values: Array, values corresponding to the setCols placeholders.
 * 
 * @throws {BadRequestError} If no data is provided for update (dataToUpdate is empty).
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // Extract keys from the dataToUpdate object.
  const keys = Object.keys(dataToUpdate);
  // Throw an error if no keys are found (empty object).
  if (keys.length === 0) throw new BadRequestError("No data");

  // Convert dataToUpdate object into SQL column format and pair with placeholders.
  // Example: {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  // Return object containing SQL column strings and corresponding values.
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

// Exports the sqlForPartialUpdate function for use in other modules.
module.exports = { sqlForPartialUpdate };
