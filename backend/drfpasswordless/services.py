from django.utils.module_loading import import_string
from drfpasswordless.settings import api_settings
from drfpasswordless.utils import (
    create_callback_token_for_user,
    has_active_token,
)
class TokenService(object):
    @staticmethod
    def send_token(user, alias_type, token_type,store_title,store_name ,**message_payload):
        # Check if user already has an active (non-expired) token
        # If yes, silently ignore the request and return success
        if has_active_token(user, token_type):
            return True
        
        token = create_callback_token_for_user(user, alias_type, token_type)
        send_action = None

        if user.pk in api_settings.PASSWORDLESS_DEMO_USERS.keys():
            return True
        if alias_type == 'email':
            send_action = import_string(api_settings.PASSWORDLESS_EMAIL_CALLBACK)
        elif alias_type == 'mobile':
            send_action = import_string(api_settings.PASSWORDLESS_SMS_CALLBACK)
        # Send to alias
        success = send_action(user, token, store_title, store_name,**message_payload)
        return success
