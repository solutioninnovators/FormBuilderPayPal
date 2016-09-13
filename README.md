# FormBuilderPayPal - PayPal Payment Integration for ProcessWire FormBuilder
Developed by Mike Spooner (thetuningspoon) for Solution Innovators

Uses PayPal to process payments following a FormBuilder form submission, redirecting to PayPal's site for payment. Delays sending of admin/autoresponder emails until payment is completed.

##Usage

1. Install module and enter PayPal account information in the module's settings. 

2. To enable payment on a particular form, follow the instructions on the bottom of the form editor page.

3. In the template for your IPN (Instant PayPal Notification) page, call $modules->FormBuilderPayPal->processCompletedPayment() to trigger the emails to be sent and the completion flag to be set in the entries database. This method will return the updated form entry (array) if successful, or false if not. You may also call this on your payment confirmation page if you prefer, though this is a less reliable method (there is no guarantee that the user will wait to be redirected back to your site), and has not been tested.