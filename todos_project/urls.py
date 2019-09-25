from django.contrib import admin
from django.urls import path, include

from todos.views import HomePageView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', HomePageView.as_view(), name='home'),
    path('api/', include('api.urls')),
]
