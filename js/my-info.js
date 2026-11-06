
import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

const loading = $("profile-loading");
const content = $("profile-content");
const pageError = $("page-error");
const profileMessage = $("profile-message");

let currentUser = null;
let profileData = {};
let activeEditor = null;

const fields = {
  name: {
    label: "Full name",
    element: "info-name",
    placeholder: "Enter your full name",
    maxLength: 80,
    required: true
  },
  phone: {
    label: "Mobile number",
    element: "info-phone",
    placeholder: "Enter your 10-digit mobile number",
    maxLength: 10,
    required: true,
    type: "tel"
  },
  alternatePhone: {
    label: "Alternate mobile number",
    element: "info-alternatePhone",
    placeholder: "Enter alternate mobile number",
    maxLength: 10,
    required: false,
    type: "tel"
  },
  address: {
    label: "House / flat and street",
    element: "info-address",
    placeholder: "Enter your house and street address",
    maxLength: 200,
    required: true
  },
  area: {
    label: "Area / locality",
    element: "info-area",
    placeholder: "Enter your area or locality",
    maxLength: 100,
    required: true
  },
  landmark: {
    label: "Landmark",
    element: "info-landmark",
    placeholder: "Enter a nearby landmark",
    maxLength: 120,
    required: false
  }
};

function showMessage(message, success = false) {
  profileMessage.textContent = message;
  profileMessage.classList.toggle("success", success);
}

function showPageError(message) {
  pageError.textContent = message;
}

function displayValue(value) {
  return value && String(value).trim()
    ? String(value)
    : "Not added yet";
}

function renderProfile() {
  $("info-name").textContent =
    displayValue(profileData.name || currentUser.displayName);

  $("info-email").textContent =
    currentUser.email || profileData.email || "Not available";

  $("info-phone").textContent =
    displayValue(profileData.phone);

  $("info-alternatePhone").textContent =
    displayValue(profileData.alternatePhone);

  $("info-address").textContent =
    displayValue(profileData.address);

  $("info-area").textContent =
    displayValue(profileData.area);

  $("info-landmark").textContent =
    displayValue(profileData.landmark);
}

async function loadProfile(user) {
  try {
    const userRef = doc(db, "users", user.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      showPageError(
        "Your profile could not be found. Please contact support."
      );
      loading.hidden = true;
      return;
    }

    profileData = snapshot.data();

    renderProfile();

    loading.hidden = true;
    content.hidden = false;

  } catch (error) {
    console.error("My Info load error:", error);

    loading.hidden = true;

    showPageError(
      "Could not load your information. Please refresh and try again."
    );
  }
}

function closeEditor() {
  if (!activeEditor) return;

  const {
    row,
    valueElement,
    editButton,
    editor
  } = activeEditor;

  editor.remove();
  valueElement.hidden = false;
  editButton.hidden = false;

  activeEditor = null;
}

function validateField(field, value) {
  const cleanValue = value.trim();

  if (field.required && !cleanValue) {
    return `${field.label} cannot be empty.`;
  }

  if (
    field.type === "tel" &&
    cleanValue &&
    !/^[6-9]\d{9}$/.test(cleanValue)
  ) {
    return "Enter a valid 10-digit Indian mobile number.";
  }

  if (
    field.type === "tel" &&
    cleanValue &&
    activeEditor?.fieldKey === "alternatePhone" &&
    cleanValue === String(profileData.phone || "").trim()
  ) {
    return "Alternate number must be different from your main number.";
  }

  return "";
}

