const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function populateVolunteerData() {
  try {
    console.log('Populating volunteer needs...');

    const volunteerNeeds = [
      {
        eventId: 'event-001',
        eventTitle: 'Pack 1703 Fall Campout',
        eventDate: '2024-10-15',
        role: 'Check-in Coordinator',
        description: 'Help families check in upon arrival, distribute materials, and answer questions.',
        needed: 2,
        claimed: 0,
        category: 'setup',
        priority: 'high',
        isActive: true,
        skills: ['Communication', 'Organization'],
        ageRequirement: '18+',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        eventId: 'event-001',
        eventTitle: 'Pack 1703 Fall Campout',
        eventDate: '2024-10-15',
        role: 'Food Coordinator',
        description: 'Organize meal preparation, coordinate with families bringing food, and ensure dietary needs are met.',
        needed: 1,
        claimed: 0,
        category: 'food',
        priority: 'high',
        isActive: true,
        skills: ['Planning', 'Coordination'],
        ageRequirement: '18+',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        eventId: 'event-001',
        eventTitle: 'Pack 1703 Fall Campout',
        eventDate: '2024-10-15',
        role: 'Activity Leader',
        description: 'Lead organized activities and games for scouts during free time.',
        needed: 3,
        claimed: 0,
        category: 'activities',
        priority: 'medium',
        isActive: true,
        skills: ['Leadership', 'Creativity'],
        ageRequirement: '16+',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        eventId: 'event-002',
        eventTitle: 'Pinewood Derby',
        eventDate: '2024-02-10',
        role: 'Race Official',
        description: 'Help run the race, record times, and ensure fair competition.',
        needed: 4,
        claimed: 0,
        category: 'supervision',
        priority: 'high',
        isActive: true,
        skills: ['Attention to Detail', 'Fairness'],
        ageRequirement: '18+',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        eventId: 'event-002',
        eventTitle: 'Pinewood Derby',
        eventDate: '2024-02-10',
        role: 'Setup Crew',
        description: 'Help set up the race track, tables, and decorations before the event.',
        needed: 2,
        claimed: 0,
        category: 'setup',
        priority: 'medium',
        isActive: true,
        skills: ['Manual Labor', 'Teamwork'],
        ageRequirement: '14+',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        eventId: 'event-003',
        eventTitle: 'Community Service Project',
        eventDate: '2024-03-15',
        role: 'Project Coordinator',
        description: 'Lead the service project, coordinate with community partners, and ensure safety.',
        needed: 1,
        claimed: 0,
        category: 'supervision',
        priority: 'urgent',
        isActive: true,
        skills: ['Leadership', 'Safety Awareness'],
        ageRequirement: '21+',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    const batch = db.batch();
    
    volunteerNeeds.forEach((need) => {
      const docRef = db.collection('volunteer-needs').doc();
      batch.set(docRef, need);
    });

    await batch.commit();
    console.log('✅ Volunteer needs populated successfully!');

    console.log('Creating sample volunteer signups...');
    
    // Get the first volunteer need to create a signup
    const needsSnapshot = await db.collection('volunteer-needs').limit(1).get();
    if (!needsSnapshot.empty) {
      const firstNeed = needsSnapshot.docs[0];
      const needData = firstNeed.data();
      
      const sampleSignup = {
        needId: firstNeed.id,
        eventId: needData.eventId,
        eventTitle: needData.eventTitle,
        role: needData.role,
        volunteerName: 'Sample Volunteer',
        volunteerEmail: 'volunteer@example.com',
        volunteerPhone: '555-0123',
        volunteerUserId: null, // No user account linked
        count: 1,
        notes: 'Excited to help with this event!',
        status: 'confirmed',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('volunteer-signups').add(sampleSignup);
      
      // Update the claimed count
      await firstNeed.ref.update({
        claimed: 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Sample volunteer signup created!');
    }

    console.log('🎉 Volunteer data population completed!');
  } catch (error) {
    console.error('Error populating volunteer data:', error);
  }
}

populateVolunteerData();
