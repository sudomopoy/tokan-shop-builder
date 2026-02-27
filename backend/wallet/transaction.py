from django.db import transaction as db_transaction
from .models import Transaction, Wallet
from decimal import Decimal

class TransactionService:
    @staticmethod
    def create_purchase_transaction(wallet: Wallet, amount: Decimal, order=None, status='pending'):
        """
        Create a purchase transaction for an order
        """
        if amount <= 0:
            raise ValueError("Amount must be greater than zero")
            
        if status == 'completed' and wallet.available_balance < amount:
            raise ValueError("Insufficient available balance")
            
        return Transaction.create_transaction(
            wallet=wallet,
            amount=amount,
            payment_method='purchase',
            order=order,
            status=status
        )
        
    @staticmethod
    def create_deposit_transaction(wallet: Wallet, amount: Decimal, is_gift=False, status='pending'):
        """
        Create a deposit transaction
        """
        if amount <= 0:
            raise ValueError("Amount must be greater than zero")
            
        return Transaction.create_transaction(
            wallet=wallet,
            amount=amount,
            payment_method='deposit',
            is_gift=is_gift,
            status=status
        )
        
    @staticmethod
    def create_withdrawal_transaction(wallet: Wallet, amount: Decimal, status='pending'):
        """
        Create a withdrawal transaction
        """
        if amount <= 0:
            raise ValueError("Amount must be greater than zero")
            
        if status == 'completed' and wallet.withdrawable_balance < amount:
            raise ValueError("Insufficient withdrawable balance")
            
        return Transaction.create_transaction(
            wallet=wallet,
            amount=amount,
            payment_method='withdrawal',
            status=status
        )
        
    @staticmethod
    def create_gift_transaction(wallet: Wallet, amount: Decimal, status='pending'):
        """
        Create a gift transaction
        """
        if amount <= 0:
            raise ValueError("Amount must be greater than zero")
            
        return Transaction.create_transaction(
            wallet=wallet,
            amount=amount,
            payment_method='gift',
            is_gift=True,
            status=status
        )
        
    @staticmethod
    def create_card_to_card_transaction(sender_wallet: Wallet, receiver_wallet: Wallet, amount: Decimal, status='pending'):
        """
        Create a card to card transfer transaction
        """
        if amount <= 0:
            raise ValueError("Amount must be greater than zero")
            
        if status == 'completed':
            if sender_wallet.available_balance < amount:
                raise ValueError("Insufficient available balance")
                
            # Create sender transaction
            sender_transaction = Transaction.create_transaction(
                wallet=sender_wallet,
                amount=amount,
                payment_method='card_to_card',
                status=status
            )
            
            # Create receiver transaction
            receiver_transaction = Transaction.create_transaction(
                wallet=receiver_wallet,
                amount=amount,
                payment_method='card_to_card',
                status=status
            )
            
            return sender_transaction, receiver_transaction
            
        return Transaction.create_transaction(
            wallet=sender_wallet,
            amount=amount,
            payment_method='card_to_card',
            status=status
        )
        
    @staticmethod
    def cancel_transaction(transaction: Transaction):
        """
        Cancel a transaction
        """
        if transaction.status not in ['pending', 'processing']:
            raise ValueError("Only pending or processing transactions can be cancelled")
            
        transaction.status = 'canceled'
        transaction.save()
        return transaction
        
    @staticmethod
    def fail_transaction(transaction: Transaction):
        """
        Mark a transaction as failed
        """
        transaction.status = 'failed'
        transaction.save()
        return transaction
        
    @staticmethod
    def complete_transaction(transaction: Transaction):
        """
        Mark a transaction as completed
        """
        if transaction.status != 'pending':
            raise ValueError("Only pending transactions can be completed")
            
        transaction.status = 'completed'
        transaction.save()
        return transaction 