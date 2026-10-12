document.addEventListener("DOMContentLoaded", () => {
  // --- Application State ---
  const state = {
    hospitals: { page: 1, limit: 10, total: 0, search: "", loaded: false },
    admins: { page: 1, limit: 10, total: 0, search: "", loaded: false },
    contactus: { page: 1, limit: 10, total: 0, search: "", loaded: false },
  };

  const loadGlobalStats = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      // Fetch Hospitals Count (asking for limit=1 makes it lightweight)
      const hospRes = await fetch("/api/v1/hospital/list?page=1&limit=1", {
        cache: "no-store",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (hospRes.ok) {
        const hospData = await hospRes.json();
        document.getElementById("stat-hospitals").textContent =
          hospData.data.total;
      }

      // Fetch Admins Count
      const adminRes = await fetch("/api/v1/super-admin/list?page=1&limit=1", {
        cache: "no-store",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (adminRes.ok) {
        const adminData = await adminRes.json();
        document.getElementById("stat-admins").textContent =
          adminData.data.total;
      }
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    }
  };
  loadGlobalStats();
  // --- Initialize Dashboard Stats ---
  document.getElementById("stat-hospitals").textContent = state.hospitals.total;
  document.getElementById("stat-admins").textContent = state.admins.total;

  // --- Fetch Logic (Real API for Hospitals and Admins) ---
  const fetchData = async (type, page, limit, search) => {
    try {
      const queryParams = new URLSearchParams({ page, limit });
      if (search) queryParams.append("search", search);

      let url = `/api/v1/hospital/list?${queryParams.toString()}`;

      if (type === "admins") {
        url = `/api/v1/super-admin/list?${queryParams.toString()}`;
      } else if (type === "contactus") {
        url = `/api/v1/contactus?${queryParams.toString()}`;
      }

      const token = localStorage.getItem("accessToken");
      const response = await fetch(url, {
        cache: "no-store", // Forces the browser to fetch fresh data every time
        headers: {
          Pragma: "no-cache",
          "Cache-Control": "no-cache",
          "Authorization": `Bearer ${token}`
        },
      });
      if (!response.ok) throw new Error(`Failed to fetch ${type}`);

      const result = await response.json();
      if (result.statusCode >= 400)
        throw new Error(result.message || "Error fetching data");

      return {
        data: result.data?.data || result.data || [], // Some APIs return directly data array, others nested
        total: result.data?.total || result.data?.length || 0,
        page: result.data?.page || page,
        limit: result.data?.limit || limit,
      };
    } catch (err) {
      throw err;
    }
  };

  // --- Render Tables ---
  const renderTable = async (type) => {
    const tbody = document.getElementById(`${type}-tbody`);
    tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-sm text-gray-500"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Loading data...</td></tr>`;

    try {
      const res = await fetchData(
        type,
        state[type].page,
        state[type].limit,
        state[type].search,
      );

      tbody.innerHTML = "";
      res.data.forEach((item) => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-50 transition-colors";

        if (type === "hospitals") {
          const statusClass =
            item.status === "Active"
              ? "bg-green-100 text-green-800"
              : item.status === "Pending"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800";
          tr.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.name}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.location}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${item.status}</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <a href="/hospital/view-hospital/${item.id}" class="text-blue-600 hover:text-blue-900 transition-colors mr-3"><i class="fa-solid fa-eye"></i> View</a>
                            <a href="/hospital/edit-hospital/${item.id}" class="text-primary hover:text-primary-dark transition-colors mr-3"><i class="fa-solid fa-pen"></i> Edit</a>
                        </td>
                    `;
        } else if (type === "admins") {
          const statusClass =
            item.status === "Active"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800";
          tr.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.name}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.email}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.role}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${item.status}</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <a href="/super-admin/view-admin/${item.id}" class="text-blue-600 hover:text-blue-900 transition-colors mr-3"><i class="fa-solid fa-eye"></i> View</a>
                            <a href="/super-admin/edit-admin/${item.id}" class="text-primary hover:text-primary-dark transition-colors mr-3"><i class="fa-solid fa-pen"></i> Edit</a>
                        </td>
                    `;
        } else if (type === "contactus") {
          const statusClass =
            item.status === "unread"
              ? "bg-red-100 text-red-800"
              : item.status === "resolved"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800";
          const date = new Date(item.created_at).toLocaleDateString();
          tr.innerHTML = `
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${date}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.first_name} ${item.last_name}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.email}</td>
                        <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title="${item.message}">${item.message}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass} cursor-pointer" onclick="toggleContactStatus(${item.id}, '${item.status}')" title="Click to toggle status">${item.status}</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button onclick="openReplyModal(${item.id})" class="text-blue-600 hover:text-blue-900 transition-colors mr-3"><i class="fa-solid fa-reply"></i> Reply</button>
                            <button onclick="deleteContactMessage(${item.id})" class="text-red-600 hover:text-red-900 transition-colors"><i class="fa-solid fa-trash"></i> Delete</button>
                        </td>
                    `;
        }
        tbody.appendChild(tr);
      });

      updatePagination(type, res.total);

      // Update top stats if needed
      //   if (type === "hospitals") {
      //     document.getElementById("stat-hospitals").textContent = res.total;
      //     state.hospitals.total = res.total;
      //   } else if (type === "admins") {
      //     document.getElementById("stat-admins").textContent = res.total;
      //     state.admins.total = res.total;
      //   }


      if (!state[type].loaded) {
        state[type].loaded = true;
      }
    } catch (error) {
      console.error(error);
      // window.showFlash(`Failed to fetch ${type} data. Please try again.`, "error");
      tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-sm text-red-500"><i class="fa-solid fa-triangle-exclamation mr-2"></i> Error loading data.</td></tr>`;
    }
  };

  // Global action handler for mock buttons
  window.handleAction = (actionName) => {
    window.showFlash(`${actionName} action executed successfully.`, "success");
  };

  window.toggleContactStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'unread' ? 'read' : currentStatus === 'read' ? 'resolved' : 'unread';
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`/api/v1/contactus/${id}/status`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        window.showFlash(`Status updated to ${newStatus}`, "success");
        renderTable("contactus");
      } else {
        window.showFlash("Failed to update status", "error");
      }
    } catch (err) {
      window.showFlash("Error updating status", "error");
    }
  };

  window.deleteContactMessage = async (id) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`/api/v1/contactus/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        window.showFlash("Message deleted successfully", "success");
        renderTable("contactus");
      } else {
        window.showFlash("Failed to delete message", "error");
      }
    } catch (err) {
      window.showFlash("Error deleting message", "error");
    }
  };

  window.openReplyModal = (id) => {
    document.getElementById("replyMessageId").value = id;
    document.getElementById("replyText").value = "";
    document.getElementById("replyModal").classList.remove("hidden");
  };

  window.closeReplyModal = () => {
    document.getElementById("replyModal").classList.add("hidden");
  };

  window.submitReply = async () => {
    const id = document.getElementById("replyMessageId").value;
    const text = document.getElementById("replyText").value;
    if (!text.trim()) return;

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`/api/v1/contactus/${id}/reply`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reply_text: text })
      });
      if (res.ok) {
        window.showFlash("Reply saved successfully. Status marked as resolved.", "success");
        closeReplyModal();
        renderTable("contactus");
      } else {
        window.showFlash("Failed to save reply", "error");
      }
    } catch (err) {
      window.showFlash("Error saving reply", "error");
    }
  };

  // --- Render Pagination ---
  const updatePagination = (type, total) => {
    const page = state[type].page;
    const limit = state[type].limit;
    const totalPages = Math.ceil(total / limit);

    let prefix = type === "hospitals" ? "hosp" : type === "admins" ? "adm" : "contact";
    document.getElementById(`${prefix}-start`).textContent =
      total === 0 ? 0 : (page - 1) * limit + 1;
    document.getElementById(`${prefix}-end`).textContent = Math.min(
      page * limit,
      total,
    );
    document.getElementById(`${prefix}-total`).textContent = total;

    const nav = document.getElementById(`${type}-pagination`);
    nav.innerHTML = "";

    if (totalPages <= 1) return; // No need for pagination if 1 or 0 pages

    // Prev Button
    const prevBtn = document.createElement("button");
    prevBtn.className = `relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${page === 1 ? "opacity-50 cursor-not-allowed" : ""}`;
    prevBtn.innerHTML = `<span class="sr-only">Previous</span><i class="fa-solid fa-chevron-left w-4 h-4"></i>`;
    prevBtn.disabled = page === 1;
    prevBtn.onclick = () => {
      if (state[type].page > 1) {
        state[type].page--;
        renderTable(type);
      }
    };
    nav.appendChild(prevBtn);

    // Page Numbers Logic
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        const btn = document.createElement("button");
        if (i === page) {
          btn.className =
            "relative z-10 inline-flex items-center bg-primary px-3 py-1.5 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
        } else {
          btn.className =
            "relative inline-flex items-center px-3 py-1.5 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0";
        }
        btn.textContent = i;
        btn.onclick = () => {
          if (state[type].page !== i) {
            state[type].page = i;
            renderTable(type);
          }
        };
        nav.appendChild(btn);
      } else if (i === page - 2 || i === page + 2) {
        const span = document.createElement("span");
        span.className =
          "relative inline-flex items-center px-3 py-1.5 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0";
        span.textContent = "...";
        nav.appendChild(span);
      }
    }

    // Next Button
    const nextBtn = document.createElement("button");
    nextBtn.className = `relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${page === totalPages ? "opacity-50 cursor-not-allowed" : ""}`;
    nextBtn.innerHTML = `<span class="sr-only">Next</span><i class="fa-solid fa-chevron-right w-4 h-4"></i>`;
    nextBtn.disabled = page === totalPages;
    nextBtn.onclick = () => {
      if (state[type].page < totalPages) {
        state[type].page++;
        renderTable(type);
      }
    };
    nav.appendChild(nextBtn);
  };

  //! --- Tab Switching Logic ---
  const tabs = document.querySelectorAll(".tab-btn");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;

      //* Update active styling
      tabs.forEach((t) => {
        t.classList.remove("border-primary", "text-primary");
        t.classList.add("border-transparent", "text-gray-500");
      });
      tab.classList.remove("border-transparent", "text-gray-500");
      tab.classList.add("border-primary", "text-primary");

      //* Show target content
      contents.forEach((c) => {
        c.classList.add("hidden");
        c.classList.remove("block");
      });
      document.getElementById(`${target}-tab`).classList.remove("hidden");
      document.getElementById(`${target}-tab`).classList.add("block");

      //* Fetch data if not already loaded
      if (!state[target].loaded) {
        renderTable(target);
      }
    });
  });

  //! --- Logout Handler ---
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    window.showFlash("Logging out of Super Admin Portal...", "success");

    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        await fetch("/api/v1/auth/logout", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error("Logout API failed, clearing local session anyway.", error);
    } finally {
      localStorage.removeItem("accessToken");
      setTimeout(() => {
        window.location.href = "/super-admin/login";
      }, 1500);
    }
  });

  // --- Setup Search Event Listeners ---
  const setupSearch = (type) => {
    const input = document.getElementById(`${type}-search`);
    if (input) {
      let debounceTimeout;
      input.addEventListener("input", (e) => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          state[type].search = e.target.value;
          state[type].page = 1; // Reset to page 1 on new search
          renderTable(type);
        }, 500); // 500ms debounce
      });
    }
  };

  setupSearch("hospitals");
  setupSearch("admins");
  setupSearch("contactus");

  // --- Initialize Default Tab ---
  renderTable("hospitals");
});
