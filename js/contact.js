
document.addEventListener("DOMContentLoaded", () => {
    const contactForm = document.getElementById("contact-form");
    const formStatus = document.getElementById("form-status");

    // Check contact form elements
    if (!contactForm || !formStatus) {
        console.error("Contact form or status element not found!");
        return;
    }

    // Render backend API URL
    const API_URL = "https://lakhan-portfolio-api.onrender.com";

    contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Get form data
        const formData = {
            name: document.getElementById("name").value.trim(),
            email: document.getElementById("email").value.trim(),
            message: document.getElementById("message").value.trim()
        };

        const button = contactForm.querySelector('button[type="submit"]');

        // Validate empty fields
        if (!formData.name || !formData.email || !formData.message) {
            formStatus.textContent = "Please fill in all fields.";
            formStatus.style.color = "red";
            return;
        }

        // Disable button while sending
        if (button) button.disabled = true;

        formStatus.textContent = "Sending message...";
        formStatus.style.color = "#55dccc";

        try {
            // Send data to backend
            const response = await fetch(`${API_URL}/api/contact`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            // Read response safely
            const responseText = await response.text();

            let result = {};

            try {
                result = responseText
                    ? JSON.parse(responseText)
                    : {};
            } catch {
                console.error("Invalid server response:", responseText);

                throw new Error(
                    `Server returned an invalid response (HTTP ${response.status}). Check Render logs.`
                );
            }

            // Check HTTP status
            if (!response.ok) {
                throw new Error(
                    result.message || `Request failed (HTTP ${response.status}).`
                );
            }

            // Check API success
            if (result.success !== true) {
                throw new Error(
                    result.message || "Message could not be saved."
                );
            }

            // Success
            formStatus.textContent =
                result.message || "Message sent successfully!";

            formStatus.style.color = "green";

            contactForm.reset();

        } catch (error) {
            console.error("Contact form error:", error);

            formStatus.textContent =
                error.message || "Unable to connect to the server.";

            formStatus.style.color = "red";

        } finally {
            if (button) button.disabled = false;
        }
    });
});
