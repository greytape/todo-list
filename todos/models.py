from django.db import models

class Todo(models.Model):
    title = models.CharField(max_length=50)
    day = models.CharField(max_length=2)
    month = models.CharField(max_length=2)
    year = models.CharField(max_length=4)
    completed = models.BooleanField()
    description = models.CharField(max_length=100)

    def __str__(self):
        return self.title
