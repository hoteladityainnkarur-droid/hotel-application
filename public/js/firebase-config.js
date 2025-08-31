<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
  const analytics = getAnalytics(app);
</script>