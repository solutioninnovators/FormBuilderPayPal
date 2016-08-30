/**
 * The following fields are available for pricing:
 *
 * total (type: Text or Hidden) - This field is required to enable pricing on any form. It will show the calculated total to the user and record it in the database. Set this to Hidden and create a *_amount field (see below) if you want the user to be able to adjust the price.
 *
 * *_amount (type: Text) - Any field with "_amount" appended to the field name will be added to the total.
 *
 * base_price (type: Hidden) - The base price for the form if no options are included
 *
 *
 * number_of_adults (type: Integer) - Field to record the number of adults the user wants to register (use in conjunction with adult_price)
 * number_of_youth (type: Integer) - Field to record the number of youth the user wants to register (use in conjunction with youth_price)
 * number_of_children (type: Integer) - Field to record the number of children the user wants to register (use in conjunction with children_price)
 * adult_price (type: Hidden) - Price per adult being registered (use in conjunction with number_of_adults)
 * youth_price (type: Hidden) - Price per youth being registered (use in conjunction with number_of_youth)
 * child_price (type: Hidden) - Price per child being registered (use in conjunction with number_of_children)
 * max_price (type: Hidden) - Use this to limit the total cost to a maximum, regardless of what options/attendees are selected
 * min_price (type: Hidden) - Use this to make sure the price does not drop below a certain threshold, regardless of what options are selected
 * paid_online (type: Hidden) - The amount paid online
 * item_name (type: Hidden) - The item name to pass to the payment provider, to describe the product/service being sold
 * transaction_id (type: Hidden) - An empty field to record the unique transaction id returned from the payment provider
 * payment_status (type: Hidden) - An empty field to record the status (i.e. "Completed") returned from the payment provider
 *
 * To give options a price, create a radio button or select field and set the value of the option to the price you wish to add to the total (leave out currency symbols)
 */

function numberOfAttendees(attendeeType) {
    var numberOfAttendees = 0;
    var $field = $('#Inputfield_number_of_'+attendeeType);
    if($field.length) { // If field exists on the page...
        numberOfAttendees = parseInt($field.val()) || 0; // Use value in the field or use 0 if NaN (Not a Number)
        if(numberOfAttendees < 0) { numberOfAttendees = 0 }; // Convert to zero if less than 0
        //$field.val(numberOfAttendees); // Update the field on the page
    }
    return numberOfAttendees;
}

function calculateTotals() {
    var numberOfAdults = numberOfAttendees('adults');
    var numberOfYouth = numberOfAttendees('youth');
    var numberOfChildren = numberOfAttendees('children');

    var basePrice = parseFloat($('input:hidden[name="base_price"]').val()) || 0;  // Set event base price based on hidden field
    var adultPrice = parseFloat($('input:hidden[name="adult_price"]').val()) || 0;  // Set adult attendee price based on hidden field
    var youthPrice = parseFloat($('input:hidden[name="youth_price"]').val()) || 0;  // Set youth attendee price based on hidden field
    var childPrice = parseFloat($('input:hidden[name="child_price"]').val()) || 0;  // Set child attendee price based on hidden field
    var maxPrice = parseFloat($('input:hidden[name="max_price"]').val()) || 1000000;  // Set max price based on hidden field or set to 1,000,000 if no value is present
    var minPrice = parseFloat($('input:hidden[name="min_price"]').val()) || 0;  // Set min price based on hidden field or 0 if no value is present
    var total = 0;
    var options = 0;

    // Member Pricing (Falls-back to non-member pricing where hidden field does not exist)
    if($('input:checkbox[name="member"]').is(':checked')) {
        var $memberBasePrice = $('input:hidden[name="member_base_price"]');
        if($memberBasePrice.length) basePrice = parseFloat($memberBasePrice.val()) || 0;

        var $memberAdultPrice = $('input:hidden[name="member_adult_price"]');
        if($memberAdultPrice.length) adultPrice = parseFloat($memberAdultPrice.val()) || 0;

        var $memberYouthPrice = $('input:hidden[name="member_youth_price"]');
        if($memberYouthPrice.length) youthPrice = parseFloat($memberYouthPrice.val()) || 0;

        var $memberChildPrice = $('input:hidden[name="member_child_price"]');
        if($memberChildPrice.length) childPrice = parseFloat($memberChildPrice.val()) || 0;

        var $memberMaxPrice = $('input:hidden[name="member_max_price"]');
        if($memberMaxPrice.length) maxPrice = parseFloat($memberMaxPrice.val()) || 1000000;

        var $memberMinPrice = $('input:hidden[name="member_min_price"]');
        if($memberMinPrice.length) minPrice = parseFloat($memberMinPrice.val()) || 0;
    }

    // Calculate cost of options based on radio buttons and checkboxes...
    $('input:radio:checked, input:checkbox:checked').each(function() {
        if(parseFloat(this.value)) { // ...if the value can be converted to a proper float...
            options = options + parseFloat(this.value);
        }
    });

    // Add on the value of any input fields with "_amount" in the name
    $('input[id*="_amount"]').each(function() {
        if(this.value) {
            var parsedValue = String(this.value);
            parsedValue = parsedValue.replace(/[^0-9.-]/g, ""); // Strip out non-numbers

            if(parsedValue != '') {
                parsedValue = parseFloat(parsedValue) || 0;
                parsedValue = parsedValue.toFixed(2);

                options = options + parseFloat(parsedValue); // Add the value to the options total
            }

            // Show the formatted price back in the input field
            $(this).val(parsedValue);
        }
    });

    // Add it all together to get the total
    total = basePrice + adultPrice * numberOfAdults + youthPrice * numberOfYouth + childPrice * numberOfChildren + options;

    if(total < minPrice) {
        total = minPrice; // Don't allow the total to drop lower than the minimum price
    }
    if(total > maxPrice) {
        total = maxPrice; // Don't let event total exceed maximum price
    }

    $('#Inputfield_total').val(total.toFixed(2)); // Update the total field

}

$(document).ready(function() {
    var $total = $("#Inputfield_total"); // Get the total field if it exists
    if($total.length) { // Our JS should only apply if the total field exists

        $total.attr('readonly', 'readonly'); // Make the total field read-only

        $("input[id*='_amount'],#Inputfield_total").before("<span class='Inputfield_total-currency'>$ </span>"); // Add a dollar symbol before price fields

        calculateTotals(); // Calculate totals when the page is loaded...

        $('input, select').change(function () {
            calculateTotals(); // ...and each time an input is changed
        });
    }

});