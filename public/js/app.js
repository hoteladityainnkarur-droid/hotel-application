// js/app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, runTransaction } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD1z9Y9jKkxjfS3MRlyGpxB7C_k7keQjfg",
    authDomain: "hotelmanagement-fbd99.firebaseapp.com",
    projectId: "hotelmanagement-fbd99",
    storageBucket: "hotelmanagement-fbd99.firebasestorage.app",
    messagingSenderId: "952002030988",
    appId: "1:952002030988:web:4228d0ca756f8fa2387aa9",
    measurementId: "G-2F1NCYNN16"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Get HTML elements
const loginForm = document.getElementById('login-form');
const appContainer = document.getElementById('app-container');
const loginContainer = document.getElementById('login-container');
const hotelNameElement = document.getElementById('hotel-name');
const roomGrid = document.getElementById('room-grid');
const logoutBtn = document.getElementById('logout-btn');

// Login Event Listener
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log('Login successful!');
            loginContainer.style.display = 'none';
            appContainer.style.display = 'block';
            fetchHotelData(userCredential.user.email);
        })
        .catch((error) => {
            console.error('Login failed:', error.message);
            alert('Login failed: ' + error.message);
        });
});

// Logout Event Listener
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        console.log('User signed out.');
        loginContainer.style.display = 'block';
        appContainer.style.display = 'none';
        roomGrid.innerHTML = '';
    }).catch((error) => {
        console.error('Logout failed:', error.message);
    });
});

function fetchHotelData(userEmail) {
    db.collection('hotels').get()
        .then((querySnapshot) => {
            const hotelsData = [];
            querySnapshot.forEach((doc) => {
                hotelsData.push(doc.data());
            });
            displayAllHotels(hotelsData);
        })
        .catch((error) => {
            console.error("Error getting all hotels:", error);
            alert("Error loading hotels. Please try again.");
        });
}


// Function to display rooms
function displayRooms(rooms, hotelDocId) {
    roomGrid.innerHTML = '';
    rooms.forEach(room => {
        const roomCard = document.createElement('div');
        const statusClass = room.status === 'Available' ? 'status-available' : 'status-booked';
        
        roomCard.className = `room-card ${statusClass}`;
        roomCard.innerHTML = `
            <span class="room-number">${room.roomNumber}</span>
            <span class="room-status">${room.status}</span>
        `;
        
        roomCard.addEventListener('click', () => {
            toggleRoomStatus(hotelDocId, room);
        });

        roomGrid.appendChild(roomCard);
    });
}

function toggleRoomStatus(hotelDocId, room) {
    const newStatus = room.status === 'Available' ? 'Booked' : 'Available';
    const roomToUpdate = { ...room, status: newStatus };

    runTransaction(db, async (transaction) => {
        const hotelDocRef = doc(db, 'hotels', hotelDocId);
        const hotelDoc = await transaction.get(hotelDocRef);
        if (!hotelDoc.exists()) {
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
        fetchHotelData(auth.currentUser.email); // Refetch all data to update the UI
    }).catch((error) => {
        console.error("Transaction failed:", error);
    });
}
function displayAllHotels(hotels) {
    const mainContent = document.getElementById('app-container');
    mainContent.innerHTML = ''; // Clear existing content

    hotels.forEach(hotel => {
        const hotelDiv = document.createElement('div');
        hotelDiv.className = 'hotel-container';
        hotelDiv.innerHTML = `
            <h2>${hotel.name}</h2>
            <div class="room-grid" id="room-grid-${hotel.name.replace(/\s/g, '-').toLowerCase()}"></div>
        `;
        mainContent.appendChild(hotelDiv);

        const roomGridForHotel = document.getElementById(`room-grid-${hotel.name.replace(/\s/g, '-').toLowerCase()}`);
        
        hotel.rooms.forEach(room => {
            const roomCard = document.createElement('div');
            const statusClass = room.status === 'Available' ? 'status-available' : 'status-booked';
            
            roomCard.className = `room-card ${statusClass}`;
            roomCard.innerHTML = `
                <span class="room-number">${room.roomNumber}</span>
                <span class="room-status">${room.status}</span>
            `;
            
            // Re-add the click listener with the necessary data
            roomCard.addEventListener('click', () => {
                toggleRoomStatus(hotel.id, room);
            });

            roomGridForHotel.appendChild(roomCard);
        });
    });
}