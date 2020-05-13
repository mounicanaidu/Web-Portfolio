import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import constants from './constants.js';
import ReactDOM from 'react-dom';
import { getFormattedDescription, getDescriptionByLines, getDateString, getURL, showSwitch, isFavouritePage, isSearchPage, getAppSource, setAppSource, getExactProp, showArticleDescArrow } from './utils.js'
import { BrowserRouter as Router, Link, NavLink, Route, Switch as RouterSwitch, useParams, useHistory, useLocation } from 'react-router-dom'
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import AsyncSelect from 'react-select/async';
import ResponsiveEmbed from 'react-bootstrap/ResponsiveEmbed'
import Image from 'react-bootstrap/Image'
import { FaRegBookmark, FaBookmark, FaChevronUp, FaChevronDown, FaTrash } from 'react-icons/fa';
import { MdShare } from 'react-icons/md';
import { FacebookShareButton, TwitterShareButton, EmailShareButton, TwitterIcon, EmailIcon, FacebookIcon } from 'react-share';
import Switch from 'react-switch';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import commentBox from 'commentbox.io';
import _ from "lodash";
import ReactTooltip from 'react-tooltip';
import BounceLoader from "react-spinners/BounceLoader";
import { toast, Zoom } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { animateScroll as scroll } from 'react-scroll'

toast.configure({
    position: toast.POSITION.TOP_CENTER,
    autoClose: 3000,
    transition: Zoom,
    hideProgressBar: true,
    bodyClassName: 'articleToast'
})

function NavBarSwitch(props) {
    let isSourceDefault = getAppSource() === 'guardian' ? true : false;
    const [checked, setChecked] = useState(isSourceDefault);
    const action = props.action;
    let location = useLocation();
    let NavBarSwitchClassName = ""

    function handleChange(checked) {
        setChecked(checked);
        let _source = '';
        if (checked) {
            _source = constants.source.defaultSource;
        } else {
            _source = constants.source.nonDefaultSource;
        }
        action.setSource(_source);
    }

    if (showSwitch(location.pathname)) {
        NavBarSwitchClassName = "switch"
    } else {
        NavBarSwitchClassName = "switch hide"
    }
    return (
        <label className={NavBarSwitchClassName}>
            <Row>
                <Col className="nytimes-switch" xs={12} md={4} >
                    <div>NYTimes</div>
                </Col>
                <Col xs={12} md={4} className="switch-wrapper">
                    <Switch
                        className="switch-icon"
                        onChange={handleChange}
                        checked={checked}
                        uncheckedIcon={false}
                        checkedIcon={false}
                        onColor="#09a6ff"
                        offColor="#d7d7d7"
                    />
                </Col>
                <Col className='guardian-switch' xs={12} md={4} >
                    <div>Guardian</div>
                </Col>
            </Row>
        </label>
    );
}

function Bookmark() {
    console.log('Inside Bookmark')
    let location = useLocation();
    let isBookmarkedPage = false;

    if (isFavouritePage(location.pathname)) {
        isBookmarkedPage = true;
    } else {
        isBookmarkedPage = false;
    }

    return (
        < >
            <Link to={'/favourites'} color="white" data-tip="Bookmark" data-place="bottom" data-for="navbar-tooltip" className="navElements">
                {
                    isBookmarkedPage ?
                        <FaBookmark className="bookmark" /> :
                        <FaRegBookmark className="bookmark" />
                }
            </Link>
            <ReactTooltip id="navbar-tooltip" effect="solid" />
        </>
    );
}

function getBookmarkedArticleIds() {
    let idsString = localStorage.getItem(constants.localStorageIdKey);
    let ids = [];
    if (!_.isEmpty(idsString)) {
        ids = idsString.split(',');
    }
    return ids;
}

