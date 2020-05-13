// import React from 'react';

import constants from "./constants";

export function getFormattedDescription(description) {
    try {
        var descElWidth = 500;
        var descLength = description.length;
        var descClipped = description;

        if (descLength > descElWidth) {
            var words = description.split(" ");
            var wordsSubset = [];
            var currentlength = 0;
            var startIndex = 0;
            var endIndex = 0;
            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                currentlength += word.length;
                if (currentlength > descElWidth) {
                    endIndex = i;
                    break;
                }
                currentlength += 1; //account for space
            }
            wordsSubset = words.slice(startIndex, endIndex);
            descClipped = wordsSubset.join(" ") + "...";
        }
        return descClipped;
    } catch (error) {
        console.log(error);
    }
}

export function showArticleDescArrow(description, numLines = 4) {
    if (description && description.length > 0) {
        var descLines = description.split('.');
        const actualNumLines = descLines.length;
        if (actualNumLines > numLines) {
            return '';
        }
    }
    return 'hide';
}


export function getDescriptionByLines(description, numLinesAfter=0) {
    try {
        var numLines = 4;
        var descClipped = description;
        console.log('description:', description)
        if (description && description.length > 0) {
            var descLines = description.split('. ');
            const actualNumLines = descLines.length;

            var descResult = [];
            // console.log('actualNumLines:', actualNumLines, 'numLinesAfter+1:', numLinesAfter+1, 'numLines:', numLines)
            if (actualNumLines > 4 && numLinesAfter > 0) {
                for (let i = 4; i < actualNumLines-1; i++) {
                    const desc = descLines[i] + '. ';
                    descResult.push(desc);
                }
                if(actualNumLines-1 > 4){
                    descResult.push(descLines[actualNumLines-1]);
                }
                return descResult;
            } else if (numLinesAfter == 0) {
                if (actualNumLines > numLines) {
                    for (let i = 0; i < numLines; i++) {
                        const desc = descLines[i] + '. ';
                        descResult.push(desc);
                    }
                    return descResult;
                }
            }
        }
        return descClipped;
    } catch (error) {
        console.log(error);
    }
}

export function getDateString(dateStr, formatType = "yyyy-mm-dd") {
    let dateObj = new Date(dateStr);
    let dateNum = Number(dateObj.getDate());
    let monthNum = Number(dateObj.getMonth()) + 1;
    var day = dateNum < 10 ? '0' + String(dateNum) : String(dateNum);
    var month = monthNum < 10 ? '0' + String(monthNum) : String(monthNum);
    var year = dateObj.getFullYear();
    if (formatType === "mm/dd/yyyy") {
        return `${month}/${day}/${year}`
    }
    return `${year}-${month}-${day}`;
}

export function getURL(serverUrl, source = 'nytimes', section = 'home', articleId = '', query = '') {
    let url = serverUrl;

    if (source === 'nytimes' || source === null) {
        url += '/nytimes';
    } else {
        url += '/guardian';
    }

    if (articleId !== '') {
        url += '/' + articleId;
        return url;
    }

    if (section !== 'home' && section !== '') {
        url += '/' + section;
    }

    if (query !== '') {
        url += '/' + query;
    }

    return url;
}

export function strip(str) {
    return str.replace(/^\s+|\s+$/g, '');
}

export async function wait(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

export function getResponse(url, headers, cfunction) {
    try {
        var xmlhttp = new XMLHttpRequest();
        var jsonData = {};
        xmlhttp.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                jsonData = this.responseText;
                console.log("Data:", JSON.parse(jsonData))
                cfunction(jsonData);
            }
        };
        xmlhttp.open("GET", url, true);
        if (headers) {
            for (let i = 0; i < headers.length; i++) {
                const headerData = headers[i];
                xmlhttp.setRequestHeader(headerData.header, headerData.value);
            }
        }
        xmlhttp.send();
    } catch (error) {
        console.log(error);
    }
}

export function showSwitch(location) {
    var r1 = /\/article\//g;
    var r2 = /\/search\//g;
    var r3 = /\/favourites/g;
    // console.log('location:', location);
    if (location) {
        if (location.match(r1)) {
            return false;
        }
        else if (location.match(r2)) {
            return false;
        } else if (location.match(r3)) {
            return false;
        }
    }
    return true;
}

export function isSearchPage(location) {
    var r1 = /\/search/g;
    if (location) {
        if (location.match(r1)) {
            return true;
        }
    }
    return false;
}

export function isFavouritePage(location) {
    var r1 = /\/favourites/g;
    if (location) {
        if (location.match(r1)) {
            return true;
        }
    }
    return false;
}

export function getLocationArticleId(location) {
    var r1 = /\/article\/(.*)/;
    if (location) {
        let url = location.match(r1);
        if (url && url.length === 2) {
            return url[1];
        }
    }
    return '';
}

export function getExactProp(label) {
    if (label == 'home') { return true; }
    return false;
}

export function getAppSource(){
    var source = '';
    if(localStorage.getItem('appsource') !== null){
        source = localStorage.getItem('appsource');
    } else {
        source = constants.source.defaultSource;
        localStorage.setItem('appsource', source);
    }
    return source;
}

export function setAppSource(sourceValue) {
    localStorage.setItem('appsource', sourceValue);
}