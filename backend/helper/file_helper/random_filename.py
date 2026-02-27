
import uuid
import os
from datetime import datetime


def get_random_filename(instance, filename):
    ext = get_file_extension(filename)
    now = datetime.now().strftime("%Y/%m/%d")
    return f"{now}/{uuid.uuid4()}.{ext}"

def get_file_extension(filename): 
    _, ext = os.path.splitext(filename) 
    return ext