function Favourites(props) {
    console.log('Inside Favourites')
    let sectionColorMap = constants.article.sectionColorMap;
    const action = props.action;
    const serverUrl = constants.serverUrl + '/getArticle';
    const [bookmarkedArticlesData, setBookmarkedArticlesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reload, setReload] = useState(true);
    const [favArticleIds, setFavArticleIds] = useState([]);

    const notifyRemovedSavedArticle = (message) => toast(`Removing ${message}`);

    const getData = async (articleIds) => {
        try {
            var data = [];
            for (let i = 0; i < articleIds.length; i++) {
                let articleId = articleIds[i];
                let source = localStorage.getItem(articleId);

                let url = getURL(serverUrl, source, '', articleId);
                console.log(url);
                const fetchData = async () => {
                    const result = await axios(url);
                    var temp = {};
                    if (!_.isEmpty(result.data.response[0])) {
                        temp = result.data.response[0];
                        temp['id'] = articleId;
                    }
                    return temp;
                };

                var articleData = await fetchData();
                if (!_.isEmpty(articleData)) {
                    data.push(articleData);
                }
            }
        } catch (error) {
            console.info(error);
        }
        setBookmarkedArticlesData(data);
        if (loading) { setLoading(false); }
    }

    function handleDeleteButtonClick(id, toastMessage) {
        notifyRemovedSavedArticle(toastMessage);
        if (!_.isEmpty(bookmarkedArticlesData)) {
            for (let i = 0; i < bookmarkedArticlesData.length; i++) {
                const bookmarkArticle = bookmarkedArticlesData[i];
                if (bookmarkArticle.id === id) {
                    bookmarkedArticlesData.splice(i, 1);
                    localStorage.removeItem(id);
                    let articleIds = favArticleIds;
                    _.remove(articleIds, function (n) { return n === id; });
                    localStorage.setItem(constants.localStorageIdKey, articleIds);
                    setBookmarkedArticlesData(bookmarkedArticlesData);
                    setFavArticleIds(articleIds);
                    break;
                }
            }
        }
        setReload(!reload);
    }

    useEffect(() => {
        ReactTooltip.hide();
        let articleIds = getBookmarkedArticleIds();
        console.log('Inside Favourites useEffect, articleIds:', articleIds)
        if (!_.isEqual(articleIds, favArticleIds)) {
            setFavArticleIds(articleIds);
        }
        // console.log('articleIds:', articleIds)
        getData(articleIds);
    }, [reload]);

    if (bookmarkedArticlesData.length > 0) {
        return (
            <div>
                <div className='article-container'>
                    <h3>Favourites</h3>
                    <Row>
                        {/* {console.log('Return bookmarkedArticlesData:', bookmarkedArticlesData)} */}
                        {bookmarkedArticlesData.map((article, index) =>
                            <Col md={3} key={index} >
                                <Link to={{
                                    pathname: '/article/' + article.id,
                                    source: article.source
                                }} onClick={(e) => { e.stopPropagation(); action.setArticleIdFunction(decodeURIComponent(article.id)); }} style={{ textDecoration: 'none', color: 'black' }}>
                                    <div className="article-card">
                                        <div className="article-title addMargin">{article.title}
                                            <ModalPopUp title={article.title} shareUrl={article.shareUrl} source={article.source}></ModalPopUp>
                                            <span onClick={(e) => { e.preventDefault(); e.persist(); handleDeleteButtonClick(article.id, article.title) }}>
                                                <FaTrash className='delete-button' ></FaTrash>
                                            </span>
                                        </div>
                                        <ResponsiveEmbed aspectRatio='16by9' className='article-image-container addMargin'>
                                            <Image className='article-image' src={article.image}></Image>
                                        </ResponsiveEmbed>
                                        <Row className='article-date-section'>
                                            <Col xs={4} md={4} className='article-date'>{getDateString(article.date)}</Col>
                                            <Col xs={8} md={8}>
                                                <Row className="article-source-section">
                                                    <div className={'article-section ' + (sectionColorMap[article.section] ? sectionColorMap[article.section] : sectionColorMap.other)}>
                                                        {article.section}
                                                    </div>
                                                    <div className={'article-section ' + (sectionColorMap[article.source] ? sectionColorMap[article.source] : sectionColorMap.other)}>
                                                        {article.source}
                                                    </div>
                                                </Row>
                                            </Col>
                                        </Row>
                                    </div>
                                </Link>
                            </Col>
                        )}
                    </Row>
                </div>
            </div>
        );
    } else if (loading) {
        return (
            <div className='centered'>
                <BounceLoader
                    css={constants.spinnerCssOverride}
                    size={40}
                    color={"#123abc"}
                    loading={loading}
                />
                <p>Loading</p>
            </div>
        );
    }
    else {
        return (<h4 className="noFavArticles">You have no saved articles</h4>);
    }

}

