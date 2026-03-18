import os
from io import BytesIO
from django.template.loader import get_template
from xhtml2pdf import pisa


def render_to_pdf(template_src, context_dict={}):
    """
    Renders an HTML template to a PDF document using xhtml2pdf.
    Returns raw PDF bytes on success, or None on failure.
    """
    template = get_template(template_src)
    html = template.render(context_dict)
    result = BytesIO()
    pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result)
    if not pdf.err:
        return result.getvalue()
    return None


def send_payment_sms(payment):
    """
    Sends an SMS to the student's parent after a payment is recorded.
    Requires AT_API_KEY and AT_USERNAME in environment variables.
    Falls back gracefully if credentials are not configured.
    """
    api_key = os.environ.get('AT_API_KEY')
    username = os.environ.get('AT_USERNAME')

    if not api_key or not username:
        # SMS not configured, skip silently
        return

    try:
        import africastalking
        africastalking.initialize(username, api_key)
        sms = africastalking.SMS

        student = payment.student
        message = (
            f"Dear {student.parent_name}, payment of UGX {payment.amount:,.0f} "
            f"has been received for {student.first_name} {student.last_name} "
            f"({student.student_id}) for {payment.term.name}. "
            f"Receipt No: {payment.receipt_number}. Thank you."
        )
        phone = student.parent_phone
        # Ensure phone starts with +256 for Uganda
        if not phone.startswith('+'):
            phone = '+256' + phone.lstrip('0')

        sms.send(message, [phone])
    except Exception as e:
        # Log error but don't crash the payment flow
        print(f"[SMS ERROR] Could not send SMS: {e}")
