/* ==========================================================================
   STACKLY TELECOM - AUTHENTICATION & STATE MANAGEMENT
   ========================================================================== */

// --- Initializing Local Database ---
document.addEventListener("DOMContentLoaded", () => {
  initLocalDB();
  checkAuthGuards();
  renderProfileDropdown();
});

function initLocalDB() {
  // 1. Initial Users Seeding
  if (!localStorage.getItem("stackly_users")) {
    const seedUsers = [
      {
        email: "customer@gmail.com",
        password: "123",
        name: "Sarah Connor",
        phone: "9876543210",
        role: "customer",
        balance: 24.50,
        plan: "Premium 5G Unlimited",
        activeSince: "2025-01-15"
      },
      {
        email: "admin@gmail.com",
        password: "123",
        name: "Chief Executive",
        role: "admin"
      }
    ];
    localStorage.setItem("stackly_users", JSON.stringify(seedUsers));
  }

  // 2. Initial Transactions Seeding (for Charts & Logs)
  if (!localStorage.getItem("stackly_transactions")) {
    const seedTransactions = [
      {
        id: "TXN10001",
        email: "customer@gmail.com",
        amount: 29.99,
        planName: "Premium 5G Unlimited",
        date: "2026-06-15",
        status: "success",
        paymentMethod: "Credit Card"
      },
      {
        id: "TXN10002",
        email: "customer@gmail.com",
        amount: 19.99,
        planName: "Standard Mobile Plus",
        date: "2026-05-15",
        status: "success",
        paymentMethod: "UPI"
      },
      {
        id: "TXN10003",
        email: "john.doe@gmail.com",
        amount: 49.99,
        planName: "Gigabit Fiber Premium",
        date: "2026-07-02",
        status: "success",
        paymentMethod: "Net Banking"
      },
      {
        id: "TXN10004",
        email: "alice@gmail.com",
        amount: 59.99,
        planName: "Superfast Fiber 500",
        date: "2026-07-10",
        status: "success",
        paymentMethod: "Debit Card"
      },
      {
        id: "TXN10005",
        email: "customer@gmail.com",
        amount: 10.00,
        planName: "Data Booster 10GB",
        date: "2026-07-14",
        status: "success",
        paymentMethod: "UPI"
      }
    ];
    localStorage.setItem("stackly_transactions", JSON.stringify(seedTransactions));
  }

  // 3. Initial Active Plans Seeding (for Admin and customer selectors)
  if (!localStorage.getItem("stackly_plans")) {
    const seedPlans = [
      { id: "p1", name: "Premium 5G Unlimited", price: 29.99, data: "Unlimited 5G", calls: "Unlimited", validity: "28 Days", type: "mobile", status: "active" },
      { id: "p2", name: "Standard Mobile Plus", price: 19.99, data: "50 GB 4G/5G", calls: "Unlimited", validity: "28 Days", type: "mobile", status: "active" },
      { id: "p3", name: "Essential Budget Pack", price: 9.99, data: "10 GB 4G", calls: "1000 Mins", validity: "14 Days", type: "mobile", status: "active" },
      { id: "p4", name: "Gigabit Fiber Premium", price: 79.99, data: "Unlimited @ 1 Gbps", calls: "Free Landline", validity: "30 Days", type: "broadband", status: "active" },
      { id: "p5", name: "Superfast Fiber 500", price: 59.99, data: "Unlimited @ 500 Mbps", calls: "Free Landline", validity: "30 Days", type: "broadband", status: "active" },
      { id: "p6", name: "Starter Fiber 100", price: 39.99, data: "Unlimited @ 100 Mbps", calls: "Free Landline", validity: "30 Days", type: "broadband", status: "active" }
    ];
    localStorage.setItem("stackly_plans", JSON.stringify(seedPlans));
  }

  // 4. Initial Troubleshooting Tickets Seeding
  if (!localStorage.getItem("stackly_tickets")) {
    const seedTickets = [
      {
        id: "TKT8891",
        email: "customer@gmail.com",
        subject: "Fiber line down",
        category: "technical",
        message: "The broadband red light is blinking since morning. Router rebooted multiple times.",
        status: "pending",
        date: "2026-07-15"
      },
      {
        id: "TKT8892",
        email: "customer@gmail.com",
        subject: "Recharge amount deducted but plan not active",
        category: "billing",
        message: "Attempted a $29.99 recharge via credit card, transaction was successful, but dashboard shows old plan.",
        status: "resolved",
        date: "2026-07-10"
      }
    ];
    localStorage.setItem("stackly_tickets", JSON.stringify(seedTickets));
  }
}

// --- Auth Utilities ---
function getSession() {
  const session = localStorage.getItem("stackly_session");
  return session ? JSON.parse(session) : null;
}

