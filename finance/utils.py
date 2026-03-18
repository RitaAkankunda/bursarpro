from io import BytesIO
from django.template.loader import get_template
from xhtml2pdf import pisa
from django.conf import settings
import os

def render_to_pdf(template_src, context_dict={}):
    """
    Renders an HTML template to a PDF document using xhtml2pdf.
    """
    template = get_template(template_src)
    html  = template.render(context_dict)
    
    result = BytesIO()
    
    # Generate PDF
    pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result)
    
    if not pdf.err:
        return result.getvalue()
    return None
