/**
 * Browser Console Script to Update Christopher Smith's Payment Status
 * 
 * Copy and paste this into your browser console while on the events page:
 */

// Browser Console Script - Update Christopher Smith Payment Status
(async function updateChristopherPayment() {
  try {
    console.log('🔍 Updating Christopher Smith payment status...');
    
    // Get Firebase functions
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const functions = getFunctions();
    
    // Call the admin update function (you'll need to create this)
    const updatePaymentStatus = httpsCallable(functions, 'adminUpdatePaymentStatus');
    
    const result = await updatePaymentStatus({
      eventId: 'lu6kyov2tFPWdFhpcgaj',
      userEmail: 'christophersmithm16@gmail.com',
      paymentStatus: 'completed',
      paymentMethod: 'square',
      paymentNotes: 'Manually updated - Christopher Smith paid via Square'
    });
    
    if (result.data.success) {
      console.log('✅ Payment status updated successfully!');
      console.log('🎉 Refresh the page to see "Payment Complete"');
    } else {
      console.log('❌ Update failed:', result.data.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
