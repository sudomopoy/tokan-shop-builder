import grpc
from concurrent import futures
from .models import Article
from django.db.models import Q
from proto import article_pb2, article_pb2_grpc
from rest_framework.renderers import JSONRenderer
from .serializers import ArticleSerializer
from dateutil.parser import parse
import logging

class ArticleService(article_pb2_grpc.ArticleServiceServicer):
    def GetArticle(self, request, context):
        try:
            article = None
            if hasattr(request, 'slug'):
                article = Article.objects.get(slug=request.slug)
            elif hasattr(request, 'id'):
                article = Article.objects.get(pk=request.id)
            else:
                context.set_code(grpc.StatusCode.ABORTED)
                context.set_details('id or slug not provided')
                response = article_pb2.GetArticleResponse()
                return response

            # submit view for article
            # if any error throwed, should countinue normally 
            if hasattr(request, 'userid'):
                try:
                    article.track_view(request.userid)
                except:
                    logging.error(f'ERROR: user {request.userid} view not tracked')
                    
            serializer = ArticleSerializer(article) 
            article_json = JSONRenderer().render(serializer.data) 
            response = article_pb2.GetArticleResponse(article=article_json)
        except Article.DoesNotExist:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details('Article not found')
            response = article_pb2.GetArticleResponse()
        return response

    def CreateArticle(self, request, context):
        serializer = ArticleSerializer(data=request.__dict__)
        if serializer.is_valid():
            article = serializer.save()
            return article_pb2.Article(**serializer.data)
        else:
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details(serializer.errors)
            return article_pb2.Article()

    def UpdateArticle(self, request, context):
        try:
            article = Article.objects.get(id=request.id)
            serializer = ArticleSerializer(article, data=request.__dict__)
            if serializer.is_valid():
                article = serializer.save()
                return article_pb2.Article(**serializer.data)
            else:
                context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
                context.set_details(serializer.errors)
                return article_pb2.Article()
        except Article.DoesNotExist:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details('Article not found')
            return article_pb2.Article()
        
    def GetArticleList(self, request, context):
        articles = Article.objects.all()

        if request.query:
            articles = articles.filter(
                Q(title__icontains=request.query) |
                Q(description__icontains=request.query) |
                Q(slug__icontains=request.query)
            )

        if request.start_date and request.end_date:
            start_date = parse(request.start_date)
            end_date = parse(request.end_date)
            articles = articles.filter(created_at__range=(start_date, end_date))

        if request.categories:
            articles = articles.filter(category__in=request.categories)

        if request.tags:
            for tag in request.tags:
                articles = articles.filter(tags__icontains=tag)

        total_count = articles.count()
        start = (request.page - 1) * request.page_size
        end = start + request.page_size

        articles = articles[start:end]
        article_list = [
            article_pb2.Article(**ArticleSerializer(article).data)
            for article in articles
        ]

        return article_pb2.GetArticleListResponse(articles=article_list, total_count=total_count)
    
    def DeleteArticle(self, request, context):
        try:
            article = Article.objects.get(id=request.id)
            article.delete()
            return article_pb2.DeleteArticleResponse(message="Article deleted successfully")
        except Article.DoesNotExist:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details('Article not found')
            return article_pb2.DeleteArticleResponse(message="Article not found")