function Searchbar(props) {
    console.log("Inside Searchbar")
    const action = props.action;
    let history = useHistory();
    let results = [];
    const location = useLocation();
    const [selectedOption, setSelectedOption] = useState('')

    const setValue = (location) => {
        // console.log('Inside getValue')
        if (!isSearchPage(location) && selectedOption !== '') {
            setSelectedOption('');
        }
    }

    setValue(location.pathname);
    const getOptions = (inputValue) => {
        const fetchData = async () => {
            try {
                const response = await fetch(
                    `https://api.cognitive.microsoft.com/bing/v7.0/suggestions?mkt=fr-FR&q=${inputValue}`,
                    {
                        headers: {
                            "Ocp-Apim-Subscription-Key": "c7364506713c4ce2a64694b3978f841a"
                        }
                    }
                );
                const data = await response.json();
                // console.log('data');
                const resultsRaw = data.suggestionGroups[0].searchSuggestions;
                results = resultsRaw.map(result => ({ value: result.displayText, label: result.displayText }));
            } catch (error) {
                console.error(`Error fetching search ${inputValue}`);
            }
        };
        fetchData();
        return results;
    };

    const loadOptions = (inputValue, callback) => {
        callback(getOptions(inputValue));
    };

    const handleChange = (selectedInputOption) => {
        // console.log("Inside handleChange option:", selectedInputOption)
        // const previousSelectedOption = action.callbackSearchInputValueFunction();
        // localStorage.setItem('searchQuery', false);
        action.setSearchInputValue(selectedInputOption.value);
        history.push(`/search/${selectedInputOption.value}`);
        setSelectedOption(selectedInputOption);
    }

    useEffect(() => {
        // console.log("Isnide Searchbar useeefect")
    }, [selectedOption])

    return (
        <AsyncSelect
            className='search-bar'
            cacheOptions={true}
            loadOptions={_.debounce(loadOptions, 800)}
            onChange={handleChange}
            placeholder='Enter keyword ..'
            value={selectedOption}
        />
    );
}

function ShareButtons(props) {
    const shareUrl = props.shareUrl;
    const iconSize = props.iconSize ? props.iconSize : 42;
    const displayTooltip = props.displayTooltip ? props.displayTooltip : null;
    const shareCss = props.shareCss ? props.shareCss : '';
    return (
        <>
            <Row className={'article-share-icons ' + shareCss} >
                <Col xs={1}>
                    <FacebookShareButton url={shareUrl} hashtag='#CSCI_571_NewsApp'
                        data-tip={displayTooltip ? 'Facebook' : null}
                        data-for={displayTooltip ? 'share-icons-tooltip' : null}>
                        <FacebookIcon size={iconSize} round={true}></FacebookIcon>
                    </FacebookShareButton>
                </Col>
                <Col xs={1}>
                    <TwitterShareButton url={shareUrl} hashtags={['CSCI_571_NewsApp']}
                        data-tip={displayTooltip ? 'Twitter' : null}
                        data-for={displayTooltip ? 'share-icons-tooltip' : null}>
                        <TwitterIcon size={iconSize} round={true} />
                    </TwitterShareButton>
                </Col>
                <Col xs={1}>
                    <EmailShareButton url={shareUrl} subject='#CSCI_571_NewsApp'
                        data-tip={displayTooltip ? 'Email' : null}
                        data-for={displayTooltip ? 'share-icons-tooltip' : null}>
                        <EmailIcon size={iconSize} round={true}></EmailIcon>
                    </EmailShareButton>
                </Col>
            </Row>
            <ReactTooltip id='share-icons-tooltip' place='top' effect='solid' className="share-tooltip" />
        </>
    )
}

function ModalPopUp(props) {
    const title = props.title;
    const shareUrl = props.shareUrl;
    const source = props.source ? props.source : ''
    const [show, setShow] = useState(false);
    const handleClose = (e) => { setShow(false); };
    const handleShow = (e) => { setShow(true); e.preventDefault(); };

    return (
        <div onClick={e => e.stopPropagation()} className='article-share'>
            <MdShare onClick={handleShow}></MdShare>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <div>
                        {_.isEmpty(source) ? <div /> : <div className='article-modal-source'>{source}</div>}
                        <div className='article-modal-title'>{title}</div>
                    </div>
                </Modal.Header>
                <Modal.Body>
                    <Row className='article-modal-sharevia'>Share via</Row>
                    <ShareButtons shareCss='shareIconSpacing' shareUrl={shareUrl} />
                </Modal.Body>
            </Modal>
        </div>
    )
}

