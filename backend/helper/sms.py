import requests
import os
sms_panel_address = "https://api.sms.ir/v1/" 
sms_panel_user_api_key = os.environ.get('SMS_PANEL_API_KEY')
otp_autofill_token = 'rsg$rbhrSFWRG4wr'
STORE_WELCOME_AUTH_TOKEN= 924770

def verification_sms(*args, **kwargs):
    user = args[0]
    activation_code = str(args[1])
    store_title = str(args[2]) if len(args) > 2 else ""
    store_name = str(args[3]) if len(args) > 3 else ""
    
    # If SMS API key is not configured, print OTP to console
    if not sms_panel_user_api_key:
        print("=" * 60)
        print("OTP CODE (SMS not configured - printing to console):")
        print(f"Mobile: {user.mobile}")
        print(f"OTP Code: {activation_code}")
        if store_title:
            print(f"Store Title: {store_title}")
        if store_name:
            print(f"Store Name: {store_name}")
        print("=" * 60)
        return True
    
    # Send SMS if API key is configured
    send_template_sms(
        [
            {"Name": "CODE", "Value": activation_code},
            {"Name": "STORE_NAME", "Value": store_title},
            {"Name": "STORE", "Value": store_name},
        ],
        user.mobile,
        STORE_WELCOME_AUTH_TOKEN,
    )
    return True

def send_template_sms(parameters , to , template):
    """
        parameters is a list of { Name , Value } 
    """
    # If SMS API key is not configured, print OTP to console
    if not sms_panel_user_api_key:
        code_value = next((p["Value"] for p in parameters if p["Name"] == "CODE"), "N/A")
        print("=" * 60)
        print("OTP CODE (SMS not configured - printing to console):")
        print(f"Mobile: {to}")
        print(f"OTP Code: {code_value}")
        print("=" * 60)
        return True
    
    print("sms status", parameters)
    try:
        res = requests.post(
            f"{sms_panel_address}send/verify",
            json={
                "Parameters": parameters,
                "Mobile": to,
                "TemplateId": template,
            },
            headers={
                "Content-Type": "application/json",
                "x-api-key": sms_panel_user_api_key,
            },
        )
        print('sms',to)
        return res.status_code == 201
    except Exception as e:
        print(f"SMS sending failed: {e}")
        # Fallback to console printing
        code_value = next((p["Value"] for p in parameters if p["Name"] == "CODE"), "N/A")
        print("=" * 60)
        print("OTP CODE (SMS failed - printing to console):")
        print(f"Mobile: {to}")
        print(f"OTP Code: {code_value}")
        print("=" * 60)
        return True
def send_verification_sms(parameters , to , template):
    # If SMS API key is not configured, print to console instead
    if not sms_panel_user_api_key:
        code_value = next((p.get("Value", "N/A") for p in parameters if isinstance(p, dict) and p.get("Name") == "CODE"), "N/A")
        print("=" * 60)
        print("OTP CODE (SMS not configured - printing to console):")
        print(f"Mobile: {to}")
        print(f"OTP Code: {code_value}")
        print(f"Template ID: {template}")
        print("=" * 60)
        return True
    
    try:
        res = requests.post(f"{sms_panel_address}/VerificationCode" , json={
            "ParameterArray": parameters,
            "Mobile":to,
            "UserApiKey":sms_panel_user_api_key,
        },headers={
            'Content-Type':'application/json'
        })
        print("STATUS",res.status_code)
        return res.status_code == 201
    except Exception as e:
        # If SMS sending fails, print to console as fallback
        code_value = next((p.get("Value", "N/A") for p in parameters if isinstance(p, dict) and p.get("Name") == "CODE"), "N/A")
        print("=" * 60)
        print(f"SMS sending failed ({e}), printing OTP to console:")
        print(f"Mobile: {to}")
        print(f"OTP Code: {code_value}")
        print("=" * 60)
        return True
