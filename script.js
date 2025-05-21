// script.js - Fixed version

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js";

// Firebase config - Your existing config
const firebaseConfig = {
  apiKey: "AIzaSyAuh8ek6jeWSgLMtUlZxqnbs-EwIE2L8Xw",
  authDomain: "tracksy-47ecb.firebaseapp.com",
  projectId: "tracksy-47ecb",
  storageBucket: "tracksy-47ecb.appspot.com",
  messagingSenderId: "391930755779",
  appId: "1:391930755779:web:c489c1602fe30dfd2c4076",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Get current page
const currentPage = window.location.pathname.split("/").pop() || "index.html";

if (currentPage === "index.html" || currentPage === "") {
  // LOGIN PAGE LOGIC
  const googleSignInBtn = document.getElementById("googleSignInBtn");
  const errorMsg = document.getElementById("errorMsg");

  // Check if user is already logged in
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Already logged in? Redirect to dashboard
      window.location.href = "dashboard.html";
    }
  });

  if (googleSignInBtn) {
    googleSignInBtn.addEventListener("click", () => {
      errorMsg.textContent = ""; // Clear any previous errors
      
      signInWithPopup(auth, provider)
        .then((result) => {
          const user = result.user;
          console.log("Authentication successful:", user);
          
          // Check if user has appropriate email domain
          if (user.email && !user.email.endsWith("@gmail.com")) {
            errorMsg.textContent = "Access restricted to internal users.";
            signOut(auth);
            return;
          }
          
          // Redirect to dashboard after successful login
          window.location.href = "dashboard.html";
        })
        .catch((error) => {
          console.error("Authentication error:", error);
          errorMsg.textContent = "Login failed: " + error.message;
        });
    });
  } else {
    console.error("Sign-in button not found");
  }

} else if (currentPage === "dashboard.html") {
  // DASHBOARD PAGE LOGIC

  // Modal elements
  const modalOverlay = document.getElementById("modalOverlay");
  const modalText = document.getElementById("modalText");
  const modalConfirm = document.getElementById("modalConfirm");
  const modalCancel = document.getElementById("modalCancel");

  function showModal(message) {
    modalText.textContent = message;
    modalOverlay.style.display = "flex";

    return new Promise((resolve) => {
      modalConfirm.onclick = () => {
        modalOverlay.style.display = "none";
        resolve(true);
      };
      modalCancel.onclick = () => {
        modalOverlay.style.display = "none";
        resolve(false);
      };
    });
  }

  const chefNameEl = document.getElementById("chefName");
  const logoutBtn = document.getElementById("logoutBtn");
  const addMoreBtn = document.getElementById("addMore");
  const recordForm = document.getElementById("recordForm");
  const statusMsg = document.getElementById("statusMsg");
  const submitBtn = document.getElementById("submitBtn");

  let currentChef = "";

  // Check if user is logged in
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User authenticated:", user);
      const userDomain = user.email.split("@")[1].toLowerCase();
      if (userDomain !== "gmail.com") {
        alert("Access restricted to internal users.");
        signOut(auth);
        window.location.href = "index.html";
        return;
      }
      currentChef = user.displayName || user.email.split("@")[0];
      chefNameEl.textContent = currentChef;
    } else {
      console.log("No user authenticated, redirecting to login");
      window.location.href = "index.html"; // redirect if not signed in
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      const confirmed = await showModal("Are you sure you want to log out?");
      if (confirmed) {
        await signOut(auth);
        window.location.href = "index.html";
      }
    });
  }

  if (addMoreBtn) {
    addMoreBtn.addEventListener("click", async () => {
      const confirmed = await showModal("Add another record?");
      if (!confirmed) return;

      const originalRecord = recordForm.querySelector(".record");
      const newRecord = originalRecord.cloneNode(true);

      // Reset all inputs in the new record
      newRecord.querySelectorAll("input, select").forEach((input) => {
        input.value = "";
      });
      newRecord.classList.remove("incomplete");

      // Insert the new record before the addMore button
      recordForm.insertBefore(newRecord, addMoreBtn);
    });
  }

  function clearForm() {
    const records = recordForm.querySelectorAll(".record");
    records.forEach((record, i) => {
      if (i > 0) {
        record.remove();
      } else {
        record.querySelectorAll("input, select").forEach((input) => {
          input.value = "";
        });
        record.classList.remove("incomplete");
      }
    });
    statusMsg.textContent = "";
    statusMsg.classList.remove("error", "success");
  }

  function validateRecords() {
    const records = [];
    let hasIncomplete = false;
    const now = new Date();
    const helsinkiDate = now.toLocaleDateString("fi-FI", { timeZone: "Europe/Helsinki" });

    recordForm.querySelectorAll(".record").forEach((recordEl) => {
      // Fix incorrect selectors here - use correct ID/name
      const sauce = recordEl.querySelector("[name='sauce']").value.trim();
      const cookingTemp = recordEl.querySelector("[name='cookingTemp']").value.trim();
      const coolingTemp = recordEl.querySelector("[name='coolingTemp']").value.trim();
      const coolingTimeFrom = recordEl.querySelector("[name='coolingTimeFrom']").value.trim();
      const coolingTimeTo = recordEl.querySelector("[name='coolingTimeTo']").value.trim();

      if (!sauce || !cookingTemp || !coolingTemp || !coolingTimeFrom || !coolingTimeTo) {
        hasIncomplete = true;
        recordEl.classList.add("incomplete");
      } else {
        recordEl.classList.remove("incomplete");
        records.push({
          chef: currentChef,
          sauce,
          cookingTemp: Number(cookingTemp),
          coolingTemp: Number(coolingTemp),
          coolingTimeFrom,
          coolingTimeTo,
          date: helsinkiDate,
        });
      }
    });

    return hasIncomplete ? null : records;
  }

  if (recordForm) {
    recordForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const confirmed = await showModal("Confirm submission?");
      if (!confirmed) return;

      const data = validateRecords();
      if (!data) {
        statusMsg.textContent = "Please fill in all fields for all records.";
        statusMsg.classList.add("error");
        statusMsg.classList.remove("success");
        return;
      }

      statusMsg.textContent = "";
      statusMsg.classList.remove("error", "success");

      try {
        submitBtn.disabled = true;

        // Here you would typically send data to your backend
        console.log("Submitting data:", data);
        
        // Simulate async submission
        await new Promise((resolve) => setTimeout(resolve, 1000));

        statusMsg.textContent = "Records submitted successfully!";
        statusMsg.classList.add("success");
        statusMsg.classList.remove("error");

        setTimeout(() => {
          clearForm();
          statusMsg.textContent = "";
          statusMsg.classList.remove("success");
        }, 3000);
      } catch (error) {
        console.error("Submission error:", error);
        statusMsg.textContent = "Submission failed. Please try again.";
        statusMsg.classList.add("error");
        statusMsg.classList.remove("success");
      } finally {
        submitBtn.disabled = false;
      }
    });
  }
}