class PageWithComments extends React.Component {
    constructor(props) {
        super(props);
        this.id = this.props.articleId;
    }
    componentDidMount() {
        let articleId = this.id;
        this.removeCommentBox = commentBox('5726521956237312-proj', {
            className: 'commentbox',
            defaultBoxId: 'commentbox',
            tlcParam: 'tlc',
            backgroundColor: null,
            textColor: null,
            subtextColor: null,
            singleSignOn: null,
            createBoxUrl(boxId, pageLocation) {

                let url = 'manyamreactapp.us-east-1.elasticbeanstalk.com/article/' + decodeURIComponent(articleId);
                pageLocation.search = '';
                pageLocation.hash = boxId;
                return url;
            }
        });
    }

    componentWillUnmount() {
        this.removeCommentBox();
    }

    render() {
        return (
            <div className="commentbox" id={decodeURI(this.id)} />
        );
    }
}

function Article(props) {
    console.log('Inside Article')

    const location = useLocation();
    const id = props.id;
    // console.log('Articles:', id)
    const action = props.action;
    const serverUrl = constants.serverUrl + '/getArticle';
    const source = location.source;
    const [article, setArticle] = useState('');
    const showMoreDesc = location.showDesc;
    const [showDesc, setShowDesc] = useState(showMoreDesc);
    const [bookmarkedIcon, setBookmarkedIcon] = useState(isBookmarked());
    const [loading, setLoading] = useState(true);

    const notifyNewSavedArticle = (message) => toast(`Saving ${message}`);
    const notifyRemovedSavedArticle = (message) => toast(`Removing ${message}`);

    const handleClick = (e) => {
        var articleDescEl = document.getElementById('article-desc-scroll');
        var rect = articleDescEl.getBoundingClientRect();
        if (showDesc) {
            scroll.scrollTo(rect.top + window.scrollY - 100);
        } else {
            scroll.scrollToTop();
        }
        setShowDesc(!showDesc);
    }

    function isBookmarkIDEqual(bookmarkIds, id) {
        if (_.indexOf(bookmarkIds, id) !== -1) {
            return true;
        }
        return false;
    }

    function isBookmarked() {
        var encodedId = encodeURIComponent(id);
        let bookmarkIdsString = localStorage.getItem(constants.localStorageIdKey);
        if (!_.isEmpty(bookmarkIdsString)) {
            let bookmarkIds = bookmarkIdsString.split(',');
            if (isBookmarkIDEqual(bookmarkIds, encodedId)) {
                return true;
            }
        }
        return false;
    }

    function handleBookmarkClick(e, toastMessage) {
        console.log('clicked');
        e.stopPropagation();
        var encodedId = encodeURIComponent(id);
        let bookmarkedArticlesIdsString = localStorage.getItem(constants.localStorageIdKey);
        if (!_.isEmpty(bookmarkedArticlesIdsString)) {
            let bookmarkedArticlesIds = bookmarkedArticlesIdsString.split(',');
            if (isBookmarkIDEqual(bookmarkedArticlesIds, encodedId)) {
                _.remove(bookmarkedArticlesIds, function (n) { return n === encodedId; });
                localStorage.removeItem(encodedId);
                localStorage.setItem(constants.localStorageIdKey, bookmarkedArticlesIds.join());
                if (bookmarkedIcon) { setBookmarkedIcon(false); }
            } else {
                bookmarkedArticlesIdsString += ',' + encodedId;
                localStorage.setItem(constants.localStorageIdKey, bookmarkedArticlesIdsString);
                localStorage.setItem(encodedId, source);
                if (!bookmarkedIcon) { setBookmarkedIcon(true); }
            }
        } else {
            localStorage.setItem(encodedId, source);
            localStorage.setItem(constants.localStorageIdKey, encodedId);
            if (!bookmarkedIcon) { setBookmarkedIcon(true); }
        }
        if (!bookmarkedIcon) {
            notifyNewSavedArticle(toastMessage);
        } else {
            notifyRemovedSavedArticle(toastMessage);
        }
    }

    useEffect(() => {
        console.log('Inside Article useEffect showMoreDesc:', showMoreDesc, ' showDesc:', showDesc )
        let encodedId = encodeURIComponent(id);
        let url = getURL(serverUrl, source, '', encodedId);
        console.log('url:', url);
        const fetchData = async () => {
            const result = await axios(url);
            if (loading) { setLoading(false); }
            setArticle(result.data.response[0]);
            let result_data = result.data.response[0];
        };
        fetchData();
    }, [loading]);

    if (!loading && !_.isNil(article)) {
        return (
            <>
                <div className="article-container article article-page">
                    <div className="article-page-title">{article.title}</div>
                    <Row className="article-page-meta">
                        <Col xs={4} lg={8} className="article-date">{getDateString(article.date)}</Col>
                        <Col xs={6} lg={3}><ShareButtons shareUrl={article.shareUrl} iconSize={25} displayTooltip={true} /></Col>
                        <Col xs={2} lg={1} className="bookmark-wrapper" onClick={(e) => { handleBookmarkClick(e, article.title); }}>
                            <FaBookmark className={"bookmark " + (bookmarkedIcon ? '' : 'hide')} color="red" data-tip="Bookmark" data-place="top" data-for="article-tooltip" />
                            <FaRegBookmark className={"bookmark " + (bookmarkedIcon ? 'hide' : '')} color="red" data-tip="Bookmark" data-place="top" data-for="article-tooltip2" />
                        </Col>
                    </Row>
                    <div>
                        <ResponsiveEmbed aspectRatio='16by9'>
                            <Image className='article-page-image' src={article.image}></Image>
                        </ResponsiveEmbed>
                    </div>
                    <div onClick={handleClick}>
                        <div>
                            {
                                <>
                                    <div className='article-page-desc'>{getDescriptionByLines(article.description)}</div>
                                    <div className={showMoreDesc && showDesc ? constants.showDescCss : constants.hideDescCss}>
                                        <FaChevronDown className={`chevron-icon ${showArticleDescArrow(article.description)}`}></FaChevronDown>
                                    </div>
                                    <div id='article-desc-scroll'>
                                        <div className={'article-page-desc ' + (showMoreDesc && !showDesc ? constants.showDescCss : constants.hideDescCss)}>{getDescriptionByLines(article.description, 4)}</div>
                                        <FaChevronUp className={`chevron-icon ${showArticleDescArrow(article.description)} ${showMoreDesc && !showDesc ? constants.showDescCss : constants.hideDescCss}`}></FaChevronUp>
                                    </div>
                                </>
                            }
                        </div>
                    </div>
                    <ReactTooltip id="article-tooltip" effect="solid" />
                    <ReactTooltip id="article-tooltip2" effect="solid" />
                </div>
                <PageWithComments articleId={id}></PageWithComments>
            </>
        )
    } else {
        return (
            <div className='centered'>
                <BounceLoader
                    css={constants.spinnerCssOverride}
                    size={40}
                    color={"#123abc"}
                    loading={loading}
                />
                <p>Loading</p>
            </div>
        );
    }
}

