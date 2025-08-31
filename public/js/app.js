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

// Function to fetch and display hotel data
function fetchHotelData(userEmail) {
    let hotelDocId = '';
    
    if (userEmail === 'user1@example.com') {
        hotelDocId = 'hotel-a';
    } else if (userEmail === 'user2@example.com') {
        hotelDocId = 'hotel-b';
    } else if (userEmail === 'user3@example.com') {
        hotelDocId = 'hotel-c';
    } else {
        alert('Unauthorized user.');
        signOut(auth);
        return;
    }

    const docRef = doc(db, 'hotels', hotelDocId);
    getDoc(docRef).then((docSnap) => {
        if (docSnap.exists()) {
            const hotelData = docSnap.data();
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

// Function to toggle room status
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
        fetchHotelData(auth.currentUser.email);
    }).catch((error) => {
        console.error("Transaction failed:", error);
    });
}