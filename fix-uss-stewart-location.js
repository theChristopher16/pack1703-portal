// Script to fix the missing USS Stewart location
// Run this in the browser console on the locations page
// Go to: https://pack1703-portal.web.app/locations
// Open browser console (F12) and paste this code

const ussStewartLocation = {
  id: "RwI4opwHcUx3GKKF7Ten", // Use the same ID that's referenced in the event
  name: "USS Stewart / Galveston Naval Museum",
  address: "100 Seawolf Parkway, Galveston, TX 77554",
  category: "other",
  geo: { 
    lat: 29.3013, 
    lng: -94.7977 
  },
  notesPublic: "Historic WWII destroyer escort preserved on land as part of the Galveston Naval Museum at Seawolf Park. Perfect for overnight adventures and historical education.",
  notesPrivate: "Check-in at 4:30 PM, contact museum coordinator for group rates",
  parking: {
    text: "Museum parking lot available, follow signs to Seawolf Park"
  },
  amenities: ["Historic ship tour", "Museum exhibits", "Sleeping quarters", "Educational programs"],
  isImportant: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Function to add the location
async function addUSSStewartLocation() {
  try {
    console.log('Adding USS Stewart location...');
    
    // Import Firebase functions
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('./src/firebase/config');
    
    // Add the location document
    await setDoc(doc(db, 'locations', ussStewartLocation.id), ussStewartLocation);
    
    console.log('✅ USS Stewart location added successfully!');
    console.log('Location ID:', ussStewartLocation.id);
    console.log('Location data:', ussStewartLocation);
    
    return true;
  } catch (error) {
    console.error('❌ Error adding USS Stewart location:', error);
    return false;
  }
}

// Run the function
addUSSStewartLocation();