function showMoreDesc(desc) {
    var descLines = 0;
    if (desc && desc.length > 0) {
        descLines = desc.split('. ').length;
    }

    if (descLines > 4) {
        return true;
    }
    return false;
}

function Articles(props) {
    console.log('Inside Articles')
    const source = props.source;
    const articles = props.articles;
    const action = props.action;
    let sectionColorMap = constants.article.sectionColorMap;

    return (
        <div className='article-container'>
            {articles.map((article, index) =>
                <div className='article' key={index} >
                    <Link to={{
                        pathname: '/article/' + encodeURIComponent(article.id), //encodeURIComponent
                        source: source,
                        showDesc: showMoreDesc(article.description)
                    }}
                        onClick={(e) => { e.stopPropagation(); action.setArticleIdFunction(article.id); console.log('setting article.id:', article.id) }} style={{ textDecoration: 'none', color: 'black' }}>
                        <Row>
                            <Col xs={12} md={3} >
                                <ResponsiveEmbed aspectRatio='16by9' className='article-image-container'>
                                    <Image className='article-image' src={article.image}></Image>
                                </ResponsiveEmbed>
                            </Col>
                            <Col xs={12} md={9}>
                                <Row>
                                    <Col className='article-title'>
                                        {article.title}
                                        <ModalPopUp title={article.title} shareUrl={article.shareUrl}></ModalPopUp>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col className='article-desc'>{getFormattedDescription(article.description)}</Col>
                                </Row>
                                <Row className='article-date-section'>
                                    <Col className='article-date'>{getDateString(article.date)}</Col>
                                    <Col>
                                        <div className={'float-right article-section ' + (sectionColorMap[article.section] ? sectionColorMap[article.section] : sectionColorMap.other)}>
                                            {article.section}
                                        </div>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Link>
                </div>
            )}
        </div>
    );
}

