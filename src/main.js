const pick = require('lodash.pick');
const has = require('lodash.has');

const isEmpty = value => {
	return (
		value == null ||
	  	(typeof value === 'object' && Object.keys(value).length === 0) ||
	  	(typeof value === 'string' && value.trim().length === 0)
	)
  }

const isObject = a => a instanceof Object

/**
 * This method compares the properties of two objects
 * It returns all the different and common properties
 *
 * @param firstObject
 * @param secondObject
 * @return {Object}
 */
// CompareProperties -
const CompareProperties = (firstObject, secondObject) => {
	let differences = [];
	let common = {};
	Object.keys(firstObject).forEach((key) => {
		if (!has(secondObject, key)) {
			differences.push(key);
		} else {
			common[key] = true;
		}
	});

	Object.keys(secondObject).forEach((key) => {
		if (!has(firstObject, key)) {
			differences.push(key);
		} else {
			common[key] = true;
		}
	});

	return {
		differences: differences,
		common: Object.keys(common)
	}
};

/**
 * This method compares two arrays
 * It returns true/false
 *
 * @param firstArray
 * @param secondArray
 * @return {boolean}
 */
// CompareArrays -
const CompareArrays = (firstArray, secondArray) => {
	// check for falsy
	if (!firstArray || !secondArray) {
		return false;
	}

	// must have the same length
	if (firstArray.length !== secondArray.length) {
		return false;
	}

	let ok = true;
	// process arrays
	firstArray.forEach((firstElement, index) => {
		if (Array.isArray(firstElement) && Array.isArray(secondArray[index])) {
			if (!CompareArrays(firstElement, secondArray[index])) {
				ok = false;
				return;
			}
		} else if (isObject(firstElement) && isObject(secondArray[index])) {
			if (JSON.stringify(firstElement) !== JSON.stringify(secondArray[index])) {
				ok = false;
				return;
			}
		} else {
			if (firstElement !== secondArray[index]) {
				ok = false;
				return;
			}
		}
	});

	return ok;
};

/**
 * This method compares the properties of two objects
 * It returns an array. Each element in the array is the path of the property that is different.
 *
 *
 * @param firstObject
 * @param secondObject
 * @param pathOfConflict - the starting path for the conflict; defaults to empty string
 * @return {boolean}
 */
// CompareValuesWithConflicts -
const CompareValuesWithConflicts = (firstObject, secondObject, pathOfConflict) => {
	let conflicts = [];

	if (Object.keys(firstObject).length !== Object.keys(secondObject).length) {
		let result = CompareProperties(firstObject, secondObject);
		if (result && result.differences) {
			conflicts = conflicts.concat(result.differences);
		}

		if (result && result.common) {
			firstObject = pick(firstObject, result.common);
			secondObject = pick(secondObject, result.common);
		}
	}

	Object.keys(firstObject).forEach((key) => {
		let conflictPath = pathOfConflict;
		if (has(firstObject, key) && has(secondObject, key)) {

			// process nested object
			if (isObject(firstObject[key]) && !Array.isArray(firstObject[key])) {
				let currentPath = conflictPath;
				if (isEmpty(conflictPath)) {
					currentPath = key.toString();
				} else {
					currentPath += '.' + key.toString();
				}
				let foundConflicts = CompareValuesWithConflicts(firstObject[key], secondObject[key], currentPath);
				if (!isEmpty(foundConflicts)) {
					conflicts = conflicts.concat(foundConflicts);
				}
			}

			// process array
			else if (Array.isArray(firstObject[key])) {
				if (!Array.isArray(secondObject[key])) {
					if (isEmpty(conflictPath)) {
						conflictPath = key.toString();
					} else {
						conflictPath += '.' + key.toString();
					}
				} else {
					if (!CompareArrays(firstObject[key], secondObject[key])) {
						if (isEmpty(conflictPath)) {
							conflictPath = key.toString();
						} else {
							conflictPath += '.' + key.toString();
						}
					}
				}
			}

			// process simple object
			else {
				if (typeof firstObject[key] === typeof secondObject[key] && firstObject[key] !== secondObject[key]) {
					if (isEmpty(conflictPath)) {
						conflictPath = key.toString();
					} else {
						conflictPath += '.' + key.toString();
					}
				}
			}
		} else {
			conflicts.push(key);
		}

		// add conflict path to array if different than original path
		if (!isEmpty(conflictPath) && conflictPath !== pathOfConflict) {
			conflicts.push(conflictPath);
		}
	});
	return conflicts;
};

module.exports = {
	CompareProperties,
	CompareArrays,
	CompareValuesWithConflicts,
};
