from flask import Flask, request, url_for, redirect
from newsapi import NewsApiClient
import json
from collections import defaultdict

def isNotNull(p):
    if p == None or p == "":
        return False
    return True

# def isSourceNotNull(d, col):
#     if col == 'source':
#         if 'id' in d[col] and 'name' in d[col] and isNotNull(d[col]['id']) and isNotNull(d[col]['name']):
#             return True
#         else:
#             return False
#     return True

def isSourceNotNull(d, col):
    if col == 'source':
        if 'name' in d[col] and isNotNull(d[col]['name']):
            return True
        else:
            return False
    return True

def transform_data(data, columns):
    try:
        transformed_data = []
        for d in data:
            temp = {}
            for col in columns:
                if col in d and isNotNull(d[col]) and isSourceNotNull(d, col):
                    temp[col] = d[col]
                else:
                    temp = {}
                    break
            if len(temp) > 0:
                transformed_data.append(temp)
        return transformed_data
    except:
        return []

application = Flask(__name__)

NEWS_API_KEY = '7739f9b1710e459d8da26348bd98b9c1'

@application.route("/")
def loadPage():
    return  application.send_static_file('index.html') #(url_for('static', filename='index.html'))

@application.route('/news_headlines', methods=['GET'])
def get_top_headlines():
    if request.method == 'GET':
        newsapi = NewsApiClient(api_key=NEWS_API_KEY)
        request_object = {'language':'en', 'pageSize': 50}
        keys = ['author', 'description', 'title', 'url', 'urlToImage', 'publishedAt', 'source']

        if 'sources' in request.args:
                sources = request.args['sources']
                request_object['sources'] = sources

        if 'pageSize' in request.args:
            request_object['pageSize'] = int(request.args['pageSize'])

        if 'sources' in request_object:
            top_headlines = newsapi.get_top_headlines(
                sources=request_object['sources'],
                page_size=request_object['pageSize'],
                language=request_object['language'])
        else:
            top_headlines = newsapi.get_top_headlines(
                page_size=request_object['pageSize'],
                language=request_object['language'])

        top_headlines_filtered = transform_data(top_headlines['articles'], keys)
        
        return json.dumps({"data" : top_headlines_filtered})

@application.route('/news_all', methods=['GET', 'POST'])
def get_news_search():
    get_everything_filtered = ''
    if request.method == 'GET':
        newsapi = NewsApiClient(api_key=NEWS_API_KEY)
        request_object = {'language':'en', 'page_size': 30, 'sort_by': 'publishedAt'}
        keys = ['author', 'description', 'title', 'url', 'urlToImage', 'publishedAt', 'source']
        error_message = ''
        get_everything = ''

        try:
            if 'keyword' in request.args:
                keyword = request.args['keyword']
                request_object['q'] = keyword
            else:
                error_message = 'Provide keyword'

            if 'from' in request.args:
                from_date = request.args['from']
                request_object['from_param'] = from_date
            else:
                error_message = 'Provide from_date'

            if 'to' in request.args:
                to_date = request.args['to']
                request_object['to'] = to_date
            else:
                error_message = 'Provide to_date'

            if error_message != '':
                get_everything_filtered = {'error': error_message}

            # Optional params
            if 'sources' in request.args and request.args['sources'] != 'all':
                sources = request.args['sources']
                request_object['sources'] = sources

            if 'sources' in request_object:
                get_everything = newsapi.get_everything(
                    sources=request_object['sources'],
                    language=request_object['language'],
                    q=request_object['q'],
                    from_param=request_object['from_param'],
                    to=request_object['to'],
                    page_size=request_object['page_size'],
                    sort_by=request_object['sort_by'])
            else:
                get_everything = newsapi.get_everything(
                    language=request_object['language'],
                    q=request_object['q'],
                    from_param=request_object['from_param'],
                    to=request_object['to'],
                    page_size=request_object['page_size'],
                    sort_by=request_object['sort_by'])

            get_everything_filtered = transform_data(get_everything['articles'], keys)
        except Exception as e:
            if error_message == '':
                error_message = e.args[0]
            get_everything_filtered = {'error': error_message}
        return json.dumps({"data" : get_everything_filtered})

@application.route('/news_sources', methods=['GET'])
def get_news_sources():
    if request.method == 'GET':
        keys = ['id', 'name']
        newsapi = NewsApiClient(api_key=NEWS_API_KEY)
        request_object = {'language': 'en', 'country': 'us'}

        if 'category' in request.args:
            category = request.args['category']
            request_object['category'] = category

        if 'category' in request_object and request_object['category'] != 'all':
            get_sources = newsapi.get_sources(
                category=category, 
                language=request_object['language'],
                country=request_object['country'])
        else:
            get_sources = newsapi.get_sources(
                language=request_object['language'],
                country=request_object['country'])
        get_sources_filtered = transform_data(get_sources['sources'], keys)
        return json.dumps({"data" : get_sources_filtered})


@application.route('/word_cloud', methods=['GET'])
def get_word_cloud_data():
    newsapi = NewsApiClient(api_key=NEWS_API_KEY)
    request_object = {'language':'en', 'pageSize': 100}
    keys = ['title']
    top_headlines = newsapi.get_top_headlines(
            page_size=request_object['pageSize'],
            language=request_object['language'])
    top_headlines_titles = transform_data(top_headlines['articles'], keys)

    file = open('static/stopwords_en.txt', 'r')
    stop_words = {}
    for line in file:
        stop_words[line.strip()] = 1
    title_dict = defaultdict(int)

    for title in top_headlines_titles:
        title_words = title['title'].split(' ')
        for word in title_words:
            if word not in stop_words:
                title_dict[word] += 1

    top_30_titles = sorted(title_dict.items(), key=lambda x: [x[1], x[0]], reverse=True)[:30]
    top_30_titles_dict = []
    count = 31

    for i in range(30):
        word = top_30_titles[i][0]
        size = count
        top_30_titles_dict.append({'word': word, 'size': size})
        count -= 1
    
    return json.dumps({"data" : top_30_titles_dict})