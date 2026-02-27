from django.shortcuts import render
from django.shortcuts import get_object_or_404
from django.http.response import HttpResponseRedirect
from analytics.models import Hit
from link.models import ShortURL

def redirect_to_original(request, short_code):
    url = get_object_or_404(ShortURL, short_code=short_code)

    if url.is_expired():
        return render(request, "shortener/expired.html", {"url": url})

    Hit.add_hit(url, request)

    return HttpResponseRedirect(url.original_url)
