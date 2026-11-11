
document.addEventListener("DOMContentLoaded", () => {

    // =====================================
    // ADMIN LOGIN
    // =====================================

    const loginForm = document.getElementById("login-form");

    if (loginForm) {

        // Already logged in? Go to dashboard.
        fetch("/api/admin/me")
            .then(response => {
                if (response.ok) {
                    window.location.replace("/admin/dashboard.html");
                }
            })
            .catch(error => console.error(error));

        loginForm.addEventListener("submit", async (e) => {

            e.preventDefault();

            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value;
            const status = document.getElementById("login-status");
            const button = document.getElementById("login-button");

            button.disabled = true;
            button.textContent = "Signing in...";
            status.textContent = "";

            try {

                const response = await fetch("/api/admin/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ username, password })
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message);
                }

                status.textContent = "Login successful!";
                status.style.color = "#48d9cc";

                window.location.replace("/admin/dashboard.html");

            } catch (error) {

                status.textContent = error.message;
                status.style.color = "#ff667a";

            } finally {
                button.disabled = false;
                button.innerHTML = 'Sign In <span>→</span>';
            }

        });
    }


    // =====================================
    // ADMIN DASHBOARD
    // =====================================

    const messagesBody = document.getElementById("messages-body");

    if (messagesBody) {

        const totalMessages = document.getElementById("total-messages");
        const todayMessages = document.getElementById("today-messages");
        const messageSearch = document.getElementById("message-search");
        const messageCount = document.getElementById("message-count");
        const dashboardStatus = document.getElementById("dashboard-status");

        let allMessages = [];

        // Check authentication
        async function checkAdmin() {

            try {

                const response = await fetch("/api/admin/me");

                if (!response.ok) {
                    window.location.replace("/admin/login.html");
                    return false;
                }

                const result = await response.json();

                document.getElementById("admin-name").textContent =
                    result.admin.username;

                return true;

            } catch (error) {

                console.error(error);
                window.location.replace("/admin/login.html");
                return false;
            }
        }


        // Load dashboard statistics
        async function loadStats() {

            try {

                const response = await fetch("/api/admin/stats");

                if (!response.ok) {
                    throw new Error("Unable to load statistics.");
                }

                const result = await response.json();

                totalMessages.textContent = result.stats.total;
                todayMessages.textContent = result.stats.today;

            } catch (error) {

                dashboardStatus.textContent = error.message;
            }
        }


        // Create safe table cells using textContent
        function createCell(value) {

            const td = document.createElement("td");
            td.textContent = value ?? "";

            return td;
        }


        // Load messages
        async function loadMessages(search = "") {

            messagesBody.innerHTML = "";

            const loadingRow = document.createElement("tr");
            const loadingCell = createCell("Loading messages...");
            loadingCell.colSpan = 6;
            loadingCell.className = "empty-state";

            loadingRow.appendChild(loadingCell);
            messagesBody.appendChild(loadingRow);

            try {

                const response = await fetch(
                    "/api/admin/messages?search=" +
                    encodeURIComponent(search)
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message);
                }

                allMessages = result.messages;

                renderMessages(allMessages);

                dashboardStatus.textContent = "";

            } catch (error) {

                dashboardStatus.textContent = error.message;
                messagesBody.innerHTML = "";

                const row = document.createElement("tr");
                const cell = createCell(error.message);
                cell.colSpan = 6;
                cell.className = "empty-state";

                row.appendChild(cell);
                messagesBody.appendChild(row);
            }
        }


        // Display messages
        function renderMessages(messages) {

            messagesBody.innerHTML = "";

            messageCount.textContent =
                `${messages.length} messages`;

            if (messages.length === 0) {

                const row = document.createElement("tr");
                const cell = createCell("No messages found.");
                cell.colSpan = 6;
                cell.className = "empty-state";

                row.appendChild(cell);
                messagesBody.appendChild(row);

                return;
            }

            messages.forEach(message => {

                const row = document.createElement("tr");

                row.appendChild(createCell(message.id));
                row.appendChild(createCell(message.name));
                row.appendChild(createCell(message.email));

                const messageCell = createCell(message.message);
                messageCell.title = message.message;
                row.appendChild(messageCell);

                const date = new Date(message.created_at);

                row.appendChild(
                    createCell(
                        Number.isNaN(date.getTime())
                            ? ""
                            : date.toLocaleString()
                    )
                );

                const actionCell = document.createElement("td");

                // View button
                const viewButton = document.createElement("button");
                viewButton.className = "action-button";
                viewButton.textContent = "View";

                viewButton.addEventListener("click", () => {
                    openMessage(message);
                });

                // Delete button
                const deleteButton = document.createElement("button");
                deleteButton.className =
                    "action-button delete-button";

                deleteButton.textContent = "Delete";

                deleteButton.addEventListener("click", () => {
                    deleteMessage(message.id);
                });

                actionCell.appendChild(viewButton);
                actionCell.appendChild(deleteButton);

                row.appendChild(actionCell);

                messagesBody.appendChild(row);

            });
        }


        // View full message
        function openMessage(message) {

            document.getElementById("modal-name").textContent =
                message.name;

            document.getElementById("modal-email").textContent =
                message.email;

            document.getElementById("modal-message").textContent =
                message.message;

            const date = new Date(message.created_at);

            document.getElementById("modal-date").textContent =
                Number.isNaN(date.getTime())
                    ? ""
                    : date.toLocaleString();

            document.getElementById("message-modal").hidden = false;
        }


        // Close modal
        document.getElementById("close-modal").addEventListener(
            "click",
            () => {
                document.getElementById("message-modal").hidden = true;
            }
        );


        document.getElementById("message-modal").addEventListener(
            "click",
            (e) => {
                if (e.target.id === "message-modal") {
                    e.currentTarget.hidden = true;
                }
            }
        );


        // Delete message
        async function deleteMessage(id) {

            const confirmed = confirm(
                "Are you sure you want to delete this message?"
            );

            if (!confirmed) return;

            try {

                const response = await fetch(
                    `/api/admin/messages/${id}`,
                    { method: "DELETE" }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message);
                }

                dashboardStatus.textContent = result.message;

                await loadMessages(messageSearch.value.trim());
                await loadStats();

            } catch (error) {

                dashboardStatus.textContent = error.message;
            }
        }


        // Search messages
        let searchTimer;

        messageSearch.addEventListener("input", () => {

            clearTimeout(searchTimer);

            searchTimer = setTimeout(() => {
                loadMessages(messageSearch.value.trim());
            }, 300);

        });


        // Refresh button
        document.getElementById("refresh-button").addEventListener(
            "click",
            async () => {
                await loadStats();
                await loadMessages(messageSearch.value.trim());
            }
        );


        // Logout
        document.getElementById("logout-button").addEventListener(
            "click",
            async () => {

                try {

                    const response = await fetch("/api/admin/logout", {
                        method: "POST"
                    });

                    if (!response.ok) {
                        throw new Error("Logout failed.");
                    }

                    window.location.replace("/admin/login.html");

                } catch (error) {

                    dashboardStatus.textContent = error.message;
                }
            }
        );


        // Start dashboard after authentication
        (async () => {

            const authenticated = await checkAdmin();

            if (!authenticated) return;

            await loadStats();
            await loadMessages();

        })();

    }

});
