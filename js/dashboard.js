/* ==========================================================================
   STACKLY TELECOM - DASHBOARD ENGINE & INTERACTIVE CONTROLS
   ========================================================================== */

function initDashboardPage() {
  if (typeof initLocalDB === "function") {
    initLocalDB();
  }

  let session = JSON.parse(localStorage.getItem("stackly_session"));

  const isCustomerPage = window.location.pathname.includes("customer-dashboard.html");
  const isAdminPage = window.location.pathname.includes("admin-dashboard.html");

  // Fallback demo session if user opens dashboard directly
  if (!session) {
    if (isCustomerPage) {
      session = { email: "customer@gmail.com", name: "Sarah Connor", role: "customer", balance: 24.50, plan: "Premium 5G Unlimited" };
      localStorage.setItem("stackly_session", JSON.stringify(session));
    } else if (isAdminPage) {
      session = { email: "admin@gmail.com", name: "Chief Executive", role: "admin" };
      localStorage.setItem("stackly_session", JSON.stringify(session));
    }
  }

  if (isCustomerPage && session && session.role !== "customer") {
    session.role = "customer";
    localStorage.setItem("stackly_session", JSON.stringify(session));
  }
  if (isAdminPage && session && session.role !== "admin") {
    session.role = "admin";
    localStorage.setItem("stackly_session", JSON.stringify(session));
  }

  initSidebarControls();
  initDashboardRouter();
  initProfileDropdown();

  // If customer page, load customer dashboard logic
  if (isCustomerPage && session) {
    initCustomerDashboard(session);
  }
  
  // If admin page, load admin dashboard logic
  if (isAdminPage) {
    initAdminDashboard();
  }

  if (typeof initCustomDropdowns === "function") {
    initCustomDropdowns();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDashboardPage);
} else {
  initDashboardPage();
}

// --- Sidebar Drawer Controls ---
function initSidebarControls() {
  const toggleBtn = document.getElementById("sidebarToggleBtn");
  const sidebar   = document.getElementById("dashboardSidebar");
  const overlay   = document.getElementById("sidebarOverlay");
  const closeBtn  = document.getElementById("sidebarCloseBtn") || document.querySelector(".sidebar-close-btn");

  function openSidebar() {
    if (sidebar) sidebar.classList.add("active");
    if (overlay) overlay.classList.add("active");
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove("active");
    if (overlay) overlay.classList.remove("active");
  }

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      sidebar.classList.contains("active") ? closeSidebar() : openSidebar();
    });
  }

  // Close when ✕ button is clicked
  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeSidebar();
    });
  }

  if (sidebar) {
    // Close when a nav link is clicked
    sidebar.querySelectorAll(".sidebar-link").forEach(link => {
      link.addEventListener("click", () => closeSidebar());
    });
  }

  // Close when clicking the overlay backdrop
  if (overlay) {
    overlay.addEventListener("click", () => closeSidebar());
  }

  // Sidebar Sign Out button click handler
  const sidebarLogout = document.getElementById("sidebarLogoutBtn");
  if (sidebarLogout) {
    sidebarLogout.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("stackly_session");
      window.location.href = "login.html";
    });
  }

  // Sidebar logo click handler -> switch to Overview tab in-dashboard
  const logoLink = document.querySelector(".sidebar-logo a");
  if (logoLink) {
    logoLink.addEventListener("click", (e) => {
      e.preventDefault();
      const overviewSectionId = document.querySelector('.sidebar-link[data-section="overview"]') ? "overview" : "adminOverview";
      navigateToSection(overviewSectionId);
    });
  }
}

// --- Central Navigation & Router Engine ---
function navigateToSection(targetId) {
  if (!targetId) return;

  const targetSection = document.getElementById(targetId);
  if (!targetSection) return;

  const links = document.querySelectorAll(".sidebar-link");
  const sections = document.querySelectorAll(".dashboard-section");

  // Remove active classes from all links & sections
  links.forEach(l => {
    const linkSection = l.getAttribute("data-section") || l.getAttribute("href")?.replace("#", "");
    if (linkSection === targetId) {
      l.classList.add("active");
    } else {
      l.classList.remove("active");
    }
  });

  sections.forEach(s => {
    if (s.id === targetId) {
      s.classList.add("active");
    } else {
      s.classList.remove("active");
    }
  });

  // Update dynamic top navbar title
  updateNavbarTitle(targetId);

  // Sync window hash for client-side routing and browser back/forward history
  if (window.location.hash !== "#" + targetId) {
    history.pushState(null, "", "#" + targetId);
  }

  // Close mobile sidebar overlay if open
  const sidebar = document.getElementById("dashboardSidebar");
  const overlay = document.getElementById("sidebarOverlay");
  if (sidebar) sidebar.classList.remove("active");
  if (overlay) overlay.classList.remove("active");

  const session = JSON.parse(localStorage.getItem("stackly_session"));

  // Trigger Chart.js and content re-renders when sections become visible
  setTimeout(() => {
    if (targetId === "overview" && session) {
      renderCustomerOverview(session);
      renderCustomerUsageCharts();
    }
    if (targetId === "myplans" && session) {
      renderCustomerPlansAndTransactions(session);
    }
    if (targetId === "usage") {
      renderCustomerUsageCharts();
    }
    if (targetId === "support" && session) {
      renderCustomerSupportTickets(session);
    }
    if (targetId === "adminOverview") {
      renderAdminOverview();
    }
    if (targetId === "adminCustomers") {
      renderAdminCustomers();
    }
    if (targetId === "adminRecharge") {
      renderAdminTransactions();
    }
    if (targetId === "adminPlans") {
      renderAdminPlansList();
    }
    if (targetId === "reports") {
      renderAdminReportsCharts();
    }
  }, 50);

  if (window.gsap) {
    try {
      gsap.killTweensOf(targetSection.children);
      gsap.fromTo(targetSection.children, 
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, stagger: 0.05, duration: 0.35, ease: "power2.out" }
      );
    } catch(err) {}
  }
}

