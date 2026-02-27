from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.conf import settings
from jwt_auth.authentication import StoreJWTAuthentication
from django.urls import path

url = settings.API_URL_BASE

schema_view = get_schema_view(
    openapi.Info(
        title="Tokan API",
        default_version="v1",
        description="API documentation",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
    url=url,
    authentication_classes=[
        StoreJWTAuthentication,
    ],
    # patterns=[
    #     # Add your URL patterns here
    #     # path('account/auth/mobile/', None, name='mobile_auth'),
    #     # path('account/verify/mobile/', None, name='verify_mobile_token'),
    # ]
)

# Passwordless Authentication Schemas
passwordless_auth_schema = {
    "account/auth/mobile/": {
        "post": {
            "operation_id": "mobile_auth",
            "description": "Request authentication token via mobile number",
            "request_body": openapi.Schema(
                type=openapi.TYPE_OBJECT,
                required=["mobile"],
                properties={
                    "mobile": openapi.Schema(
                        type=openapi.TYPE_STRING,
                        description="Mobile number to receive authentication token",
                    )
                },
            ),
            "responses": {
                200: openapi.Response(
                    description="Success",
                    schema=openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            "success": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            "message": openapi.Schema(type=openapi.TYPE_STRING),
                        },
                    ),
                )
            },
        }
    },
    "account/verify/mobile/": {
        "post": {
            "operation_id": "verify_mobile_token",
            "description": "Verify mobile authentication token",
            "request_body": openapi.Schema(
                type=openapi.TYPE_OBJECT,
                required=["mobile", "token"],
                properties={
                    "mobile": openapi.Schema(
                        type=openapi.TYPE_STRING,
                        description="Mobile number used for authentication",
                    ),
                    "token": openapi.Schema(
                        type=openapi.TYPE_STRING,
                        description="Authentication token received via SMS",
                    ),
                },
            ),
            "responses": {
                200: openapi.Response(
                    description="Success",
                    schema=openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            "token": openapi.Schema(type=openapi.TYPE_STRING),
                            "user": openapi.Schema(
                                type=openapi.TYPE_OBJECT,
                                properties={
                                    "id": openapi.Schema(type=openapi.TYPE_INTEGER),
                                    "mobile": openapi.Schema(type=openapi.TYPE_STRING),
                                    "email": openapi.Schema(type=openapi.TYPE_STRING),
                                },
                            ),
                        },
                    ),
                )
            },
        }
    },
}
