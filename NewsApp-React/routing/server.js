const express = require('express');
const app = express();
const fetch = require('node-fetch');
const port = process.env.PORT || 9000;
var cors = require("cors");
const googleTrends = require('google-trends-api');

app.use(cors());
app.set('etag', false);
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
})

// console.log that your server is up and running
app.listen(port, () => console.log(`Listening on port ${port}`));

// create a GET route
app.get('/', (req, res) => {
    res.send({ express: 'YOUR EXPRESS BACKEND IS CONNECTED TO REACT' });
});

const guardianAPIKey = '674818af-74cc-4c08-82cd-be41b33a9bdb';
const nytimesApiKey = 'Klmoq7Z1qpWmdn8SwjsAVX0eC3qFG4Fz';

function transformGuardianData(data, section = null) {
    let transformedData = [];
    try {
        // console.log('data:', data)
        let result = data.response.results;
        if (!result) {
            console.log('Result not available:', result);
            return transformedData;
        }
        for (let i = 0; i < result.length; i++) {
            const dataRow = result[i];
            let temp = {};

            try {
                temp['title'] = dataRow.webTitle;
                let images = dataRow.blocks.main.elements['0'].assets;
                // temp['image'] = images.length > 0 ? images[images.length - 1].file : 'https://assets.guim.co.uk/images/eada8aa27c12fe2d5afa3a89d3fbae0d/fallback-logo.png';
                temp['image'] = images.length > 0 ? images[0].file : 'https://assets.guim.co.uk/images/eada8aa27c12fe2d5afa3a89d3fbae0d/fallback-logo.png';
                if (section && dataRow.sectionId != section) {
                    continue;
                }
                var sectionValue = dataRow.sectionId;
                if (dataRow.sectionId == 'sport') {
                    sectionValue += 's'
                }
                temp['section'] = sectionValue;
                temp['date'] = dataRow.webPublicationDate;
                temp['description'] = dataRow.blocks.body['0'].bodyTextSummary;
                temp['shareUrl'] = dataRow.webUrl;
                if (dataRow.id) {
                    temp['id'] = dataRow.id;
                }
                transformedData.push(temp);
            } catch (error) { console.log("Missing param in transformGuardianData"); }
        }
    } catch (error) {
        console.log(error);
    }

    return transformedData;
}

function transformNYTimesData(data, section = null) {
    let transformedData = [];
    try {
        let result = data.results;
        if (!result) {
            console.log('Result not available:', result);
            return transformedData;
        }
        for (let i = 0; i < result.length; i++) {
            const dataRow = result[i];
            let temp = {};
            temp['title'] = dataRow.title;
            temp['image'] = 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Nytimes_hq.jpg';
            let images = dataRow.multimedia;
            if (!images) {
                continue;
            }
            for (let j = 0; j < images.length; j++) {
                const image = images[j];
                if (image.width >= 2000) {
                    temp['image'] = image.url;
                    break;
                }
            }
            if (section && section != 'politics' && dataRow.section != section) {
                continue;
            }
            temp['section'] = dataRow.section;
            temp['date'] = dataRow.published_date;
            temp['description'] = dataRow.abstract;
            temp['shareUrl'] = dataRow.url;
            temp['id'] = dataRow.url;
            transformedData.push(temp);
        }
    } catch (error) {
        console.log(error);
    }

    return transformedData;
}

function transformGuardianArticleData(data) {
    let transformedData = [];
    try {
        let dataRow = data.response.content;
        if (!dataRow) {
            console.log('Result not available:', data);
            return transformedData;
        }
        let temp = {};

        try {
            temp['title'] = dataRow.webTitle;
            let images = dataRow.blocks.main.elements['0'].assets;
            // temp['image'] = images.length > 0 ? images[images.length - 1].file : 'https://assets.guim.co.uk/images/eada8aa27c12fe2d5afa3a89d3fbae0d/fallback-logo.png';
            temp['image'] = images.length > 0 ? images[0].file : 'https://assets.guim.co.uk/images/eada8aa27c12fe2d5afa3a89d3fbae0d/fallback-logo.png';
            temp['date'] = dataRow.webPublicationDate;
            temp['description'] = dataRow.blocks.body['0'].bodyTextSummary;
            temp['shareUrl'] = dataRow.webUrl;
            temp['source'] = 'guardian';
            temp['section'] = dataRow.sectionId;
            transformedData.push(temp);
            // console.log('transformedData:', transformedData);
        } catch (error) {
            console.log("Missing param in transformGuardianData:", error);
        }

    } catch (error) {
        console.log(error);
    }
    return transformedData;
}

