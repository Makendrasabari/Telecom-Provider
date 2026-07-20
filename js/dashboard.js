/* ==========================================================================
   STACKLY TELECOM - DASHBOARD ENGINE & INTERACTIVE CONTROLS
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const session = JSON.parse(localStorage.getItem("stackly_session"));
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  // Double check roles to prevent dashboard crossovers
  const isCustomerPage = window.location.pathname.includes("customer-dashboard.html");
  const isAdminPage = window.location.pathname.includes("admin-dashboard.html");

  if (isCustomerPage && session.role !== "customer") {
    window.location.href = "login.html";
    return;
  }
  if (isAdminPage && session.role !== "admin") {
    window.location.href = "login.html";
    return;
  }

  initSidebarControls();
  initDashboardRouter();
  initProfileDropdown();

  // If customer page, load customer dashboard logic
  if (isCustomerPage) {
    initCustomerDashboard(session);
  }
  
  // If admin page, load admin dashboard logic
  if (isAdminPage) {
    initAdminDashboard();
  }
});

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
}

// --- Tab Swapper & Section Router ---
function initDashboardRouter() {
  const links = document.querySelectorAll(".sidebar-link");
  const sections = document.querySelectorAll(".dashboard-section");

  links.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      
      // Prevent double trigger on active tab
      if (link.classList.contains("active")) return;
      
      const targetId = link.getAttribute("data-section");
      
      // Remove active classes
      links.forEach(l => l.classList.remove("active"));
      sections.forEach(s => s.classList.remove("active"));

      // Set active
      link.classList.add("active");
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.classList.add("active");
        
        const session = JSON.parse(localStorage.getItem("stackly_session"));

        // Trigger Chart.js and content re-renders when sections become visible
        setTimeout(() => {
          if (targetId === "overview") {
            renderCustomerUsageCharts();
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
          if (targetId === "reports") {
            renderAdminReportsCharts();
          }
        }, 50);

        // Kill active animations on section children to prevent overlapping conflicts
        gsap.killTweensOf(targetSection.children);

        // GSAP animate section slide-in
        gsap.from(targetSection.children, {
          opacity: 0,
          y: 20,
          stagger: 0.08,
          duration: 0.4,
          ease: "power2.out"
        });
      }
    });
  });

  // Initial GSAP animation for the active overview dashboard section
  const activeSec = document.querySelector(".dashboard-section.active");
  if (activeSec) {
    gsap.from(activeSec.children, {
      opacity: 0,
      y: 25,
      stagger: 0.1,
      duration: 0.5,
      ease: "power2.out"
    });
  }
}

// ==========================================================================================
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
      // Route to recharge tab
      const rechargeLink = document.querySelector('[data-section="recharge"]');
      if (rechargeLink) rechargeLink.click();
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
  if (balanceSpan) balanceSpan.innerText = `$${liveUser.balance.toFixed(2)}`;
}

function renderCustomerPlansAndTransactions(user) {
  const planInfoBox = document.getElementById("myPlanDetailsCard");
  const txnTableBody = document.getElementById("customerTxnTableBody");

  const users = JSON.parse(localStorage.getItem("stackly_users") || "[]");
  const liveUser = users.find(u => u.email === user.email) || user;

  // Active plan details card
  if (planInfoBox) {
    if (liveUser.plan === "none") {
      planInfoBox.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 2.5rem; color: var(--primary-red); margin-bottom: 1rem;"></i>
          <h4>No Active Plan Registered</h4>
          <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom: 1.5rem;">Purchase a plan now to activate mobile or broadband connection speeds.</p>
          <button class="btn btn-primary" onclick="window.location.href='404.html';">Recharge Now</button>
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
            <p style="color:var(--text-muted); font-size:0.85rem;">Account: ${liveUser.phone}</p>
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
        <p style="font-size:0.8rem; color:var(--text-muted);"><i class="fa-solid fa-circle-info" style="color:var(--primary-red)"></i> Note: Auto-renewal is enabled. Make sure your account balance satisfies the plan cost before the cycle resets.</p>
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
          <td>$${t.amount.toFixed(2)}</td>
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

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const selectedItem = plansSelectorList.querySelector(".quick-plan-item.selected");
    if (!selectedItem) return;

    const planId = selectedItem.getAttribute("data-plan-id");
    const planPrice = parseFloat(selectedItem.getAttribute("data-plan-price"));
    const planName = selectedItem.getAttribute("data-plan-name");

    const phoneInput = document.getElementById("dbRechargePhone").value.trim();
    const phoneGroup = phoneInput.length >= 10;

    const errorLabel = document.getElementById("dbRechargeError");
    if (!phoneGroup) {
      errorLabel.innerText = "Please enter a valid 10-digit number.";
      errorLabel.style.display = "block";
      return;
    }
    errorLabel.style.display = "none";

    const payBtn = document.getElementById("dbRechargeSubmitBtn");
    payBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting Payment...`;
    payBtn.disabled = true;

    setTimeout(() => {
      payBtn.innerHTML = "Recharge Now";
      payBtn.disabled = false;
      window.location.href = "404.html";
    }, 600);

      // Refresh Overview, My Plans, etc.
      renderCustomerOverview(user);
      renderCustomerPlansAndTransactions(user);

      // Route back to overview tab
      document.querySelector('[data-section="overview"]').click();

    }, 1200);
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
        plugins: {
          legend: { display: false }
        },
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
        plugins: {
          legend: { display: false }
        },
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
        plugins: {
          legend: { display: false }
        },
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

    // If user has no tickets yet, populate default tickets so history is never empty
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

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const subject = document.getElementById("dbTktSubject").value.trim();
    const category = document.getElementById("dbTktCategory").value;
    const msg = document.getElementById("dbTktMessage").value.trim();

    if (!subject || !msg) {
      alert("Please fill out all fields.");
      return;
    }

    window.location.href = "404.html";
  });

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

  // Metrics calculation
  const totalRevenue = transactions.reduce((acc, curr) => acc + curr.amount, 0);
  const activeSubscribers = customers.filter(c => c.plan !== "none").length;
  const pendingTickets = tickets.filter(t => t.status === "pending").length;

  document.getElementById("adRevenue").innerText = `$${totalRevenue.toFixed(2)}`;
  document.getElementById("adSubscribers").innerText = customers.length;
  document.getElementById("adActivePlans").innerText = activeSubscribers;
  document.getElementById("adTickets").innerText = pendingTickets;

  // Overview Revenue Growth Chart
  if (typeof Chart !== "undefined") {
    const revCanvas = document.getElementById("adRevenueChart");
    if (revCanvas) {
      // Destroy prior instances
      Chart.getChart(revCanvas)?.destroy();
      
      new Chart(revCanvas, {
        type: "line",
        data: {
          labels: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"],
          datasets: [{
            label: "Total Sales ($)",
            data: [120, 240, 390, 520, 780, totalRevenue],
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
      <td>${c.phone}</td>
      <td>${c.plan === "none" ? "None" : c.plan}</td>
      <td>
        <button class="btn btn-outline-red btn-sm" onclick="openEditCustomerModal('${c.email}', '${c.name}', '${c.plan}')" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;">Edit Plan</button>
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
        if (text.includes(val)) {
          tr.style.display = "";
        } else {
          tr.style.display = "none";
        }
      });
    });
  }
}

// Global modal triggers for Admin Customer modifications
window.openEditCustomerModal = function(email, name, currentPlan) {
  window.location.href = "404.html";
};
  
  // Load plans into dropdown selector
  const planSelect = document.getElementById("editCustPlan");
  const plans = JSON.parse(localStorage.getItem("stackly_plans") || "[]");
  planSelect.innerHTML = `<option value="none">No Active Plan</option>`;
  plans.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.name;
    opt.innerText = `${p.name} (${p.type})`;
    planSelect.appendChild(opt);
  });
  
  planSelect.value = currentPlan;

  modal.style.display = "flex";
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
    
    // Alert and reload
    alert("Customer details updated successfully!");
    closeEditCustomerModal();
    renderAdminCustomers();
    renderAdminOverview(); // update metrics
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
      <td>$${t.amount.toFixed(2)}</td>
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
    
    const isMobile = p.type === "mobile";
    const badgeMarkup = p.status === "active" ? `<span class="status-badge success">Active</span>` : `<span class="status-badge failed">Inactive</span>`;
    
    card.innerHTML = `
      <div class="admin-plan-card-body">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem">
          <span style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-muted);">${p.type} plan</span>
          ${badgeMarkup}
        </div>
        <h3>${p.name}</h3>
        <div class="admin-plan-meta">Data: ${p.data} | Validity: ${p.validity}</div>
        <div class="admin-plan-price">$${p.price.toFixed(2)}</div>
      </div>
      <div class="admin-plan-actions">
        <button class="btn ${p.status === 'active' ? 'btn-secondary' : 'btn-outline-red'}" onclick="togglePlanStatus('${p.id}')">
          ${p.status === 'active' ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

window.togglePlanStatus = function(planId) {
  window.location.href = "404.html";
};

function bindAdminPlanCreation() {
  const form = document.getElementById("adCreatePlanForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("adPlanName").value.trim();
    const price = parseFloat(document.getElementById("adPlanPrice").value);
    const data = document.getElementById("adPlanData").value.trim();
    const calls = document.getElementById("adPlanCalls").value.trim();
    const validity = document.getElementById("adPlanValidity").value.trim();
    const type = document.getElementById("adPlanType").value;

    if (!name || !data || !calls || !validity || isNaN(price)) {
      alert("Please fill all plan creation fields.");
      return;
    }

    const plans = JSON.parse(localStorage.getItem("stackly_plans") || "[]");
    const newPlan = {
      id: "p" + (plans.length + 1),
      name: name,
      price: price,
      data: data,
      calls: calls,
      validity: validity,
      type: type,
      status: "active"
    };

    plans.push(newPlan);
    localStorage.setItem("stackly_plans", JSON.stringify(plans));

    form.reset();
    window.location.href = "404.html";
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

  // Destruct prior chart instances if hot reloading
  Chart.getChart(popCanvas)?.destroy();
  Chart.getChart(statusCanvas)?.destroy();

  // Load live counts for popularity breakdown
  const plansList = JSON.parse(localStorage.getItem("stackly_plans") || "[]");
  const mobileCount = plansList.filter(p => p.type === "mobile").length;
  const broadbandCount = plansList.filter(p => p.type === "broadband").length;

  window.adminPopularityChart = new Chart(popCanvas, {
    type: "pie",
    data: {
      labels: ["Mobile Prepaid/Postpaid", "Fiber Broadband"],
      datasets: [{
        data: [mobileCount, broadbandCount],
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

  // Load ticket status counts
  const tickets = JSON.parse(localStorage.getItem("stackly_tickets") || "[]");
  const pendingCount = tickets.filter(t => t.status === "pending").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved").length;

  new Chart(statusCanvas, {
    type: "doughnut",
    data: {
      labels: ["Resolved Support Tickets", "Open / Pending Tickets"],
      datasets: [{
        data: [resolvedCount, pendingCount],
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
