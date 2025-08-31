// js/app.js
const loginForm = document.getElementById('login-form');
const appContainer = document.getElementById('app-container');
const loginContainer = document.getElementById('login-container');
const hotelNameElement = document.getElementById('hotel-name');
const roomGrid = document.getElementById('room-grid');
const logoutBtn = document.getElementById('logout-btn');

// Firestore Collection Reference
const hotelsRef = db.collection('hotels');

// Login Event Listener
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('Login successful:', userCredential.user.email);
            // On successful login, fetch and display hotel data
            fetchHotelData(userCredential.user.email);
            loginContainer.style.display = 'none';
            appContainer.style.display = 'block';
        })
        .catch((error) => {
            console.error('Login failed:', error.message);
            alert('Login failed: ' + error.message);
        });
});

// Logout Event Listener
logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
        console.log('User signed out.');
        loginContainer.style.display = 'block';
        appContainer.style.display = 'none';
        roomGrid.innerHTML = ''; // Clear rooms
    }).catch((error) => {
        console.error('Logout failed:', error.message);
    });
});

// Function to fetch and display hotel data
function fetchHotelData(userEmail) {
    let hotelDocId = '';
    
    // Map user email to hotel document ID
    if (userEmail === 'user1@example.com') {
        hotelDocId = 'hotel-a';
    } else if (userEmail === 'user2@example.com') {
        hotelDocId = 'hotel-b';
    } else if (userEmail === 'user3@example.com') {
        hotelDocId = 'hotel-c';
    } else {
        alert('Unauthorized user.');
        auth.signOut();
        return;
    }

    hotelsRef.doc(hotelDocId).get().then((doc) => {
        if (doc.exists) {
            const hotelData = doc.data();
            hotelNameElement.textContent = hotelData.name;
            displayRooms(hotelData.rooms, hotelDocId);
        } else {
            console.error("No such hotel document!");
        }
    }).catch((error) => {
        console.error("Error getting hotel data:", error);
    });
}

// Function to display rooms
function displayRooms(rooms, hotelDocId) {
    roomGrid.innerHTML = ''; // Clear previous rooms
    rooms.forEach(room => {
        const roomCard = document.createElement('div');
        const statusClass = room.status === 'Available' ? 'status-available' : 'status-booked';
        
        roomCard.className = `room-card ${statusClass}`;
        roomCard.innerHTML = `
            <span class="room-number">${room.roomNumber}</span>
            <span class="room-status">${room.status}</span>
        `;
        
        // Add click listener to toggle room status
        roomCard.addEventListener('click', () => {
            toggleRoomStatus(hotelDocId, room);
        });

        roomGrid.appendChild(roomCard);
    });
}

// Function to toggle room status
function toggleRoomStatus(hotelDocId, room) {
    const newStatus = room.status === 'Available' ? 'Booked' : 'Available';
    const roomToUpdate = { ...room, status: newStatus };

    db.runTransaction(async (transaction) => {
        const hotelDocRef = hotelsRef.doc(hotelDocId);
        const hotelDoc = await transaction.get(hotelDocRef);
        if (!hotelDoc.exists) {
            throw "Document does not exist!";
        }

        const rooms = hotelDoc.data().rooms;
        const roomIndex = rooms.findIndex(r => r.roomNumber === room.roomNumber);
        
        if (roomIndex > -1) {
            rooms[roomIndex] = roomToUpdate;
            transaction.update(hotelDocRef, { rooms: rooms });
        }
    }).then(() => {
        console.log(`Room ${room.roomNumber} status updated to ${newStatus}`);
        // Re-fetch and display the updated data
        fetchHotelData(auth.currentUser.email);
    }).catch((error) => {
        console.error("Transaction failed:", error);
    });
}