function transformNYTimesArticleData(data) {
    let transformedData = [];
    try {
        // console.log(data);
        let result = data.response.docs;
        if (!result) {
            console.log('Result not available:', data);
            return transformedData;
        }
        for (let i = 0; i < result.length; i++) {
            const dataRow = result[i];
            let temp = {};
            temp['title'] = dataRow.headline.main;
            temp['image'] = 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Nytimes_hq.jpg';
            let images = dataRow.multimedia;
            if (!images) {
                continue;
            }
            for (let j = 0; j < images.length; j++) {
                const image = images[j];
                if (image.width >= 2000 && image.url) {
                    if (image.url.startsWith("http")) {
                        temp['image'] = image.url;
                    } else {
                        temp['image'] = "https://nyt.com/" + image.url;
                    }

                    break;
                }
            }
            if (dataRow.news_desk) {
                temp['section'] = dataRow.news_desk.toLowerCase();
            }
            temp['date'] = dataRow.pub_date;
            temp['description'] = dataRow.abstract;
            temp['shareUrl'] = dataRow.web_url;
            // temp['id'] = dataRow.url;
            // console.log(temp);
            temp['source'] = 'nytimes';
            transformedData.push(temp);
        }
    } catch (error) {
        console.log(error);
        console.log("Data received: ", data)
    }

    return transformedData;
}

function transformGuardianSearchData(data) {
    let transformedData = [];
    try {
        let result = data.response.results;
        if (!result) {
            console.log('Result not available:', result);
            return transformedData;
        }
        for (let i = 0; i < result.length; i++) {
            const dataRow = result[i];
            let temp = {};

            try {
                temp['title'] = dataRow.webTitle;
                let images = dataRow.blocks.main.elements['0'].assets;
                // temp['image'] = images.length > 0 ? images[images.length - 1].file : 'https://assets.guim.co.uk/images/eada8aa27c12fe2d5afa3a89d3fbae0d/fallback-logo.png';
                temp['image'] = images.length > 0 ? images[0].file : 'https://assets.guim.co.uk/images/eada8aa27c12fe2d5afa3a89d3fbae0d/fallback-logo.png';
                temp['section'] = dataRow.sectionId;
                temp['date'] = dataRow.webPublicationDate;
                temp['description'] = dataRow.blocks.body['0'].bodyTextSummary;
                temp['shareUrl'] = dataRow.webUrl;
                if (dataRow.id) {
                    temp['id'] = dataRow.id;
                }
                transformedData.push(temp);
            } catch (error) { console.log("Missing param in transformGuardianData"); }
        }
    } catch (error) {
        console.log(error);
    }

    return transformedData;
}

function transformNYTimesSearchData(data) {
    let transformedData = [];
    try {
        let result = data.response.docs;
        if (!result) {
            console.log('Result not available:', result);
            return transformedData;
        }

        for (let i = 0; i < result.length; i++) {
            const dataRow = result[i];
            let temp = {};
            temp['title'] = dataRow.headline.main;
            temp['image'] = 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Nytimes_hq.jpg';
            let images = dataRow.multimedia;
            if (!images) {
                continue;
            }
            for (let j = 0; j < images.length; j++) {
                const image = images[j];
                if (image.width >= 2000 && image.url) {
                    if (image.url.startsWith("http")) {
                        temp['image'] = image.url;
                    } else {
                        temp['image'] = "https://nyt.com/" + image.url;
                    }

                    break;
                }
            }
            if (dataRow.news_desk) {
                temp['section'] = dataRow.news_desk.toLowerCase();
            } else {
                continue;
            }
            temp['date'] = dataRow.pub_date;
            temp['description'] = dataRow.abstract;
            temp['shareUrl'] = dataRow.web_url;
            temp['id'] = dataRow.web_url;
            transformedData.push(temp);

        }

    } catch (error) {
        console.log(error);
    }
    return transformedData;
}

function transformLatestNewsGuardianData(data) {
    let transformedData = [];
    try {
        let result = data.response.results;
        if (!result) {
            console.log('Result not available:', result);
            return transformedData;
        }
        for (let i = 0; i < result.length; i++) {
            const dataRow = result[i];
            let temp = {};

            try {
                temp['title'] = dataRow.webTitle;
                let image = dataRow.fields.thumbnail;
                temp['image'] = image.length > 0 && image !== null ? image : 'https://assets.guim.co.uk/images/eada8aa27c12fe2d5afa3a89d3fbae0d/fallback-logo.png';
                temp['section'] = dataRow.sectionName;
                temp['date'] = dataRow.webPublicationDate;
                // temp['description'] = dataRow.blocks.body['0'].bodyTextSummary;
                temp['shareUrl'] = dataRow.webUrl;
                if (dataRow.id) {
                    temp['id'] = dataRow.id;
                }
                transformedData.push(temp);
            } catch (error) { console.log("Missing param in transformGuardianData"); }
        }
    } catch (error) {
        console.log(error);
    }

    return transformedData;
}

app.get('/trend/:query', function (req, res, next) {
    var query = req.params['query'] ? req.params['query'] : '';
    var startDate = new Date("06/01/2019");
    googleTrends.interestOverTime({ keyword: query, startTime:startDate })
        .then(function (results) {
            res.send({ 'response': JSON.parse(results) });
        })
        .catch(function (err) {
            console.error('Oh no there was an error', err);
        });
})

