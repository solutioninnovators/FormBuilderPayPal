<?php
/**
 * Checks for valid IPN and passes processing off to FormBuilderPayPal::processCompletedPayment()
 *
 * To use this file: 
 * 1. Move it into your templates folder
 * 2. Create a template and a corresponding page for it in your site's page tree
 * 3. Enable IPN (Instant Payment Notifications) in your PayPal account's seller tools/settings and put in the full URL to the IPN page on your site (mind your http:// vs https://).
 * 4. Select your IPN page in the FormBuilderPayPal module settings
 */

/*************** Config *****************/

$validRecipient = "example@example.com"; // Email address to send notifications to when an IPN is successful
$invalidRecipient = "example@example.com"; // Email address to send notifications to when an IPN is unsuccessful

/****************************************/

$endpoint = "www.paypal.com";
$account = $modules->FormBuilderPayPal->account;
if($modules->FormBuilderPayPal->test_mode) {
	$endpoint = "www.sandbox.paypal.com";
	$modules->FormBuilderPayPal->test_account;
}

// Send an empty HTTP 200 OK response to acknowledge receipt of the notification
header('HTTP/1.1 200 OK');

// Build the required acknowledgement message out of the notification just received
$req = 'cmd=_notify-validate';               // Add 'cmd=_notify-validate' to beginning of the acknowledgement

foreach ($_POST as $key => $value) {         // Loop through the notification NV pairs
	$value = urlencode(stripslashes($value));  // Encode these values
	$req  .= "&$key=$value";                   // Add the NV pairs to the acknowledgement
}

// Set up the acknowledgement request headers
$header = "POST /cgi-bin/webscr HTTP/1.0\r\n";
$header .= "Host: $endpoint\r\n";
$header .= "Content-Type: application/x-www-form-urlencoded\r\n";
$header .= "Content-Length: " . strlen($req) . "\r\n\r\n";

// Open a socket for the acknowledgement request
$fp = fsockopen("ssl://$endpoint", 443, $errno, $errstr, 30);

// Send the HTTP POST request back to PayPal for validation
fwrite($fp, $header . $req);

// Function to make sure feof doesn't hang (see example on http://www.php.net/feof)
function safe_feof($fp, &$start = NULL) {
	$start = microtime(true);
	return feof($fp);
}

$start = NULL;
$timeout = ini_get('default_socket_timeout');

while(!safe_feof($fp, $start) && (microtime(true) - $start) < $timeout)  // While not End Of File
{
	$res = fgets($fp, 1024);               // Get the acknowledgement response

	if (strcmp ($res, "VERIFIED") == 0) {  // Response contains VERIFIED - process notification

		// Send an email announcing the IPN message is VERIFIED
		$mail_To      = $validRecipient;
		$mail_Subject = "VERIFIED IPN - TEACH";
		$mail_Body    = $req;
		mail($mail_To, $mail_Subject, $mail_Body);

		// Authentication protocol is complete - OK to process notification contents

		// Make sure receiver email matches our account
		if($input->post->receiver_email == $account) {
			$modules->FormBuilderPayPal->processCompletedPayment($input->post); // Update the database and send confirmation emails
		}

	}
	else if (strcmp ($res, "INVALID") == 0) { // Response contains INVALID - reject notification

		// Authentication protocol is complete - begin error handling

		// Send an email announcing the IPN message is INVALID
		$mail_To      = $invalidRecipient;
		$mail_Subject = "INVALID IPN - TEACH";
		$mail_Body    = $req;

		mail($mail_To, $mail_Subject, $mail_Body);
	}
}

fclose($fp);  // Close the file
?>