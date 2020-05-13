// static variables
let server = ""
var properties = {
    "api": {
        "newsHeadlines": server + "news_headlines",
        "stopWords": server + "stop_words",
        "titles": server + "word_cloud",
        "sources": server + "news_sources",
        "everything": server + "news_all"
    },
    "id": {
        "sliderParent": "slider",
        "cnnCards": "cnn-cards",
        "foxNewsCards": "fox-news-cards",
        "page1": "page1",
        "page2": "page2",
        "googleNewsButton": "google-news-button-id",
        "searchButton": "search-button-id",
        "form": "form-data",
        "sourceDropDown": "source",
        "content": "content",
        "showMoreButton": "show-more",
        "showLessButton": "show-less",
        "sourcesDropDown": "source",
        "categoryDropDown": "category",
        "noContent": "no-content-id"
    },
    "css": {
        "sliderItems": "slider-item",
        "sliderTitle": "slider-title",
        "sliderDescription": "slider-description",
        "content": {
            "imageWrapper": "image-wrapper",
            "image": "content-image",
            "title": "content-title",
            "textWrapper": "text-wrapper",
            "description": "content-desc",
            "descriptionClip": "content-desc-clip",
            "parent": "content-card",
            "extraInfo": "extra-info",
            "closeButton": "close-button",
            "closeButtonWrapper": "close-button-wrapper",
            "contentWrapper": "content-wrapper"
        },
        "flex": {
            "column": "flex-column"
        }
    },
    "color": {
        "defaultButton": "#f3f3f4",
        "chosenButton": "#555555"
    },
    "text": {
        "showMore": "Show More",
        "showLess": "Show Less",
        "defaultStartDate": '',
        "defaultEndDate": ''
    }
}

function getCarouselDataHelper() {
    getResponse(properties.api.newsHeadlines, generateCarouselElement);
}

var slideIndex = 0;
function showSlides() {
    try {
        var i;
        var slides = document.getElementsByClassName("slider-item");
        for (i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";
        }
        slideIndex++;
        if (slideIndex > slides.length) { slideIndex = 1 }
        slides[slideIndex - 1].style.display = "block";
        setTimeout(showSlides, 2000);
    } catch (error) {
        logMessage(error);
    }
}

function generateCarouselElement(data) {
    try {
        data = data.slice(0, 5);
        var x = document.getElementsByClassName(properties.css.sliderItems);
        var sliderTitles = document.getElementsByClassName(properties.css.sliderTitle);
        var sliderDescription = document.getElementsByClassName(properties.css.sliderDescription);
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            x[i].children[0].src = item["urlToImage"];
            x[i].parentElement.href = item["url"];
            sliderTitles[i].innerHTML = item["title"];
            sliderDescription[i].innerHTML = item["description"];
        }
    } catch (error) {
        logMessage(error);
    }
}

function displayWordCloud(words) {
    try {
        var margin = { top: 5, right: 5, bottom: 5, left: 5 },
            width = 220 - margin.left - margin.right;
        height = 220 - margin.top - margin.bottom;

        var svg = d3.select("#word-cloud").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        var layout = d3.layout.cloud()
            .size([width, height])
            .words(words.map(function (d) { return { text: d.word, size: d.size }; }))
            .padding(5)        //space between words
            .rotate(function () { return ~~(Math.random() * 2) * 90; })
            .fontSize(function (d) { return d.size; })      // font size of words
            .on("end", draw);
        layout.start();

        function draw(words) {
            svg
                .append("g")
                .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
                .selectAll("text")
                .data(words)
                .enter().append("text")
                .style("font-size", function (d) { return d.size + "px"; })
                .style("fill", "#000000")
                .attr("text-anchor", "middle")
                .style("font-family", "Impact")
                .attr("transform", function (d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                })
                .text(function (d) { return d.text; });
        }
    } catch (error) {
        logMessage(error);
    }
}

function cardsDataHelper(source) {
    getResponse(properties.api.newsHeadlines + '?sources=' + source, displayNewsCards);
}

function makeDefaultColor(elementId) {
    var el = document.getElementById(elementId);
    el.classList.add("default-button-color");
    el.classList.remove("chosen-button-color");
}

function makeChosenColor(elementId) {
    var el = document.getElementById(elementId);
    el.classList.remove("default-button-color");
    el.classList.add("chosen-button-color");
}

