from django.db import models
from django.utils.text import slugify
import json
from .tasks import track_page_view
from ckeditor.fields import RichTextField
from category.models import Category
from core.abstract_models import BaseStoreModel

STATUS_CHOICES = (
    ('draft','Draft'),
    ('public','Public'),
)

class Article(BaseStoreModel):
    module = models.CharField(max_length=100)
    title = models.CharField(max_length=300,null='')
    slug = models.SlugField(unique=True,null='',blank=True, max_length=70)
    description = RichTextField(default='')
    status = models.CharField(choices=STATUS_CHOICES, default='draft', max_length=50)
    main_image = models.ForeignKey('media.Media',on_delete=models.CASCADE,null=True, related_name='article_main_image')
    thumbnail_image = models.ForeignKey('media.Media',on_delete=models.CASCADE,null=True, related_name='thumbnail_image')
    category = models.ForeignKey(Category,null=True, on_delete=models.CASCADE)
    tags = models.ManyToManyField('tag.Tag',null=True,)
    created_at = models.DateTimeField(auto_now_add=True,)
    updated_at = models.DateTimeField(auto_now=True)

    meta_title = models.CharField(max_length=300,null=True, blank=True)  
    meta_description = models.CharField(max_length=500,null=True, blank=True) 
    meta_keywords = models.CharField(max_length=500, null=True,blank=True)
    canonical_url = models.URLField(null=True,blank=True)  
    robots_meta = models.CharField(max_length=100,null=True, blank=True, 
                                   choices=[('index', 'Index'),
                                             ('noindex', 'No-Index'), 
                                             ('follow', 'Follow'), 
                                             ('nofollow', 'No-Follow')])  
    schema_markup = models.TextField(null=True,blank=True)  
    
    extra_data = models.JSONField(default=dict)

    total_views = models.IntegerField(default=0) 

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
                
        if not self.meta_title:
            self.meta_title = self.title  
        
        if not self.meta_description:
            self.meta_description = self.description[:150] 
        
        if not self.canonical_url:
            self.canonical_url = f'/articles/{self.slug}/'


        super().save(*args,**kwargs)

    def generate_seo_configs(self):
        """
            setup seo configs need to generate post created
            it used in singals
        """
        self.meta_keywords = self.get_tags_list()

        self.schema_markup = self.generate_schema_markup() 

        print(self.generate_schema_markup())
        print(self.get_tags_list())

        self.save()
        
    def generate_schema_markup(self):
        """
            seo generate schema markup
        """
        schema = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": self.title,
            "description": self.meta_description,
            "datePublished": self.created_at.isoformat(),
            "image": self.main_image,
            "keywords": self.get_tags_list(),
        }
        return json.dumps(schema)
    def get_tags_list(self):
        """
            generate tags list seprated with comma (,) 
            using in seo configs
        """
        return ",".join([tag.name for tag in self.tags.all()]) 
    
    @staticmethod
    def track_view(articleid):
        track_page_view(articleid)

    def __str__(self):
        return f'{self.pk} {self.module} {self.title}'
    
    class Meta:
        managed = True
        verbose_name = 'Article'
        verbose_name_plural = 'Articles'
        
        indexes = [
            models.Index(fields=['module', 'slug']),
            models.Index(fields=['module', 'title']), 
            models.Index(fields=['module', 'category']),
            models.Index(fields=['module', 'category', 'created_at']),
            models.Index(fields=['module', 'category', 'title']),
        ]


