function logMessage(message) {
    console.info(message);
}

function getResponse(url, cfunction) {
    try {
        var xmlhttp = new XMLHttpRequest();
        var jsonData = {};
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                jsonData = this.responseText;
                cfunction(JSON.parse(jsonData)["data"]); 
            }
        };
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    } catch (error) {
        logMessage(error);
    }
}


function sortByValue(jsObj, reverse = false) {
    var sortedArray = [];
    for (var i in jsObj) {
        sortedArray.push([jsObj[i], i]);
    }
    if (reverse) {
        return sortedArray.sort(function (a, b) { return b[0] - a[0] });
    } else {
        return sortedArray.sort();
    }
}

function showElement(elementId) {
    var el = document.getElementById(elementId);
    el.style.display = "block";
}

function hideElement(elementId) {
    var el = document.getElementById(elementId);
    el.style.display = "none";
}

function getDateString(dateObj, formatType = "yyyy-mm-dd") {
    let dateNum = Number(dateObj.getDate());
    let monthNum = Number(dateObj.getMonth()) + 1;
    var day = dateNum < 10 ? '0' + String(dateNum) : String(dateNum);
    var month = monthNum < 10 ? '0' + String(monthNum) : String(monthNum);
    var year = dateObj.getFullYear();
    if (formatType == "mm/dd/yyyy") {
        return `${month}/${day}/${year}`
    }
    return `${year}-${month}-${day}`;
}

function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
}
