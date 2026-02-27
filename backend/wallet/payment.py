from abc import ABC, abstractmethod
from .zarin.utils.Config import Config
from .zarin.zarinpal import ZarinPal


class PaymentRequest:
    def __init__(
        self,
        amount,
        description,
        mobile,
        email,
        callback_url="https://api.tokan.app/wallet/verify_payment",
    ):
        self.amount = amount
        self.description = description
        self.mobile = mobile
        self.email = email
        self.callback_url = callback_url


class PaymentVerifyRequest:
    def __init__(self, amount, authority):
        self.amount = amount
        self.authority = authority


class PaymentService(ABC):
    @staticmethod
    def get_instance(payment_gateway):
        gateway_type_name = payment_gateway.gateway_type.name
        if gateway_type_name == "zarinpal":
            return ZarinpalGateway(payment_gateway.configuration, sandbox=payment_gateway.is_sandbox)
        elif gateway_type_name == "aghayepardakht":
            return AghaYePardakhtGateway(payment_gateway.configuration, sandbox=payment_gateway.is_sandbox)
        raise ValueError(f"Unknown payment gateway type: {gateway_type_name}")

    @abstractmethod
    def init_payment(self, payment_info):
        pass

    @abstractmethod
    def verify_payment(self, payment_info):
        pass


import json


class ZarinpalGateway(PaymentService):
    def __init__(self, configurations, sandbox=False):
        config = Config(
            merchant_id=configurations["merchant_id"],
            sandbox=sandbox,
        )
        self.zarinpal = ZarinPal(config)

    def init_payment(self, payment_info: PaymentRequest):
        response = self.zarinpal.payments.create(
            {
                "amount": payment_info.amount * 10,
                "callback_url": payment_info.callback_url,
                "description": payment_info.description,
                "metadata": {
                    # "order_id": payment_info.description,
                    "mobile": payment_info.mobile.replace("+98", "0"),
                },
            }
        )

        print("Payment created successfully:", response)

        if "data" in response and "authority" in response["data"]:
            authority = response["data"]["authority"]
            payment_url = self.zarinpal.payments.generate_payment_url(authority)
            return authority, payment_url, True
        else:
            return "", "", False

    def verify_payment(self, payment_info: PaymentVerifyRequest):
        if payment_info.amount:
            try:
                response = self.zarinpal.verifications.verify(
                    {
                        "amount": payment_info.amount * 10,
                        "authority": payment_info.authority,
                    }
                )

                if response["data"]["code"] == 100:
                    return (
                        100,
                        response["data"]["ref_id"],
                        response["data"]["card_pan"],
                        response["data"]["fee"],
                    )
                elif response["data"]["code"] == 101:
                    return 101, "", "", ""
                else:
                    return 1, "", "", ""

            except Exception as e:
                print("Payment Verification Failed:", e)
                return 2, "", "", ""


class AghaYePardakhtGateway(PaymentService):
    def __init__(self, configurations, sandbox=False):
        self.merchant_id = configurations.get("merchant_id") or getattr(configurations, "merchant_id", None)
        self.sandbox = sandbox

    def init_payment(self, payment_info):
        # logic to create transaction using AghaYePardakht gateway
        return "AghaYePardakht transaction created"

    def verify_payment(self, payment_info):
        pass
