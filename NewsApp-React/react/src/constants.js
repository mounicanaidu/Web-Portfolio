import { css } from "@emotion/core";
const constants = {
    'serverUrl': 'http://mounicanoderouting.us-east-1.elasticbeanstalk.com',
    'source' : {
        'defaultSource' : 'guardian',
        'nonDefaultSource': 'nytimes'
    },
    'section': {
        'defaultSection': 'home'
    },
    'article' : { 
        'sectionColorMap' : {
            'other': 'article-section-other',
            'world': 'article-section-world',
            'politics': 'article-section-politics',
            'business': 'article-section-business',
            'technology': 'article-section-technology',
            'sports': 'article-section-sports',
            'guardian': 'article-section-guardian',
            'nytimes': 'article-section-nytimes'
        }
    },
    'bingAutosearchKey': 'de5bb286de1648a6a7cd5a7fd80690f8',
    'localStorageIdKey': 'bookmarkedIds',
    'spinnerCssOverride': css`
    display: block;
    margin: 0 auto;
    border-color: red;
    ` ,
    'showDescCss': null,
    'hideDescCss': 'hide'
};

export default constants;