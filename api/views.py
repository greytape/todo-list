from rest_framework import generics
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from todos.models import Todo
from .serializers import TodoSerializer

@method_decorator(csrf_exempt, name='dispatch')
class ListTodo(generics.ListCreateAPIView):
    queryset = Todo.objects.all()
    serializer_class = TodoSerializer


@method_decorator(csrf_exempt, name='dispatch')
class DetailTodo(generics.RetrieveUpdateDestroyAPIView):
    queryset = Todo.objects.all()
    serializer_class = TodoSerializer