function openEditor(fieldKey, button) {
  if (activeEditor) {
    closeEditor();
  }

  const field = fields[fieldKey];
  if (!field) return;

  const valueElement = $(field.element);
  const row = button.closest(".info-row");

  const editor = document.createElement("form");
  editor.className = "my-info-editor";

  const input = document.createElement("input");
  input.type = field.type || "text";
  input.name = fieldKey;
  input.maxLength = field.maxLength;
  input.placeholder = field.placeholder;
  input.value = String(
    profileData[fieldKey] || (
      fieldKey === "name" ? currentUser.displayName || "" : ""
    )
  );
  input.autocomplete = "off";
  input.required = field.required;

  if (field.type === "tel") {
    input.inputMode = "numeric";
  }

  input.style.cssText = `
    display:block;
    width:100%;
    min-height:44px;
    margin-top:10px;
    padding:10px 12px;
    border:1px solid #d9d4cb;
    border-radius:2px;
    background:#fff;
    color:#171717;
    font:14px "Jost",Arial,sans-serif;
    outline:none;
  `;

  const error = document.createElement("p");
  error.style.cssText = `
    display:none;
    margin:7px 0 0;
    color:#a32d2d;
    font-size:11px;
    line-height:1.5;
  `;

  const actions = document.createElement("div");
  actions.style.cssText = `
    display:flex;
    gap:9px;
    margin-top:12px;
  `;

  const saveButton = document.createElement("button");
  saveButton.type = "submit";
  saveButton.textContent = "SAVE";
  saveButton.style.cssText = `
    min-width:75px;
    padding:9px 15px;
    border:1px solid #171717;
    background:#171717;
    color:#fff;
    font:10px "Jost",Arial,sans-serif;
    letter-spacing:.08em;
    cursor:pointer;
  `;

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.textContent = "CANCEL";
  cancelButton.style.cssText = `
    min-width:75px;
    padding:9px 15px;
    border:1px solid #e5e0d7;
    background:#fff;
    color:#171717;
    font:10px "Jost",Arial,sans-serif;
    letter-spacing:.08em;
    cursor:pointer;
  `;

  actions.append(saveButton, cancelButton);
  editor.append(input, error, actions);

  valueElement.hidden = true;
  button.hidden = true;
  valueElement.parentElement.append(editor);

  activeEditor = {
    row,
    valueElement,
    editButton: button,
    editor,
    fieldKey
  };

  input.focus();
  input.select();

  cancelButton.addEventListener("click", () => {
    closeEditor();
    showMessage("");
  });

  editor.addEventListener("submit", async (event) => {
    event.preventDefault();

    const newValue = input.value.trim();
    const validationError = validateField(field, newValue);

    if (validationError) {
      error.textContent = validationError;
      error.style.display = "block";
      input.style.borderColor = "#a32d2d";
      return;
    }

    error.style.display = "none";
    input.style.borderColor = "#d9d4cb";

    saveButton.disabled = true;
    cancelButton.disabled = true;
    saveButton.textContent = "SAVING...";

    try {
      const userRef = doc(db, "users", currentUser.uid);

      await updateDoc(userRef, {
        [fieldKey]: newValue,
        updatedAt: serverTimestamp()
      });

      if (fieldKey === "name") {
        await updateProfile(currentUser, {
          displayName: newValue
        });
      }

      profileData[fieldKey] = newValue;

      renderProfile();
      closeEditor();

      showMessage(`${field.label} updated successfully.`, true);

    } catch (error) {
      console.error("Profile update error:", error);

      saveButton.disabled = false;
      cancelButton.disabled = false;
      saveButton.textContent = "SAVE";

      const editorError = editor.querySelector("p");
      editorError.textContent =
      "Could not save this information. Please try again.";
      editorError.style.display = "block";
      input.style.borderColor = "#a32d2d";
    }
  });
}

function errorMessage(firebaseError, editorError) {
  console.error(firebaseError);

  const message = editorError.closest("form")?.querySelector("p");

  if (message) {
    message.textContent =
      "Could not save this information. Please try again.";
    message.style.display = "block";
  }
}

// Edit buttons
document.querySelectorAll("[data-edit]").forEach((button) => {
  button.addEventListener("click", () => {
    showMessage("");
    openEditor(button.dataset.edit, button);
  });
});

// Authentication
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  currentUser = user;
  await loadProfile(user);
});
