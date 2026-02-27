from django.contrib.sitemaps import Sitemap
from article.models import Article 

class ArticleSitemap(Sitemap):
    def items(self):
        return Article.objects.all() 
    
    def location(self, obj):
        return f'/articles/{obj.pk}'
    
sitemaps = {
    'articles': ArticleSitemap,
}