function displayNewsCards(data) {
    try {
        var elementId = data[0].source.id == "cnn" ? properties.id.cnnCards : properties.id.foxNewsCards;
        var x = document.querySelectorAll("#" + elementId + " .card");
        var link = document.querySelectorAll("#" + elementId + " a");
        const dataLength = Math.min(4, data.length);
        for (let i = 0; i < dataLength; i++) {
            const item = data[i];
            link[i].href = item["url"];
            x[i].children[0].src = item["urlToImage"];
            x[i].children[1].innerHTML = item["title"];
            x[i].children[2].innerHTML = item["description"];
        }
    } catch (error) {
        logMessage(error);
    }
}

function displayWordCloudHelper() {
    getResponse(properties.api.titles, displayWordCloud);
}

function generatePage1() {
    getCarouselDataHelper();
    showSlides();
    displayWordCloudHelper();
    cardsDataHelper("cnn");
    cardsDataHelper("fox-news");
}

function formFillDates() {
    try {
        var form = document.querySelectorAll('input[type="date"]');
        var todayDate = new Date();
        const sd = getDateString(new Date(todayDate.setDate(todayDate.getDate() - 7)));
        form[0].value = sd;
        todayDate = new Date();
        const ed = getDateString(todayDate);
        form[1].value = ed;
    } catch (error) {
        logMessage(error);
    }
}

function isValidateDates(startDate, endDate) {
    try {
        var start = new Date(startDate);
        var end = new Date(endDate);

        if (!isValidDate(start) || !isValidDate(end)) {
            alert('Incorrect time');
            return false;
        }

        if (start > end) {
            alert('Incorrect time');
            return false;
        }
        return true;
    } catch (error) {
        logMessage(error);
    }
}

function populateSourcesDropdown(sources) {
    try {
        let sourceDropDown = document.getElementById(properties.id.sourceDropDown);
        sourceDropDown.innerHTML = '';
        sourceDropDown[0] = new Option('all', 'all');
        const sourcesLength = Math.min(10, sources.length);
        for (let i = 0; i < sourcesLength; i++) {
            const source = sources[i];
            sourceDropDown[i + 1] = new Option(source['name'], source['id']);
        }
    } catch (error) {
        logMessage(error);
    }
}

function categorySourceHelper() {
    var formElement = document.querySelector("form");
    let category = formElement.elements["category"].value;
    getResponse(properties.api.sources + '?category=' + category, populateSourcesDropdown);
}

function populateSourcesDropdownHelper() {
    getResponse(properties.api.sources, populateSourcesDropdown);
}

function displayExtraInfo() {
    try {
        var infoEl = this.getElementsByClassName(properties.css.content.extraInfo);
        var closeButton = this.getElementsByClassName(properties.css.content.closeButtonWrapper)[0];
        var descEl = this.getElementsByClassName(properties.css.content.description)[0];
        var descElClipped = this.getElementsByClassName(properties.css.content.descriptionClip)[0];
        for (let i = 0; i < infoEl.length; i++) {
            const info = infoEl[i];
            info.style.display = "block";
        }
        descEl.style.display = "";
        descElClipped.style.display = "none";
        closeButton.style.visibility = "visible";
    } catch (error) {
        logMessage(error);
    }

}

function hideExtraInfo(e) {
    var infoEl = this.parentElement.getElementsByClassName(properties.css.content.extraInfo);
    var closeButton = this;
    var descEl = this.parentElement.getElementsByClassName(properties.css.content.description)[0];
    var descElClipped = this.parentElement.getElementsByClassName(properties.css.content.descriptionClip)[0];
    for (let i = 0; i < infoEl.length; i++) {
        const info = infoEl[i];
        info.style.display = "none";
    }
    descEl.style.display = "none";
    descElClipped.style.display = "";
    closeButton.style.visibility = "hidden";
    e.stopPropagation();
}

function getFormattedDescription(description) {
    try {
        // var contentDescEl = document.getElementsByClassName(properties.css.content.description)[0];
        var descElWidth = 70; //contentDescEl.clientWidth/8;
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
        logMessage(error);
    }
}