function updateNavbarTitle(targetId) {
  const titleEl = document.getElementById("dashboardPageTitle") || document.querySelector(".page-title-dashboard");
  if (!titleEl) return;

  const activeLink = document.querySelector(`.sidebar-link[data-section="${targetId}"]`) || document.querySelector(`.sidebar-link[href="#${targetId}"]`);
  
  let pageName = "";
  if (activeLink) {
    const span = activeLink.querySelector("span");
    pageName = span ? span.innerText.trim() : activeLink.innerText.trim();
  }

  if (!pageName) {
    const titleMap = {
      overview: "Dashboard",
      recharge: "Recharge",
      myplans: "My Plans",
      usage: "Usage",
      support: "Support",
      adminOverview: "Dashboard",
      adminCustomers: "Customers",
      adminRecharge: "Recharge",
      adminPlans: "Plans",
      reports: "Reports",
      adminSystemHealth: "System Health",
      adminAuditLogs: "Audit Logs"
    };
    pageName = titleMap[targetId] || "Dashboard";
  }

  titleEl.innerText = pageName;
}
window.updateNavbarTitle = updateNavbarTitle;

function initDashboardRouter() {
  const links = document.querySelectorAll(".sidebar-link");

  links.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("data-section") || link.getAttribute("href")?.replace("#", "");
      if (targetId) {
        navigateToSection(targetId);
      }
    });
  });

  // Handle URL hash changes (e.g. browser back/forward buttons or hash links)
  window.addEventListener("hashchange", () => {
    const hash = window.location.hash.replace("#", "");
    if (hash && document.getElementById(hash)) {
      navigateToSection(hash);
    }
  });

  // Initial routing check on load
  const currentHash = window.location.hash.replace("#", "");
  if (currentHash && document.getElementById(currentHash)) {
    navigateToSection(currentHash);
  } else {
    const activeSec = document.querySelector(".dashboard-section.active")?.id || (document.querySelector('.sidebar-link[data-section="overview"]') ? "overview" : "adminOverview");
    updateNavbarTitle(activeSec);
  }
}

// Global window navigator for inline HTML onclick handlers
window.navigateToSection = navigateToSection;

// ==========================================================================
// CUSTOMER PORTAL ENGINE
// ==========================================================================
function initCustomerDashboard(user) {
  // Update overview tags
  updateCustomerHeaderInfo(user);
  renderCustomerOverview(user);
  renderCustomerPlansAndTransactions(user);
  renderCustomerUsageCharts();
  renderCustomerSupportTickets(user);
  bindCustomerRechargeForm(user);

  // Bind quick recharge once here to prevent duplicate event listeners on refresh
  const quickRechargeBtn = document.getElementById("quickRechargeOverviewBtn");
  if (quickRechargeBtn) {
    quickRechargeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      navigateToSection("recharge");
    });
  }
}

function initProfileDropdown() {
  const badge = document.getElementById("userProfileBadge");
  const menu = document.getElementById("profileDropdownMenu");

  if (badge && menu) {
    badge.addEventListener("click", (e) => {
      e.stopPropagation();
      badge.classList.toggle("active");
      menu.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && !badge.contains(e.target)) {
        badge.classList.remove("active");
        menu.classList.remove("show");
      }
    });
  }

  const logoutBtn = document.getElementById("dropdownLogoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("stackly_session");
      window.location.href = "login.html";
    });
  }
}

function updateCustomerHeaderInfo(user) {
  const users = JSON.parse(localStorage.getItem("stackly_users") || "[]");
  const liveUser = users.find(u => u.email === user.email) || user;

  const displayName = liveUser.name && liveUser.name !== "undefined" ? liveUser.name : (liveUser.email ? liveUser.email.split("@")[0] : "Customer");
  const displayEmail = liveUser.email || "user@stackly.com";
  const displayRole = liveUser.role ? (liveUser.role.charAt(0).toUpperCase() + liveUser.role.slice(1)) : "Customer";

  const nameSpan = document.getElementById("customerHeaderName");
  if (nameSpan) nameSpan.innerText = displayName;

  const headerUserName = document.getElementById("headerUserName");
  if (headerUserName) headerUserName.innerText = displayName;

  const headerUserEmail = document.getElementById("headerUserEmail");
  if (headerUserEmail) headerUserEmail.innerText = displayEmail;

  // Dropdown fields
  const dropdownUserName = document.getElementById("dropdownUserName");
  if (dropdownUserName) dropdownUserName.innerText = displayName;

  const dropdownUserEmail = document.getElementById("dropdownUserEmail");
  if (dropdownUserEmail) dropdownUserEmail.innerText = displayEmail;

  const dropdownUserRole = document.getElementById("dropdownUserRole");
  if (dropdownUserRole) dropdownUserRole.innerText = displayRole;
}

