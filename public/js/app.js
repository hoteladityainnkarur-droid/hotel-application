// js/app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, runTransaction } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

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

// Modal elements
const statusModal = document.getElementById('status-modal');
const modalRoomInfo = document.getElementById('modal-room-info');
const modalAvailableBtn = document.getElementById('modal-available-btn');
const modalBookedBtn = document.getElementById('modal-booked-btn');
const closeBtn = document.querySelector('.close-btn');

let allHotelsData = [];

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
            fetchHotelData();
        })
        .catch((error) => {
            console.error('Login failed:', error.message);
            alert('Login failed: ' + error.message);
        });
});

// Function to fetch all hotel data
function fetchHotelData() {
    const hotelsCollectionRef = collection(db, 'hotels');
    getDocs(hotelsCollectionRef)
        .then((querySnapshot) => {
            allHotelsData = [];
            querySnapshot.forEach((doc) => {
                const hotelData = doc.data();
                hotelData.id = doc.id;
                allHotelsData.push(hotelData);
            });
            displayHotelList(allHotelsData);
        })
        .catch((error) => {
            console.error("Error getting all hotels:", error);
            alert("Error loading hotels. Please try again.");
        });
}

// Function to display the list of hotel names
function displayHotelList(hotels) {
    appContainer.innerHTML = `
        <header>
            <h1>Select a Hotel</h1>
            <button id="logout-btn">Logout</button>
        </header>
        <div id="hotel-list-container"></div>
    `;
    
    const hotelListContainer = document.getElementById('hotel-list-container');
    hotels.forEach(hotel => {
        const hotelCard = document.createElement('div');
        hotelCard.className = 'hotel-card';
        hotelCard.textContent = hotel.name;
        hotelCard.addEventListener('click', () => {
            displayRoomDetails(hotel.id);
        });
        hotelListContainer.appendChild(hotelCard);
    });
    
    // Re-attach the logout event listener
    document.getElementById('logout-btn').addEventListener('click', () => {
        signOut(auth).then(() => {
            console.log('User signed out.');
            loginContainer.style.display = 'block';
            appContainer.style.display = 'none';
            appContainer.innerHTML = '';
        }).catch((error) => {
            console.error('Logout failed:', error.message);
        });
    });
}

// Function to display rooms for a specific hotel
function displayRoomDetails(hotelId) {
    const selectedHotel = allHotelsData.find(hotel => hotel.id === hotelId);
    if (!selectedHotel) return;
    
    appContainer.innerHTML = `
        <header>
            <h1 id="hotel-name">${selectedHotel.name}</h1>
            <button id="back-btn">Back to Hotels</button>
            <button id="logout-btn">Logout</button>
        </header>
        <div id="room-grid" class="room-grid"></div>
    `;
    
    const roomGrid = document.getElementById('room-grid');
    if (selectedHotel.rooms && Array.isArray(selectedHotel.rooms)) {
        selectedHotel.rooms.forEach(room => {
            const roomCard = document.createElement('div');
            const statusClass = room.status === 'Available' ? 'status-available' : 'status-booked';
            
            roomCard.className = `room-card ${statusClass}`;
            roomCard.innerHTML = `
                <span class="room-number">${room.roomNumber}</span>
                <span class="room-status">${room.status}</span>
            `;
            
            roomCard.addEventListener('click', () => {
                openStatusModal(selectedHotel.id, room);
            });
            roomGrid.appendChild(roomCard);
        });
    }

    // Attach event listeners for the new buttons
    document.getElementById('back-btn').addEventListener('click', () => {
        displayHotelList(allHotelsData);
    });
    document.getElementById('logout-btn').addEventListener('click', () => {
        signOut(auth).then(() => {
            console.log('User signed out.');
            loginContainer.style.display = 'block';
            appContainer.style.display = 'none';
            appContainer.innerHTML = '';
        }).catch((error) => {
            console.error('Logout failed:', error.message);
        });
    });
}

// Open modal for status change
function openStatusModal(hotelId, room) {
    statusModal.style.display = 'block';
    modalRoomInfo.textContent = `Room ${room.roomNumber} - Status: ${room.status}`;
    
    modalAvailableBtn.onclick = () => {
        toggleRoomStatus(hotelId, room, 'Available');
        statusModal.style.display = 'none';
    };
    
    modalBookedBtn.onclick = () => {
        toggleRoomStatus(hotelId, room, 'Booked');
        statusModal.style.display = 'none';
    };
}

// Close modal
closeBtn.onclick = () => {
    statusModal.style.display = 'none';
};
window.onclick = (event) => {
    if (event.target === statusModal) {
        statusModal.style.display = 'none';
    }
};

// Function to toggle room status
function toggleRoomStatus(hotelDocId, room, newStatus) {
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
        // After transaction, update the UI without fetching all data again
        const selectedHotel = allHotelsData.find(h => h.id === hotelDocId);
        if (selectedHotel) {
            const roomIndex = selectedHotel.rooms.findIndex(r => r.roomNumber === room.roomNumber);
            if (roomIndex > -1) {
                selectedHotel.rooms[roomIndex].status = newStatus;
            }
            displayRoomDetails(hotelDocId);
        }
    }).catch((error) => {
        console.error("Transaction failed:", error);
    });
}