function setSession(user) {
  localStorage.setItem("stackly_session", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("stackly_session");
}

function getUsers() {
  const users = localStorage.getItem("stackly_users");
  return users ? JSON.parse(users) : [];
}

function saveUser(userObj) {
  const users = getUsers();
  users.push(userObj);
  localStorage.setItem("stackly_users", JSON.stringify(users));
}

// Check if email ends with @gmail.com
function isValidGmail(email) {
  const gmailPattern = /^.+@gmail\.com$/;
  return gmailPattern.test(email.toLowerCase().trim());
}

// --- Check Session Guards ---
function checkAuthGuards() {
  const path = window.location.pathname;
  const session = getSession();

  if (path.includes("customer-dashboard.html")) {
    if (!session || session.role !== "customer") {
      window.location.href = "login.html";
    }
  } else if (path.includes("admin-dashboard.html")) {
    if (!session || session.role !== "admin") {
      window.location.href = "login.html";
    }
  }
}

// --- Login Handler ---
function handleLogin(email, password, role, errorCallback) {
  const trimmedEmail = (email || "").trim();
  // Validations
  if (!trimmedEmail) {
    errorCallback("email", "Gmail is required.");
    return;
  }
  if (!isValidGmail(trimmedEmail)) {
    errorCallback("email", "Enter a valid Gmail address.");
    return;
  }
  if (!password || password.length < 2) {
    errorCallback("password", "Password must contain at least 2 characters.");
    return;
  }

  const users = getUsers();
  const lowerEmail = trimmedEmail.toLowerCase();
  
  // Find matching user strictly by email only (DO NOT validate password!)
  let match = users.find(u => u.email.toLowerCase() === lowerEmail);

  if (!match) {
    // Dynamically register if user doesn't exist yet
    const prefix = lowerEmail.split('@')[0];
    const cleanName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    match = {
      email: lowerEmail,
      password: password,
      name: cleanName,
      phone: "9876543210",
      role: role,
      balance: 24.50,
      plan: "none",
      activeSince: new Date().toISOString().split("T")[0]
    };
    users.push(match);
    localStorage.setItem("stackly_users", JSON.stringify(users));
  }

  // Override user's role dynamically based on selection dropdown for this session
  const sessionUser = { ...match, role: role };
  setSession(sessionUser);
  
  // Success Redirect based on selected role
  if (role === "admin") {
    window.location.href = "admin-dashboard.html";
  } else {
    window.location.href = "customer-dashboard.html";
  }
}

// --- Registration Handler ---
function handleRegistration(name, email, password, phone, role, errorCallback) {
  // Validations
  if (!name || name.trim() === "") {
    errorCallback("name", "Name is required.");
    return;
  }
  const trimmedEmail = (email || "").trim();
  if (!trimmedEmail) {
    errorCallback("email", "Gmail is required.");
    return;
  }
  if (!isValidGmail(trimmedEmail)) {
    errorCallback("email", "Enter a valid Gmail address.");
    return;
  }
  if (!password || password.length < 2) {
    errorCallback("password", "Password must contain at least 2 characters.");
    return;
  }
  if (!phone || phone.trim().length < 10) {
    errorCallback("phone", "Please enter a valid contact phone number.");
    return;
  }

  // Allow duplicate Gmail addresses: simply save the new user record without checking.
  const newUser = {
    email: trimmedEmail.toLowerCase(),
    password: password,
    name: name,
    phone: phone,
    role: role || "customer",
    balance: 0.00,
    plan: "none",
    activeSince: new Date().toISOString().split("T")[0]
  };

  saveUser(newUser);
  // Redirect to login page
  window.location.href = "login.html";
}

// --- Profile Icon Render & Actions ---
function renderProfileDropdown() {
  const session = getSession();
  const wrapper = document.getElementById("profile-dropdown-wrapper");
  const mobileWrapper = document.querySelector(".nav-actions-mobile");

  if (mobileWrapper) {
    if (!session) {
      mobileWrapper.innerHTML = `<a href="login.html" class="btn btn-primary" style="width: 100%; gap: 0.5rem;"><i class="fa-solid fa-arrow-right-to-bracket"></i> Login</a>`;
    } else {
      mobileWrapper.innerHTML = `<button class="btn btn-primary" id="logoutBtnMobile" style="width: 100%; gap: 0.5rem;"><i class="fa-solid fa-arrow-right-from-bracket"></i> Logout (${session.name.split(" ")[0]})</button>`;
      const logoutMobile = document.getElementById("logoutBtnMobile");
      if (logoutMobile) {
        logoutMobile.addEventListener("click", () => {
          clearSession();
          window.location.href = "login.html";
        });
      }
    }
  }

  if (!wrapper) return;

  if (!session) {
    // If not logged in, show login link
    wrapper.innerHTML = `<a href="login.html" class="btn btn-nav-login" id="loginBtnNav"><i class="fa-solid fa-arrow-right-to-bracket"></i> Login</a>`;
    return;
  }

  // If logged in, render the profile icon and dynamic dropdown container
  const firstLetter = session.name ? session.name.charAt(0).toUpperCase() : "U";

  wrapper.innerHTML = `
    <button class="profile-trigger" id="profileTriggerBtn">
      <div class="profile-avatar-placeholder">${firstLetter}</div>
      <span class="profile-trigger-name">${session.name.split(" ")[0]}</span>
      <i class="fa-solid fa-chevron-down" style="font-size: 0.8rem; color: var(--text-muted);"></i>
    </button>
    <div class="profile-dropdown" id="profileDropdownMenu">
      <div class="profile-info-header">
        <div class="profile-info-name">${session.name}</div>
        <div class="profile-info-email">${session.email}</div>
        <div class="profile-info-role">${session.role}</div>
      </div>
      <button class="profile-dropdown-btn" id="logoutBtn">
        <i class="fa-solid fa-arrow-right-from-bracket"></i> Logout
      </button>
    </div>
  `;

  // Profile click dropdown trigger
  const trigger = document.getElementById("profileTriggerBtn");
  const dropdown = document.getElementById("profileDropdownMenu");

  if (trigger && dropdown) {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("active");
    });

    document.addEventListener("click", () => {
      dropdown.classList.remove("active");
    });
  }

  // Logout button trigger
  const logout = document.getElementById("logoutBtn");
  if (logout) {
    logout.addEventListener("click", () => {
      clearSession();
      window.location.href = "login.html";
    });
  }
}