function renderCustomerOverview(user) {
  // Update overview stats
  const activePlanSpan = document.getElementById("ovPlanName");
  const balanceSpan = document.getElementById("ovBalance");

  // Fetch updated user from DB
  const users = JSON.parse(localStorage.getItem("stackly_users") || "[]");
  const liveUser = users.find(u => u.email === user.email) || user;

  if (activePlanSpan) activePlanSpan.innerText = liveUser.plan === "none" ? "No Active Plan" : liveUser.plan;
  if (balanceSpan) balanceSpan.innerText = `$${(liveUser.balance || 0).toFixed(2)}`;
}

function renderCustomerPlansAndTransactions(user) {
  const planInfoBox = document.getElementById("myPlanDetailsCard");
  const txnTableBody = document.getElementById("customerTxnTableBody");

  const users = JSON.parse(localStorage.getItem("stackly_users") || "[]");
  const liveUser = users.find(u => u.email === user.email) || user;

  // Active plan details card
  if (planInfoBox) {
    if (!liveUser.plan || liveUser.plan === "none") {
      planInfoBox.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 2.5rem; color: var(--primary-red); margin-bottom: 1rem;"></i>
          <h4>No Active Plan Registered</h4>
          <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom: 1.5rem;">Purchase a plan now to activate mobile or broadband connection speeds.</p>
          <a href="404.html" class="btn btn-primary"><i class="fa-solid fa-bolt"></i> Recharge Now</a>
        </div>
      `;
    } else {
      // Get plan details
      const plans = JSON.parse(localStorage.getItem("stackly_plans") || "[]");
      const activePlanObj = plans.find(p => p.name === liveUser.plan);

      planInfoBox.innerHTML = `
        <div class="my-plan-header">
          <div>
            <span class="status-badge success" style="margin-bottom:0.5rem; display:inline-block;">Active Subscription</span>
            <h3 style="font-size:1.5rem; word-break: break-word;">${liveUser.plan}</h3>
            <p style="color:var(--text-muted); font-size:0.85rem;">Account: ${liveUser.phone || "+1 (555) 019-2834"}</p>
          </div>
          <div class="my-plan-price-block">
            <div style="font-size:1.8rem; font-weight:800; color:var(--primary-red)">$${activePlanObj ? activePlanObj.price.toFixed(2) : "29.99"}</div>
            <div style="font-size:0.8rem; color:var(--text-muted)">Billing Cycle: ${activePlanObj ? activePlanObj.validity : "30 Days"}</div>
          </div>
        </div>
        <div class="plan-divider" style="margin-bottom:1.5rem"></div>
        <div class="my-plan-stats-grid">
          <div class="my-plan-stat-box">
            <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Data Quota</div>
            <div style="font-weight:700; font-size:1.05rem; color:var(--text-dark); margin-top:0.25rem;">${activePlanObj ? activePlanObj.data : "3 GB / Day + 5G"}</div>
          </div>
          <div class="my-plan-stat-box">
            <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Voice Calls</div>
            <div style="font-weight:700; font-size:1.05rem; color:var(--text-dark); margin-top:0.25rem;">${activePlanObj ? activePlanObj.calls : "Truly Unlimited"}</div>
          </div>
          <div class="my-plan-stat-box">
            <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Activated Date</div>
            <div style="font-weight:700; font-size:1.05rem; color:var(--text-dark); margin-top:0.25rem;">${liveUser.activeSince || "2026-07-01"}</div>
          </div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1.25rem; flex-wrap:wrap; gap:1rem;">
          <p style="font-size:0.8rem; color:var(--text-muted); margin:0;"><i class="fa-solid fa-circle-info" style="color:var(--primary-red)"></i> Note: Auto-renewal is enabled.</p>
          <a href="404.html" class="btn btn-primary btn-sm"><i class="fa-solid fa-bolt"></i> Recharge Now</a>
        </div>
      `;
    }
  }

  // Transactions logs table
  if (txnTableBody) {
    const allTxns = JSON.parse(localStorage.getItem("stackly_transactions") || "[]");
    const userTxns = allTxns.filter(t => t.email === liveUser.email);

    txnTableBody.innerHTML = "";
    if (userTxns.length === 0) {
      txnTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No transaction history found.</td></tr>`;
    } else {
      userTxns.forEach(t => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>${t.id}</strong></td>
          <td>${t.planName}</td>
          <td>${t.date}</td>
          <td>$${(t.amount || 0).toFixed(2)}</td>
          <td><span class="status-badge success">${t.status}</span></td>
        `;
        txnTableBody.appendChild(tr);
      });
    }
  }
}

function bindCustomerRechargeForm(user) {
  const form = document.getElementById("dbRechargeForm");
  const plansSelectorList = document.getElementById("dbQuickPlansList");

  if (!form || !plansSelectorList) return;

  const plans = JSON.parse(localStorage.getItem("stackly_plans") || "[]");
  const activePlans = plans.filter(p => p.status === "active");

  // Render plan selection cards
  plansSelectorList.innerHTML = "";
  activePlans.forEach((p, idx) => {
    const item = document.createElement("div");
    item.className = `quick-plan-item ${idx === 0 ? "selected" : ""}`;
    item.setAttribute("data-plan-id", p.id);
    item.setAttribute("data-plan-price", p.price);
    item.setAttribute("data-plan-name", p.name);
    item.innerHTML = `
      <div class="quick-plan-name">${p.name}</div>
      <div class="quick-plan-details">${p.data} | ${p.validity}</div>
      <div class="quick-plan-price">$${p.price.toFixed(2)}</div>
    `;

    item.addEventListener("click", () => {
      plansSelectorList.querySelectorAll(".quick-plan-item").forEach(i => i.classList.remove("selected"));
      item.classList.add("selected");
    });

    plansSelectorList.appendChild(item);
  });

  const phoneInputEl = document.getElementById("dbRechargePhone");
  if (phoneInputEl) {
    phoneInputEl.addEventListener("input", () => {
      let digits = phoneInputEl.value.replace(/\D/g, "").slice(0, 10);
      phoneInputEl.value = digits;
      const errorLabel = document.getElementById("dbRechargeError");
      const phoneGroup = document.getElementById("dbPhoneGroup");
      if (digits.length === 10) {
        if (errorLabel) errorLabel.style.display = "none";
        if (phoneGroup) phoneGroup.classList.remove("has-error");
      }
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const phoneVal = phoneInputEl ? phoneInputEl.value.trim() : "";
    const isPhoneValid = /^\d{10}$/.test(phoneVal.replace(/\D/g, ""));

    const errorLabel = document.getElementById("dbRechargeError");
    const phoneGroup = document.getElementById("dbPhoneGroup");

    if (!isPhoneValid) {
      if (errorLabel) {
        errorLabel.innerText = "Please enter your mobile number.";
        errorLabel.style.display = "block";
      }
      if (phoneGroup) {
        phoneGroup.classList.add("has-error");
      }
      if (phoneInputEl) phoneInputEl.focus();
      return;
    }

    if (errorLabel) errorLabel.style.display = "none";
    if (phoneGroup) phoneGroup.classList.remove("has-error");

    const payBtn = document.getElementById("dbRechargeSubmitBtn");
    if (payBtn) {
      payBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing Payment...`;
      payBtn.disabled = true;
    }

    setTimeout(() => {
      if (payBtn) {
        payBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> Complete Recharge`;
        payBtn.disabled = false;
      }
      window.location.href = "404.html";
    }, 500);
  });

  window.addEventListener("pageshow", () => {
    const payBtn = document.getElementById("dbRechargeSubmitBtn");
    if (payBtn) {
      payBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> Complete Recharge`;
      payBtn.disabled = false;
    }
  });
}

function renderCustomerUsageCharts() {
  if (typeof Chart === "undefined") {
    console.warn("Chart.js is not loaded.");
    return;
  }

  const barCanvas = document.getElementById("dbDataUsageChart");
  const barCanvasPage = document.getElementById("dbDataUsageChartPage");
  const lineCanvas = document.getElementById("dbVoiceUsageChart");

  if (barCanvas) {
    Chart.getChart(barCanvas)?.destroy();
    window.customerDataUsageChart = new Chart(barCanvas, {
      type: "bar",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{
          label: "Data Quota Used (GB)",
          data: [4.2, 5.8, 3.1, 4.9, 8.2, 10.5, 6.4],
          backgroundColor: "rgba(230, 0, 12, 0.85)",
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: "#F3F4F6" } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  if (barCanvasPage) {
    Chart.getChart(barCanvasPage)?.destroy();
    window.customerDataUsageChartPage = new Chart(barCanvasPage, {
      type: "bar",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{
          label: "Data Quota Used (GB)",
          data: [4.2, 5.8, 3.1, 4.9, 8.2, 10.5, 6.4],
          backgroundColor: "rgba(230, 0, 12, 0.85)",
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: "#F3F4F6" } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  if (lineCanvas) {
    Chart.getChart(lineCanvas)?.destroy();
    window.customerVoiceUsageChart = new Chart(lineCanvas, {
      type: "line",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{
          label: "Call Minutes",
          data: [45, 12, 60, 32, 28, 85, 40],
          borderColor: "rgba(230, 0, 12, 0.95)",
          backgroundColor: "rgba(230, 0, 12, 0.05)",
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: "#F3F4F6" } },
          x: { grid: { display: false } }
        }
      }
    });
  }
}

function renderCustomerSupportTickets(user) {
  const container = document.getElementById("dbCustomerTicketList");
  const form = document.getElementById("dbSupportForm");

  if (!container || !form) return;

  const getTickets = () => {
    let allTkts = JSON.parse(localStorage.getItem("stackly_tickets") || "[]");
    let userTkts = allTkts.filter(t => t.email.toLowerCase() === user.email.toLowerCase());

    if (userTkts.length === 0) {
      const defaultUserTkts = [
        {
          id: "TKT8891",
          email: user.email,
          subject: "5G Speed Verification & Route Optimization",
          category: "technical",
          message: "Requesting latency check for gaming server connection nodes.",
          status: "pending",
          date: new Date().toISOString().split("T")[0]
        },
        {
          id: "TKT8892",
          email: user.email,
          subject: "Recharge Confirmation & E-Bill Receipt",
          category: "billing",
          message: "Transaction $29.99 completed successfully. E-Receipt generated.",
          status: "resolved",
          date: "2026-07-10"
        }
      ];
      allTkts = [...defaultUserTkts, ...allTkts];
      localStorage.setItem("stackly_tickets", JSON.stringify(allTkts));
      userTkts = defaultUserTkts;
    }
    return userTkts;
  };

  const renderList = () => {
    const list = getTickets();
    container.innerHTML = "";

    if (list.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding: 2rem;">No support history recorded.</p>`;
      return;
    }

    list.forEach(t => {
      const badgeClass = t.status === "resolved" ? "success" : "pending";
      const div = document.createElement("div");
      div.className = "ticket-item";
      div.innerHTML = `
        <div class="ticket-header-db">
          <span class="ticket-id">${t.id}</span>
          <span class="status-badge ${badgeClass}">${t.status}</span>
        </div>
        <div class="ticket-subject">${t.subject}</div>
        <div class="ticket-msg">${t.message}</div>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.5rem; text-align:right;">Filed on: ${t.date}</div>
      `;
      container.appendChild(div);
    });
  };

    const subjectInput = document.getElementById("dbTktSubject");
    const categoryInput = document.getElementById("dbTktCategory");
    const msgInput = document.getElementById("dbTktMessage");

    const subjectGroup = document.getElementById("dbTktSubjectGroup");
    const categoryGroup = document.getElementById("dbTktCategoryGroup");
    const msgGroup = document.getElementById("dbTktMessageGroup");

    if (subjectInput) {
      subjectInput.addEventListener("input", () => {
        if (subjectInput.value.trim() && subjectGroup) subjectGroup.classList.remove("has-error");
      });
    }
    if (categoryInput) {
      categoryInput.addEventListener("change", () => {
        if (categoryInput.value && categoryGroup) categoryGroup.classList.remove("has-error");
      });
    }
    if (msgInput) {
      msgInput.addEventListener("input", () => {
        if (msgInput.value.trim() && msgGroup) msgGroup.classList.remove("has-error");
      });
    }

    form.onsubmit = (e) => {
      e.preventDefault();

      let isValid = true;
      let firstInvalid = null;

      const subject = subjectInput ? subjectInput.value.trim() : "";
      const category = categoryInput ? categoryInput.value : "";
      const msg = msgInput ? msgInput.value.trim() : "";

      if (!subject) {
        if (subjectGroup) subjectGroup.classList.add("has-error");
        isValid = false;
        if (!firstInvalid) firstInvalid = subjectInput;
      } else {
        if (subjectGroup) subjectGroup.classList.remove("has-error");
      }

      if (!category) {
        if (categoryGroup) categoryGroup.classList.add("has-error");
        isValid = false;
        if (!firstInvalid) firstInvalid = categoryInput;
      } else {
        if (categoryGroup) categoryGroup.classList.remove("has-error");
      }

      if (!msg) {
        if (msgGroup) msgGroup.classList.add("has-error");
        isValid = false;
        if (!firstInvalid) firstInvalid = msgInput;
      } else {
        if (msgGroup) msgGroup.classList.remove("has-error");
      }

      if (!isValid) {
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
          if (typeof firstInvalid.focus === "function") firstInvalid.focus();
        }
        return;
      }

      const submitBtn = document.getElementById("dbTktSubmitBtn");
      if (submitBtn) {
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Filing Ticket...`;
        submitBtn.disabled = true;
      }

      setTimeout(() => {
        window.location.href = "404.html";
      }, 500);
    };

    // initial load
    renderList();
  }


// ==========================================================================
// ADMIN PORTAL ENGINE
// ==========================================================================
function initAdminDashboard() {
  const session = JSON.parse(localStorage.getItem("stackly_session"));
  if (session) {
    const displayName = session.name && session.name !== "undefined" ? session.name : "System Administrator";
    const displayEmail = session.email || "admin@stackly.com";

    const headerUserName = document.getElementById("headerUserName");
    if (headerUserName) headerUserName.innerText = displayName;
    const headerUserEmail = document.getElementById("headerUserEmail");
    if (headerUserEmail) headerUserEmail.innerText = displayEmail;

    const dropdownUserName = document.getElementById("dropdownUserName");
    if (dropdownUserName) dropdownUserName.innerText = displayName;
    const dropdownUserEmail = document.getElementById("dropdownUserEmail");
    if (dropdownUserEmail) dropdownUserEmail.innerText = displayEmail;
    const dropdownUserRole = document.getElementById("dropdownUserRole");
    if (dropdownUserRole) dropdownUserRole.innerText = "Administrator";
  }

  renderAdminOverview();
  renderAdminCustomers();
  bindAdminCustomersSearch();
  renderAdminTransactions();
  renderAdminPlansList();
  renderAdminReportsCharts();
  bindAdminPlanCreation();
  bindAdminCustomerEdit();
}

function renderAdminOverview() {
  const users = JSON.parse(localStorage.getItem("stackly_users") || "[]");
  const customers = users.filter(u => u.role !== "admin");
  const transactions = JSON.parse(localStorage.getItem("stackly_transactions") || "[]");
  const tickets = JSON.parse(localStorage.getItem("stackly_tickets") || "[]");

  const totalRevenue = transactions.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const activeSubscribers = customers.filter(c => c.plan && c.plan !== "none").length;
  const pendingTickets = tickets.filter(t => t.status === "pending").length;

  const revEl = document.getElementById("adRevenue");
  const subEl = document.getElementById("adSubscribers");
  const actEl = document.getElementById("adActivePlans");
  const tktEl = document.getElementById("adTickets");

  if (revEl) revEl.innerText = `$${totalRevenue.toFixed(2)}`;
  if (subEl) subEl.innerText = customers.length;
  if (actEl) actEl.innerText = activeSubscribers;
  if (tktEl) tktEl.innerText = pendingTickets;

  if (typeof Chart !== "undefined") {
    const revCanvas = document.getElementById("adRevenueChart");
    if (revCanvas) {
      Chart.getChart(revCanvas)?.destroy();
      new Chart(revCanvas, {
        type: "line",
        data: {
          labels: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"],
          datasets: [{
            label: "Total Sales ($)",
            data: [120, 240, 390, 520, 780, totalRevenue || 950],
            borderColor: "rgba(230, 0, 12, 0.95)",
            backgroundColor: "rgba(230, 0, 12, 0.05)",
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }
  }
}

function renderAdminCustomers() {
  const container = document.getElementById("adCustomerTableBody");
  if (!container) return;

  const users = JSON.parse(localStorage.getItem("stackly_users") || "[]");
  const customers = users.filter(u => u.role !== "admin");

  container.innerHTML = "";
  if (customers.length === 0) {
    container.innerHTML = `<tr><td colspan="5" style="text-align:center;">No customers registered.</td></tr>`;
    return;
  }

  customers.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${c.name}</strong></td>
      <td>${c.email}</td>
      <td>${c.phone || "N/A"}</td>
      <td>${!c.plan || c.plan === "none" ? "None" : c.plan}</td>
      <td>
        <a href="404.html" class="btn btn-outline-red btn-sm" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; text-decoration: none; display: inline-block;">Edit Plan</a>
      </td>
    `;
    container.appendChild(tr);
  });
}

function bindAdminCustomersSearch() {
  const container = document.getElementById("adCustomerTableBody");
  const searchInput = document.getElementById("customerSearch");
  if (container && searchInput) {
    searchInput.addEventListener("input", (e) => {
      const val = e.target.value.toLowerCase().trim();
      const trs = container.querySelectorAll("tr");
      trs.forEach(tr => {
        const text = tr.innerText.toLowerCase();
        tr.style.display = text.includes(val) ? "" : "none";
      });
    });
  }
}

// Global modal triggers for Admin Customer modifications
window.openEditCustomerModal = function(email, name, currentPlan) {
  window.location.href = "404.html";
};

window.closeEditCustomerModal = function() {
  const modal = document.getElementById("editCustomerModal");
  if (modal) modal.style.display = "none";
};

function bindAdminCustomerEdit() {
  const form = document.getElementById("editCustomerForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("editCustEmail").value;
    const selectedPlan = document.getElementById("editCustPlan").value;

    const users = JSON.parse(localStorage.getItem("stackly_users") || "[]");
    const updated = users.map(u => {
      if (u.email === email) {
        u.plan = selectedPlan;
      }
      return u;
    });

    localStorage.setItem("stackly_users", JSON.stringify(updated));
    
    alert("Customer plan updated successfully!");
    closeEditCustomerModal();
    renderAdminCustomers();
    renderAdminOverview();
  });
}

function renderAdminTransactions() {
  const container = document.getElementById("adTxnTableBody");
  if (!container) return;

  const txns = JSON.parse(localStorage.getItem("stackly_transactions") || "[]");
  container.innerHTML = "";

  if (txns.length === 0) {
    container.innerHTML = `<tr><td colspan="6" style="text-align:center;">No recharges recorded.</td></tr>`;
    return;
  }

  txns.forEach(t => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${t.id}</strong></td>
      <td>${t.email}</td>
      <td>${t.planName}</td>
      <td>$${(t.amount || 0).toFixed(2)}</td>
      <td>${t.date}</td>
      <td><span class="status-badge success">${t.status}</span></td>
    `;
    container.appendChild(tr);
  });
}

function renderAdminPlansList() {
  const container = document.getElementById("adPlansGrid");
  if (!container) return;

  const plans = JSON.parse(localStorage.getItem("stackly_plans") || "[]");
  container.innerHTML = "";

  plans.forEach(p => {
    const card = document.createElement("div");
    card.className = "admin-plan-card";
    
    const badgeMarkup = p.status === "active" ? `<span class="status-badge success">Active</span>` : `<span class="status-badge failed">Inactive</span>`;
    
    card.innerHTML = `
      <div class="admin-plan-card-body">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem">
          <span style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-muted);">${p.type} plan</span>
          ${badgeMarkup}
        </div>
        <h3>${p.name}</h3>
        <div class="admin-plan-meta">Data: ${p.data} | Validity: ${p.validity}</div>
        <div class="admin-plan-price">$${(p.price || 0).toFixed(2)}</div>
      </div>
      <div class="admin-plan-actions">
        <a href="404.html" class="btn btn-outline-red" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center; width:100%;">
          Activate
        </a>
      </div>
    `;
    container.appendChild(card);
  });
}

window.togglePlanStatus = function(planId) {
  window.location.href = "404.html";
};

// Global click handler for Activate and Edit Plan buttons
document.addEventListener("click", (e) => {
  const btn = e.target.closest("button, a, .btn");
  if (btn) {
    const txt = btn.textContent.trim().toLowerCase();
    if (txt === "activate" || txt === "edit plan" || txt === "edit") {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = "404.html";
    }
  }
}, true);

function bindAdminPlanCreation() {
  const form = document.getElementById("adCreatePlanForm");
  if (!form) return;

  const nameInput = document.getElementById("adPlanName");
  const priceInput = document.getElementById("adPlanPrice");
  const typeSelect = document.getElementById("adPlanType");
  const dataInput = document.getElementById("adPlanData");
  const callsInput = document.getElementById("adPlanCalls");
  const valInput = document.getElementById("adPlanValidity");

  const nameGrp = document.getElementById("adPlanNameGroup");
  const priceGrp = document.getElementById("adPlanPriceGroup");
  const typeGrp = document.getElementById("adPlanTypeGroup");
  const dataGrp = document.getElementById("adPlanDataGroup");
  const callsGrp = document.getElementById("adPlanCallsGroup");
  const valGrp = document.getElementById("adPlanValidityGroup");

  if (nameInput) nameInput.addEventListener("input", () => { if (nameInput.value.trim() && nameGrp) nameGrp.classList.remove("has-error"); });
  if (priceInput) priceInput.addEventListener("input", () => { if (priceInput.value.trim() && priceGrp) priceGrp.classList.remove("has-error"); });
  if (typeSelect) typeSelect.addEventListener("change", () => { if (typeSelect.value && typeGrp) typeGrp.classList.remove("has-error"); });
  if (dataInput) dataInput.addEventListener("input", () => { if (dataInput.value.trim() && dataGrp) dataGrp.classList.remove("has-error"); });
  if (callsInput) callsInput.addEventListener("input", () => { if (callsInput.value.trim() && callsGrp) callsGrp.classList.remove("has-error"); });
  if (valInput) valInput.addEventListener("input", () => { if (valInput.value.trim() && valGrp) valGrp.classList.remove("has-error"); });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let isValid = true;
    let firstInvalid = null;

    const name = nameInput ? nameInput.value.trim() : "";
    const priceVal = priceInput ? priceInput.value.trim() : "";
    const price = parseFloat(priceVal);
    const type = typeSelect ? typeSelect.value : "";
    const data = dataInput ? dataInput.value.trim() : "";
    const calls = callsInput ? callsInput.value.trim() : "";
    const validity = valInput ? valInput.value.trim() : "";

    if (!name) {
      if (nameGrp) nameGrp.classList.add("has-error");
      isValid = false;
      if (!firstInvalid) firstInvalid = nameInput;
    } else {
      if (nameGrp) nameGrp.classList.remove("has-error");
    }

    if (!priceVal || isNaN(price) || price <= 0) {
      if (priceGrp) priceGrp.classList.add("has-error");
      isValid = false;
      if (!firstInvalid) firstInvalid = priceInput;
    } else {
      if (priceGrp) priceGrp.classList.remove("has-error");
    }

    if (!type) {
      if (typeGrp) typeGrp.classList.add("has-error");
      isValid = false;
      if (!firstInvalid) firstInvalid = typeSelect;
    } else {
      if (typeGrp) typeGrp.classList.remove("has-error");
    }

    if (!data) {
      if (dataGrp) dataGrp.classList.add("has-error");
      isValid = false;
      if (!firstInvalid) firstInvalid = dataInput;
    } else {
      if (dataGrp) dataGrp.classList.remove("has-error");
    }

    if (!calls) {
      if (callsGrp) callsGrp.classList.add("has-error");
      isValid = false;
      if (!firstInvalid) firstInvalid = callsInput;
    } else {
      if (callsGrp) callsGrp.classList.remove("has-error");
    }

    if (!validity) {
      if (valGrp) valGrp.classList.add("has-error");
      isValid = false;
      if (!firstInvalid) firstInvalid = valInput;
    } else {
      if (valGrp) valGrp.classList.remove("has-error");
    }

    if (!isValid) {
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
        if (typeof firstInvalid.focus === "function") firstInvalid.focus();
      }
      return;
    }

    const submitBtn = document.getElementById("adPlanSubmitBtn");
    if (submitBtn) {
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Creating Plan...`;
      submitBtn.disabled = true;
    }

    setTimeout(() => {
      window.location.href = "404.html";
    }, 500);
  });
}