function SearchResultArticles(props) {
    console.log('Isnide SearchResultArticles')
    const urlParams = useParams();
    const source = props.source;
    const [queryWord, setqueryWord] = useState('');
    let currentQuery = props.queryWord ? props.queryWord : urlParams.query;
    if (queryWord !== currentQuery) {
        setqueryWord(currentQuery);
    }
    const serverUrl = constants.serverUrl + '/getSearchResults';
    const [results, setResult] = useState([]);
    const action = props.action;
    let sectionColorMap = constants.article.sectionColorMap;

    useEffect(() => {
        console.log("Isndie  SearchResultArticles useeffect")
        // console.log('queryWord:', queryWord)
        let url = getURL(serverUrl, source, '', '', queryWord);
        const fetchData = async () => {
            const result = await axios(url);
            console.log(result);
            setResult(result.data.response);
        };
        fetchData();
    }, [queryWord]);

    return (
        <div>
            <div className='article-container'>
                <h3>Results</h3>
                <Row>
                    {results.map((article, index) =>
                        <Col md={3} key={index} >
                            <Link to={{
                                pathname: '/article/' + encodeURIComponent(article.id), //encodeURIComponent
                                source: source
                            }} onClick={(e) => { e.stopPropagation(); action.setArticleIdFunction(article.id) }} style={{ textDecoration: 'none', color: 'black' }}>
                                <div className="article-card">
                                    <div className="article-title addMargin">{article.title}<ModalPopUp title={article.title} shareUrl={article.shareUrl}></ModalPopUp></div>
                                    <ResponsiveEmbed aspectRatio='16by9' className='article-image-container addMargin'>
                                        <Image className='article-image' src={article.image}></Image>
                                    </ResponsiveEmbed>
                                    <Row className='article-date-section'>
                                        <Col className='article-date'>{getDateString(article.date)}</Col>
                                        <Col>
                                            <div className={'float-right article-section ' + (sectionColorMap[article.section] ? sectionColorMap[article.section] : sectionColorMap.other)}>
                                                {article.section}
                                            </div>
                                        </Col>
                                    </Row>
                                </div>
                            </Link>
                        </Col>
                    )}
                </Row>
            </div>
        </div>
    );
}

function Content(props) {
    console.log('Inside Content')
    const serverUrl = constants.serverUrl;
    const action = props.action;
    const [queryWord, setQueryWord] = useState('');
    const [source, setSource] = useState(props.source);
    const [section, setSection] = useState(props.section);
    const [articles, setArticles] = useState([]);
    const [queryChanged, setQueryChanged] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('Calling 0')
        setLoading(true);
        let url = getURL(serverUrl, source, section);
        const fetchData = async () => {
            const result = await axios(url);
            setArticles(result.data.response);
            setLoading(false);
        };
        fetchData();
    }, [])

    useEffect(() => {
        let currentQueryWord = action.callbackSearchInputValueFunction();
        if (currentQueryWord !== queryWord) {
            setLoading(true);
            setQueryWord(currentQueryWord);
            setQueryChanged(true);
            console.log('Calling 1')
            let url = getURL(serverUrl, source, section);
            const fetchData = async () => {
                const result = await axios(url);
                setArticles(result.data.response);
                setLoading(false);
            };
            fetchData();
        } else {
            setQueryChanged(false);
        }

    }, [action.callbackSearchInputValueFunction]);

    useEffect(() => {
        let currentSection = action.callbackSectionFunction();
        if (currentSection !== section) {
            setLoading(true);
            setSection(currentSection);
            let url = getURL(serverUrl, source, currentSection);
            console.log('Calling 2')
            const fetchData = async () => {
                const result = await axios(url);
                setArticles(result.data.response);
                setLoading(false);
            };
            fetchData();
        }
    }, [action.callbackSectionFunction])

    useEffect(() => {
        let currentSource = action.callbackSourceFunction();
        if (currentSource !== source) {
            setLoading(true);
            setSource(currentSource);
            setAppSource(currentSource);
            console.log('Calling 3')
            let url = getURL(serverUrl, currentSource, section);
            const fetchData = async () => {
                const result = await axios(url);
                setArticles(result.data.response);
                setLoading(false);
            };
            fetchData();
        }
    }, [action.callbackSourceFunction])

    if (!loading) {
        return (
            < Articles articles={articles} source={source} section={section} action={{
                'setArticleIdFunction': action.setArticleIdFunction
            }} />
        )
    } else {
        return (
            <div className='centered'>
                <BounceLoader
                    css={constants.spinnerCssOverride}
                    size={40}
                    color={"#123abc"}
                    loading={loading}
                />
                <p>Loading</p>
            </div>
        )
    }
}

