from django.contrib import admin
from .models import Email, User
class EmailAdmin(admin.ModelAdmin):
    list_display = ('id', 'sender', 'timestamp', 'read', 'archived')

# Register your models here.
admin.site.register(Email, EmailAdmin)
admin.site.register(User)