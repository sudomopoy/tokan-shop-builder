from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Article

class ArticleAPITestCase(APITestCase):

    def setUp(self):
        # create article
        self.article = Article.objects.create(
            module="blog",
            title="my article",
            description="article description",
            main_image="http://example.com/main.jpg",
            thumbnail_image="http://example.com/thumb.jpg",
            category="example_category"
        )

    def test_create_article(self):
        url = reverse('article-list')
        data = {
            "module": "test_module",
            "title": "test_title",
            "description": "test_description",
            "main_image": "http://example.com/test_main.jpg",
            "thumbnail_image": "http://example.com/test_thumb.jpg",
            "category": "test_category"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Article.objects.count(), 2)
        self.assertEqual(Article.objects.get(id=response.data['id']).title, 'test_title')

    def test_get_articles(self):
        url = reverse('article-list')
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], self.article.title)

    def test_get_single_article(self):
        url = reverse('article-detail', args=[self.article.id])
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], self.article.title)

    def test_update_article(self):
        url = reverse('article-detail', args=[self.article.id])
        data = {
            "module": "updated_module",
            "title": "updated_title",
            "description": "updated_description",
            "main_image": "http://example.com/updated_main.jpg",
            "thumbnail_image": "http://example.com/updated_thumb.jpg",
            "category": "updated_category"
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.article.refresh_from_db()
        self.assertEqual(self.article.title, 'updated_title')

    def test_delete_article(self):
        url = reverse('article-detail', args=[self.article.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Article.objects.count(), 0)
