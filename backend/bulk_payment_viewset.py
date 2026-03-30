"""
BulkPaymentViewSet - to be appended to finance/views.py
"""

# Add this class to the end of finance/views.py

class BulkPaymentViewSet(viewsets.ViewSet):
    """
    ViewSet for bulk payment uploads via Excel file
    POST /api/v1/bulk-payments/upload/ - Upload Excel file with multiple payments
    """
    permission_classes = [IsAuthenticated, IsBursar]

    @action(detail=False, methods=['post'], url_path='upload')
    def upload(self, request):
        """
        Upload and process an Excel file with bulk payments
        
        POST body:
        - file: Excel file (.xlsx or .xls)
        - term_id: ID of the term for these payments
        
        Returns:
        {
            'total_rows': int,
            'successful_payments': int,
            'failed_payments': int,
            'validation_errors': list,
            'created_payments': list,
            'total_amount': decimal
        }
        """
        # Get file and term_id
        file_obj = request.FILES.get('file')
        term_id = request.data.get('term_id')
        
        if not file_obj:
            return Response(
                {'error': 'No file provided. Use "file" field in form data.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not term_id:
            return Response(
                {'error': 'term_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check file type
        filename = file_obj.name.lower()
        if not (filename.endswith('.xlsx') or filename.endswith('.xls')):
            return Response(
                {'error': 'File must be .xlsx or .xls format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Process the bulk payment
            processor = BulkPaymentProcessor(file_obj, term_id, request.user)
            results = processor.process()
            
            return Response(results, status=status.HTTP_200_OK)
            
        except BulkPaymentError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Error processing file: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def list(self, request):
        """Get bulk payment upload history (if implemented)"""
        return Response({
            'message': 'Use POST /upload/ endpoint to upload bulk payments',
            'supported_formats': ['xlsx', 'xls'],
            'required_columns': ['Student ID', 'Amount', 'Receipt Number', 'Payment Method'],
            'valid_payment_methods': ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'MOBILE_MONEY']
        })
