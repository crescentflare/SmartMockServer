// Parameter matching
// Checks for matching parameters to determine if an alternative should be used
// Supports wildcard matching
//////////////////////////////////////////////////

'use strict';


//////////////////////////////////////////////////
// Initialization
//////////////////////////////////////////////////

// ParamMatcher constructor
function ParamMatcher() {
}


//////////////////////////////////////////////////
// Internal pattern matching
//////////////////////////////////////////////////

// Check if the pattern matches
ParamMatcher.patternEquals = function(value, pattern) {
    if (value.length != pattern.length) {
        return false;
    }
    for (var i = 0; i < pattern.length; i++) {
        if (pattern[i] != '?' && value[i] != pattern[i]) {
            return false;
        }
    }
    return true;
}

// Search for the first occurrence of the pattern within the value (with optional wildcard ? symbols)
ParamMatcher.searchPattern = function(value, pattern) {
    if (pattern.length == 0) {
        return 0;
    }
    for (var i = 0; i < value.length; i++) {
        if (pattern[0] == '?' || value[i] == pattern[0]) {
            if (ParamMatcher.patternEquals(value.substring(i, i + pattern.length), pattern)) {
                return i;
            }
        }
    }
    return -1;
}

// Check if the given pattern sets (splitted by wildcard symbol *) are found within the value
ParamMatcher.searchPatternSet = function(value, patternSet) {
    while (patternSet.length > 0 && patternSet[0].length == 0) {
        patternSet = patternSet.slice(1);
    }
    if (patternSet.length == 0) {
        return 0;
    }
    var startPos = 0, pos = 0;
    var searching = false;
    do {
        searching = false;
        pos = ParamMatcher.searchPattern(value.substring(startPos), patternSet[0]);
        if (pos >= 0) {
            if (patternSet.length == 1) {
                if (startPos + pos + patternSet[0].length == value.length) {
                    return startPos + pos;
                }
            } else {
                var nextPos = startPos + pos + patternSet[0].length;
                var setPos = ParamMatcher.searchPatternSet(value.substring(nextPos), patternSet.slice(1));
                if (setPos >= 0) {
                    return startPos + pos;
                }
            }
            startPos += pos + 1;
            searching = true;
        }
    }
    while (searching);
    return -1;
}


//////////////////////////////////////////////////
// String or object matching
//////////////////////////////////////////////////

// Check if the parameter matches the required param (the required param can have wildcard symbols, like * and ?)
ParamMatcher.paramEquals = function(requireParam, haveParam) {
    if (!haveParam) {
        return false;
    }
    var patternSet = requireParam.split('*');
    if (patternSet[0].length > 0 && !ParamMatcher.patternEquals(haveParam.substring(0, patternSet[0].length), patternSet[0])) {
        return false;
    }
    return ParamMatcher.searchPatternSet(haveParam, patternSet) >= 0;
}

// Does a 'param' match against all (nested) elements in the given objects
ParamMatcher.deepEquals = function(requireObject, haveObject) {
    var wantKeys = Object.keys(requireObject);
    for (var index in wantKeys) {
        var key = wantKeys[index];
        if (haveObject[key] == null ) {
            return false;
        } else if (typeof haveObject[key] == typeof requireObject[key] && typeof haveObject[key] == "object") {
            if (!ParamMatcher.deepEquals(requireObject[key], haveObject[key])) {
                return false;
            }
        } else if (!ParamMatcher.paramEquals("" + requireObject[key], "" + haveObject[key])) {
            return false;
        }
    }
    return true;
}

// Export
exports = module.exports = ParamMatcher;