function NavbarC() {
    console.log("Inside NavbarC")
    const currentSection = window.location.pathname.split('/')[1];
    const [source, setSource] = useState(getAppSource());
    const [section, setSection] = useState(currentSection ? currentSection : constants.section.defaultSection);
    const [articleId, setArticleId] = useState('');
    const [searchInputValue, setSearchInputValue] = useState('');

    const navBarLinks = [
        { link: 'home', name: 'Home', to: `/` },
        { link: 'world', name: 'World', to: `/world` },
        { link: 'politics', name: 'Politics', to: `/politics` },
        { link: 'business', name: 'Business', to: `/business` },
        { link: 'technology', name: 'Technology', to: `/technology` },
        { link: 'sports', name: 'Sports', to: `/sports` },
    ];

    const callbackSourceFunction = useCallback(() => {
        return source;
    }, [source]);

    const callbackSectionFunction = useCallback(() => {
        return section;
    }, [section]);

    const callbackArticleIdFunction = useCallback(() => {
        return articleId;
    });

    const callbackSearchInputValueFunction = useCallback(() => {
        return searchInputValue;
    });

    return (
        <div>
            <Navbar className="navbar" bg="dark" expand="lg" variant="dark" sticky="top">
                <Searchbar action={{
                    'setSearchInputValue': setSearchInputValue,
                    'callbackSearchInputValueFunction': callbackSearchInputValueFunction
                }} />
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="mr-auto">
                        {
                            navBarLinks.map(navBarLink =>
                                <NavLink
                                    className="navElements"
                                    activeClassName='activeNavLink'
                                    key={navBarLink.link}
                                    style={{ textDecoration: 'none' }}
                                    to={navBarLink.to}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSection(navBarLink.link);
                                    }}
                                    exact={getExactProp(navBarLink.link)}
                                >
                                    {navBarLink.name}
                                </NavLink>
                            )
                        }
                    </Nav>
                    <Bookmark />
                    <div>
                        <NavBarSwitch
                            source={source}
                            section={section}
                            action={{
                                'setSource': setSource,
                                'callbackSourceFunction': callbackSourceFunction,
                                'callbackSectionFunction': callbackSectionFunction
                            }}
                        />
                    </div>
                </Navbar.Collapse>
            </Navbar>
            <RouterSwitch>
                <Route path='/article/:id'>
                    <Article
                        action={{
                            'callbackArticleIdFunction': callbackArticleIdFunction
                        }}
                        section={section}
                        id={articleId}
                    />
                </Route>
                <Route path='/search/:query'>
                    <SearchResultArticles
                        source={source}
                        queryWord={searchInputValue}
                        action={{
                            'setArticleIdFunction': setArticleId
                        }}
                    />
                </Route>
                <Route path='/favourites'>
                    <Favourites
                        action={{
                            'setArticleIdFunction': setArticleId
                        }}
                    />
                </Route>
                <Route path='/'>
                    <Content
                        action={{
                            'setArticleIdFunction': setArticleId,
                            'callbackSourceFunction': callbackSourceFunction,
                            'callbackSectionFunction': callbackSectionFunction,
                            'callbackSearchInputValueFunction': callbackSearchInputValueFunction
                        }}
                        source={source}
                        section={section}
                        queryWord={searchInputValue}
                    />
                </Route>
            </RouterSwitch>
        </div>
    );
}

function NewsApp() {
    console.log("Inside NewsApp")
    return (
        <>
            <Router>
                <NavbarC />
            </Router>
        </>
    )
}

ReactDOM.render(<NewsApp />, document.getElementById('root'));