function renderAdminReportsCharts() {
  if (typeof Chart === "undefined") {
    console.warn("Chart.js is not loaded.");
    return;
  }

  const popCanvas = document.getElementById("adPopularityChart");
  const statusCanvas = document.getElementById("adTicketStatusChart");

  if (!popCanvas || !statusCanvas) return;

  Chart.getChart(popCanvas)?.destroy();
  Chart.getChart(statusCanvas)?.destroy();

  const plansList = JSON.parse(localStorage.getItem("stackly_plans") || "[]");
  const mobileCount = plansList.filter(p => p.type === "mobile").length;
  const broadbandCount = plansList.filter(p => p.type === "broadband").length;

  window.adminPopularityChart = new Chart(popCanvas, {
    type: "pie",
    data: {
      labels: ["Mobile Prepaid/Postpaid", "Fiber Broadband"],
      datasets: [{
        data: [mobileCount || 3, broadbandCount || 2],
        backgroundColor: [
          "rgba(230, 0, 12, 0.85)",
          "rgba(31, 41, 55, 0.85)"
        ],
        borderWidth: 2,
        borderColor: "#FFFFFF"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  const tickets = JSON.parse(localStorage.getItem("stackly_tickets") || "[]");
  const pendingCount = tickets.filter(t => t.status === "pending").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved").length;

  new Chart(statusCanvas, {
    type: "doughnut",
    data: {
      labels: ["Resolved Support Tickets", "Open / Pending Tickets"],
      datasets: [{
        data: [resolvedCount || 5, pendingCount || 2],
        backgroundColor: [
          "#2ecc71",
          "rgba(230, 0, 12, 0.85)"
        ],
        borderWidth: 2,
        borderColor: "#FFFFFF"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// --- Custom Dropdowns Transformation Engine ---
function initCustomDropdowns() {
  const selects = document.querySelectorAll("select");

  selects.forEach(select => {
    if (select.dataset.customSelect === "true") return;
    if (select.id === "planSelector" && select.style.display === "none") return;

    select.dataset.customSelect = "true";
    select.classList.add("custom-select-hidden");
    select.style.display = "none";

    const wrapper = document.createElement("div");
    wrapper.className = "custom-select-container";
    if (select.id) wrapper.setAttribute("data-for", select.id);

    const trigger = document.createElement("div");
    trigger.className = "custom-select-trigger";
    trigger.setAttribute("tabindex", "0");
    trigger.setAttribute("role", "combobox");
    trigger.setAttribute("aria-expanded", "false");

    const getSelectedOptionText = () => {
      const selectedOpt = select.options[select.selectedIndex];
      return selectedOpt ? selectedOpt.textContent : (select.options[0] ? select.options[0].textContent : "");
    };

    trigger.innerHTML = `
      <span class="selected-text">${getSelectedOptionText()}</span>
      <i class="fa-solid fa-chevron-down chevron-icon"></i>
    `;
    wrapper.appendChild(trigger);

    const optionsContainer = document.createElement("div");
    optionsContainer.className = "custom-select-options";
    optionsContainer.setAttribute("role", "listbox");

    const renderOptions = () => {
      optionsContainer.innerHTML = "";
      Array.from(select.options).forEach((opt) => {
        const isSelected = opt.selected || opt.value === select.value;
        const optionEl = document.createElement("div");
        optionEl.className = `custom-option ${isSelected ? "selected" : ""}`;
        optionEl.setAttribute("data-value", opt.value);
        optionEl.setAttribute("role", "option");
        optionEl.setAttribute("aria-selected", isSelected ? "true" : "false");
        optionEl.innerHTML = `
          <span>${opt.textContent}</span>
          <i class="fa-solid fa-check option-check"></i>
        `;

        optionEl.addEventListener("click", (e) => {
          e.stopPropagation();
          if (select.value !== opt.value) {
            select.value = opt.value;
            select.dispatchEvent(new Event("change", { bubbles: true }));
            select.dispatchEvent(new Event("input", { bubbles: true }));
          }
          syncDisplay();
          closeDropdown();
        });

        optionsContainer.appendChild(optionEl);
      });
    };

    const syncDisplay = () => {
      trigger.querySelector(".selected-text").textContent = getSelectedOptionText();
      const currentVal = select.value;
      optionsContainer.querySelectorAll(".custom-option").forEach(el => {
        const match = el.getAttribute("data-value") === currentVal;
        el.classList.toggle("selected", match);
        el.setAttribute("aria-selected", match ? "true" : "false");
      });
    };

    const openDropdown = () => {
      document.querySelectorAll(".custom-select-container.open").forEach(other => {
        if (other !== wrapper) {
          other.classList.remove("open");
          const trg = other.querySelector(".custom-select-trigger");
          if (trg) trg.setAttribute("aria-expanded", "false");
        }
      });
      wrapper.classList.add("open");
      trigger.setAttribute("aria-expanded", "true");
    };

    const closeDropdown = () => {
      wrapper.classList.remove("open");
      trigger.setAttribute("aria-expanded", "false");
    };

    renderOptions();
    wrapper.appendChild(optionsContainer);

    if (select.parentNode) {
      select.parentNode.insertBefore(wrapper, select);
    }

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      if (wrapper.classList.contains("open")) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        trigger.click();
      } else if (e.key === "Escape") {
        closeDropdown();
      }
    });

    select.addEventListener("change", syncDisplay);

    const observer = new MutationObserver(() => {
      renderOptions();
      syncDisplay();
    });
    observer.observe(select, { childList: true, subtree: true });
  });
}
