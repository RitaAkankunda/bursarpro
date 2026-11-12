from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('finance', '0012_school_student_id_format_alter_userrole_role'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='BulkImportReceipt',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('source_reference', models.CharField(max_length=100)),
                ('payload_digest', models.CharField(max_length=64)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('imported_by', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL)),
                ('payment', models.OneToOneField(on_delete=django.db.models.deletion.PROTECT, related_name='bulk_import_receipt', to='finance.payment')),
                ('school', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='bulk_import_receipts', to='finance.school')),
            ],
        ),
        migrations.AddConstraint(
            model_name='bulkimportreceipt',
            constraint=models.UniqueConstraint(fields=('school', 'source_reference'), name='uniq_bulk_ref_per_school'),
        ),
    ]
