// Script to add Houston-area locations with proper coordinates
// Run this in the browser console or as a Node.js script

const houstonLocations = [
  {
    name: "Memorial Park",
    address: "6501 Memorial Dr, Houston, TX 77024",
    category: "park",
    geo: {
      lat: 29.7604,
      lng: -95.3698
    },
    notesPublic: "Large urban park with hiking trails, playgrounds, and picnic areas. Perfect for family gatherings.",
    parking: {
      text: "Free parking available in multiple lots",
      instructions: "Follow signs to designated parking areas"
    },
    isImportant: true,
    amenities: ["Playground", "Hiking Trails", "Picnic Areas", "Restrooms"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Sam Houston National Forest",
    address: "394 FM 1375 West, New Waverly, TX 77358",
    category: "campground",
    geo: {
      lat: 30.5375,
      lng: -95.4619
    },
    notesPublic: "Beautiful forest with camping sites, hiking trails, and fishing opportunities. Great for overnight adventures.",
    parking: {
      text: "Parking available at trailheads and campgrounds",
      instructions: "Check with ranger station for current conditions"
    },
    isImportant: true,
    amenities: ["Camping", "Hiking Trails", "Fishing", "Picnic Areas"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Double Lake Recreation Area",
    address: "Double Lake Rd, Coldspring, TX 77331",
    category: "campground",
    geo: {
      lat: 30.5919,
      lng: -95.1294
    },
    notesPublic: "Scenic lake area with camping, fishing, and water activities. Popular for family campouts.",
    parking: {
      text: "Parking available near lake and campground areas",
      instructions: "Follow signs to recreation area"
    },
    isImportant: true,
    amenities: ["Camping", "Fishing", "Swimming", "Boat Ramp"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "St. Luke's United Methodist Church",
    address: "3471 Westheimer Rd, Houston, TX 77027",
    category: "church",
    geo: {
      lat: 29.7374,
      lng: -95.4342
    },
    notesPublic: "Community church with meeting rooms and parking. Regular meeting location for pack activities.",
    parking: {
      text: "Free parking in church lot",
      instructions: "Enter from Westheimer Road"
    },
    isImportant: false,
    amenities: ["Meeting Rooms", "Parking", "Restrooms"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Hermann Park",
    address: "6001 Fannin St, Houston, TX 77030",
    category: "park",
    geo: {
      lat: 29.7174,
      lng: -95.3932
    },
    notesPublic: "Large urban park with museums, gardens, and recreational facilities. Great for educational outings.",
    parking: {
      text: "Paid parking available in multiple lots",
      instructions: "Check park website for current parking rates"
    },
    isImportant: true,
    amenities: ["Museums", "Gardens", "Playground", "Picnic Areas"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Buffalo Bayou Park",
    address: "1800 Allen Pkwy, Houston, TX 77019",
    category: "park",
    geo: {
      lat: 29.7604,
      lng: -95.3698
    },
    notesPublic: "Urban park along Buffalo Bayou with walking trails, bike paths, and scenic views of downtown Houston.",
    parking: {
      text: "Street parking and paid lots available",
      instructions: "Park along Allen Parkway or in designated lots"
    },
    isImportant: true,
    amenities: ["Walking Trails", "Bike Paths", "Scenic Views", "Picnic Areas"],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

console.log('Houston locations data ready to add to Firestore:');
console.log(JSON.stringify(houstonLocations, null, 2));

// To add these to Firestore, you would use:
// import { collection, addDoc } from 'firebase/firestore';
// const db = getFirestore();
// houstonLocations.forEach(async (location) => {
//   await addDoc(collection(db, 'locations'), location);
// });