app.get('/getArticle/:source/:id', function (req, res, next) {
    console.log("Inside getArticle route API")
    var id = req.params['id'] ? req.params['id'] : '';
    var source = req.params['source'] ? req.params['source'] : 'guardian';
    var apiUrl = '';

    if (source == 'guardian') {
        apiUrl = 'https://content.guardianapis.com/' + id + '?api-key=' + guardianAPIKey + '&show-blocks=all';
    } else if (source == 'nytimes') {
        apiUrl = 'https://api.nytimes.com/svc/search/v2/articlesearch.json?fq=web_url:(%22' + decodeURIComponent(id) + '%22) &api-key=' + nytimesApiKey;
    } else {
        console.log("error");
    }
    console.log('apiUrl:', apiUrl);

    const get_data = async url => {
        try {
            const response = await fetch(url);
            const json = await response.json();
            let transformedData;
            if (source == 'guardian') {
                transformedData = transformGuardianArticleData(json);
            } else if (source == 'nytimes') {
                transformedData = transformNYTimesArticleData(json);
            } else {
                transformedData = [];
                console.log(error);
            }
            // res.send(JSON.stringify(transformedData));
            res.send({ 'response': transformedData });
        } catch (error) {
            console.log(error);
        }
    };

    get_data(apiUrl);
});

app.get('/getSearchResults/:source/:query', function (req, res, next) {
    var query = req.params['query'] ? req.params['query'] : '';
    var source = req.params['source'] ? req.params['source'] : 'guardian';
    var apiUrl = '';

    if (source == 'guardian') {
        apiUrl = 'https://content.guardianapis.com/search' + '?q=' + query + '&api-key=' + guardianAPIKey + '&show-blocks=all';
    } else if (source == 'nytimes') {
        apiUrl = 'https://api.nytimes.com/svc/search/v2/articlesearch.json' + '?fq=' + query + '&api-key=' + nytimesApiKey;
    } else {
        console.log("error");
    }

    const get_data = async url => {
        try {
            const response = await fetch(url);
            const json = await response.json();
            let transformedData;
            if (source == 'guardian') {
                transformedData = transformGuardianSearchData(json);
            } else if (source == 'nytimes') {
                transformedData = transformNYTimesSearchData(json);
            } else {
                transformedData = [];
                console.log(error);
            }
            // res.send(JSON.stringify(transformedData));
            res.send({ 'response': transformedData });
        } catch (error) {
            console.log(error);
        }
    };
    console.log(apiUrl);
    get_data(apiUrl);
})

app.get('/latestnews/guardian', function (req, res, next) {
    var apiUrl = 'https://content.guardianapis.com/search?order-by=newest&show-fields=starRating,headline,thumbnail,short-url&api-key=' + guardianAPIKey;

    const get_data = async url => {
        try {
            const response = await fetch(url);
            const json = await response.json();
            let transformedData;
            transformedData = transformLatestNewsGuardianData(json);
            res.send({ 'response': transformedData });
        } catch (error) {
            console.log(error);
        }
    };
    console.log(apiUrl);
    get_data(apiUrl);
});

app.get('/:source/:section', function (req, res, next) {
    console.log(':source/:section', req.params);
    var source = req.params['source'] ? req.params['source'] : 'guardian';
    var section = req.params['section'] ? req.params['section'] : '';
    if (section == 'sports' && source == 'guardian') {
        section = 'sport';
    }
    var apiUrl = '';

    if (source == 'guardian') {
        apiUrl = `https://content.guardianapis.com/${section}?api-key=${guardianAPIKey}&show-blocks=all`;
    } else if (source == 'nytimes') {
        apiUrl = 'https://api.nytimes.com/svc/topstories/v2/' + section + '.json?api-key=' + nytimesApiKey;
    } else {
        console.log("error");
    }
    const get_data = async url => {
        try {
            const response = await fetch(url);
            const json = await response.json();
            let transformedData;
            if (source == 'guardian') {
                transformedData = transformGuardianData(json, section);
            } else if (source == 'nytimes') {
                transformedData = transformNYTimesData(json, section);
            } else {
                transformedData = [];
                console.log(error);
            }
            // res.send(JSON.stringify(transformedData));
            res.send({ 'response': transformedData });
        } catch (error) {
            console.log(error);
        }
    };

    get_data(apiUrl);
    console.log('apiUrl:', apiUrl);
});

app.get('/:source', function (req, res, next) {
    var source = req.params['source'] ? req.params['source'] : 'guardian';
    var apiUrl = '';

    if (source == 'guardian') {
        apiUrl = 'http://content.guardianapis.com/search?api-key=' + guardianAPIKey + '&section=(sport|business|technology|politics)&show-blocks=all';
    } else if (source == 'nytimes') {
        apiUrl = 'https://api.nytimes.com/svc/topstories/v2/home.json?api-key=' + nytimesApiKey;
    } else {
        console.log("error");
    }

    const get_data = async url => {
        try {
            const response = await fetch(url);
            const json = await response.json();
            let transformedData;
            if (source == 'guardian') {
                transformedData = transformGuardianData(json);
            } else if (source == 'nytimes') {
                transformedData = transformNYTimesData(json);
            } else {
                transformedData = [];
                console.log(error);
            }
            // res.send(JSON.stringify(transformedData));
            res.send({ 'response': transformedData });
        } catch (error) {
            console.log(error);
        }
    };
    console.log(apiUrl);
    get_data(apiUrl);
});