function getCardElement(data) {
    try {
        var parentEl = document.createElement("div");

        var contentWrapper = document.createElement("div");

        var authorEl = document.createElement("div");
        var sourceEl = document.createElement("div");
        var dateEl = document.createElement("div");

        var imageWrapper = document.createElement("div");
        var imageEl = document.createElement("img");

        var textWrapper = document.createElement("div");
        var titleEl = document.createElement("h3");
        var descriptionEl = document.createElement("div");
        var descriptionClippedEl = document.createElement("div");

        var urlEl = document.createElement("a");

        var closeButtonWrapper = document.createElement("div");
        var closeButton = document.createElement("p");

        parentEl.classList.add(properties.css.content.parent);
        parentEl.classList.add(properties.css.flex.column);

        authorEl.classList.add(properties.css.content.extraInfo);
        authorEl.style.display = "none";
        sourceEl.classList.add(properties.css.content.extraInfo);
        sourceEl.style.display = "none";
        dateEl.classList.add(properties.css.content.extraInfo);
        dateEl.style.display = "none";

        closeButtonWrapper.classList.add(properties.css.content.closeButtonWrapper);
        closeButtonWrapper.style.marginLeft = "5px";
        closeButtonWrapper.style.visibility = "hidden";
        closeButton.classList.add(properties.css.content.closeButton);

        contentWrapper.classList.add(properties.css.flex.column);
        contentWrapper.classList.add(properties.css.content.contentWrapper);

        imageWrapper.classList.add(properties.css.content.imageWrapper)
        imageEl.classList.add(properties.css.content.image);

        textWrapper.classList.add(properties.css.content.textWrapper);
        titleEl.classList.add(properties.css.content.title);
        descriptionEl.classList.add(properties.css.content.description);
        descriptionEl.style.display = "none";
        descriptionClippedEl.classList.add(properties.css.content.extraInfo);
        descriptionClippedEl.classList.add(properties.css.content.descriptionClip);

        urlEl.classList.add(properties.css.content.extraInfo);
        urlEl.innerHTML = "See Original Post";
        urlEl.target = "_blank";
        urlEl.style.display = "none";

        authorEl.innerHTML = "Author: ".bold() + data["author"];
        sourceEl.innerHTML = "Source: ".bold() + data["source"]["name"];
        dateEl.innerHTML = "Date: ".bold() + getDateString(new Date(data["publishedAt"]), "mm/dd/yyyy");
        imageEl.src = data["urlToImage"];
        titleEl.innerHTML = data['title'];
        descriptionEl.innerHTML = data['description'];
        descriptionClippedEl.innerHTML = getFormattedDescription(data['description']);
        urlEl.href = data['url'];
        closeButton.innerHTML = "&#10005;";

        closeButtonWrapper.onclick = hideExtraInfo;

        imageWrapper.appendChild(imageEl);
        textWrapper.appendChild(titleEl);
        textWrapper.appendChild(authorEl);
        textWrapper.appendChild(sourceEl);
        textWrapper.appendChild(dateEl);
        textWrapper.appendChild(descriptionEl);
        textWrapper.appendChild(descriptionClippedEl);
        textWrapper.appendChild(urlEl);
        closeButtonWrapper.appendChild(closeButton);

        contentWrapper.appendChild(imageWrapper);
        contentWrapper.appendChild(textWrapper);

        parentEl.appendChild(contentWrapper);
        parentEl.appendChild(closeButtonWrapper);

        parentEl.onclick = displayExtraInfo;

        return parentEl;
    } catch (error) {
        logMessage(error);
    }

}

function showLessButton() {
    var showLessButton = document.getElementById(properties.id.showLessButton);
    var showMoreButton = document.getElementById(properties.id.showMoreButton);
    showLessButton.style.display = 'none';
    showMoreButton.style.display = "";

    var cards = document.getElementsByClassName(properties.css.content.parent);
    for (let i = 5; i < cards.length; i++) {
        const card = cards[i];
        card.style.display = 'none';
    }

}

function showMoreButton() {
    var showLessButton = document.getElementById(properties.id.showLessButton);
    var showMoreButton = document.getElementById(properties.id.showMoreButton);
    showMoreButton.style.display = 'none';
    showLessButton.style.display = "";

    var cards = document.getElementsByClassName(properties.css.content.parent);
    for (let i = 5; i < cards.length; i++) {
        const card = cards[i];
        card.style.display = '';
    }
}

function drawContent(contentData) {
    try {
        var contentEl = document.getElementById(properties.id.content);
        contentEl.innerHTML = '';
        var showMoreButton = document.getElementById(properties.id.showMoreButton);
        var showLessButton = document.getElementById(properties.id.showLessButton);
        const contentLength = Math.min(contentData.length, 15);
        if (contentLength > 0) {
            for (let i = 0; i < contentLength; i++) {
                const element = contentData[i];
                var cardElement;
                if (i > 4) {
                    cardElement = getCardElement(element);
                    cardElement.style.display = "none";
                } else {
                    cardElement = getCardElement(element);
                }
                contentEl.appendChild(cardElement);
            }
            if (contentLength > 5) {
                showMoreButton.style.display = "block";
                showLessButton.style.display = "none";
            } else {
                showMoreButton.style.display = "none";
                showLessButton.style.display = "none";
            }
        } else {
            clearContent();
        }
    } catch (error) {
        logMessage(error);
    }
}

function displayFormData(data) {
    try {
        let noContentEl = document.getElementById(properties.id.noContent);
        noContentEl.style.display = 'none';
        if (data.hasOwnProperty('error')) {
            alert(data['error'].message);
        } else if (data.length == 0) {
            clearContent();
            noContentEl.style.display = '';
        }
        else {
            noContentEl.style.display = 'none';
            drawContent(data);
        }
    } catch (error) {
        logMessage(error);
    }
}

function displayFormDataHelper(url) {
    getResponse(url, displayFormData);
}

function getFormData() {
    try {
        var formElement = document.querySelector("form");
        let keyword = formElement.elements["keyword"].value;
        let fromDate = formElement.elements["fromDate"].value;
        let toDate = formElement.elements["toDate"].value;
        let sources = formElement.elements["source"].value;

        if (isValidateDates(fromDate, toDate)) {
            var url = properties.api.everything + "?keyword=" + keyword + "&from=" + fromDate + "&to=" + toDate + "&sources=" + sources;
            displayFormDataHelper(url);
        }
    } catch (error) {
        logMessage(error);
    }
}

var formEl = document.getElementById("form-data");
formEl.onsubmit = function (event) {
    event.preventDefault();
    getFormData();
};

function displayPage1() {
    try {
        var googleNewsButtton = document.getElementById(properties.id.googleNewsButton);
        var searchButton = document.getElementById(properties.id.searchButton);
        googleNewsButtton.classList.add("active");
        searchButton.classList.remove("active");

        makeChosenColor(properties.id.googleNewsButton);
        makeDefaultColor(properties.id.searchButton);
        hideElement(properties.id.page2);
        showElement(properties.id.page1);
    } catch (error) {
        logMessage(error);
    }
}

function displayPage2() {
    try {
        var googleNewsButtton = document.getElementById(properties.id.googleNewsButton);
        var searchButton = document.getElementById(properties.id.searchButton);
        searchButton.classList.add("active");
        googleNewsButtton.classList.remove("active");

        makeDefaultColor(properties.id.googleNewsButton);
        makeChosenColor(properties.id.searchButton);
        hideElement(properties.id.page1);
        showElement(properties.id.page2);
    } catch (error) {
        logMessage(error);
    }
}

function resetCategoryDropDown() {
    let categoryEl = document.getElementById(properties.id.categoryDropDown);
    categoryEl.value = "all";
}

function generatePage2() {
    formFillDates();
    populateSourcesDropdownHelper();
}

function clearContent() {
    var contentEl = document.getElementById(properties.id.content);
    var showMoreButton = document.getElementById(properties.id.showMoreButton);
    var showLessButton = document.getElementById(properties.id.showLessButton);
    let noContentEl = document.getElementById(properties.id.noContent);

    noContentEl.style.display = 'none';
    contentEl.innerHTML = '';
    showMoreButton.style.display = "none";
    showLessButton.style.display = "none";
}

function resetForm() {
    var formElement = document.querySelector("form");

    formElement.elements["keyword"].value = '';
    formElement.elements["source"].value = '';

    clearContent();
    resetCategoryDropDown();
    generatePage2();
}

window.onload = (event) => {
    displayPage1();
    generatePage1();
    generatePage2();
    resetForm();
};
