
document.addEventListener("DOMContentLoaded", () => {

    const contactForm = document.getElementById("contact-form");
    const formStatus = document.getElementById("form-status");

    if (!contactForm) {
        console.error("Contact form not found!");
        return;
    }

    contactForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const formData = {
            name: document.getElementById("name").value.trim(),
            email: document.getElementById("email").value.trim(),
            message: document.getElementById("message").value.trim()
        };

        const button = contactForm.querySelector('button[type="submit"]');

        button.disabled = true;
        formStatus.textContent = "Sending message...";

        try {

            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Submission failed");
            }

            formStatus.textContent = result.message;
            formStatus.style.color = "green";

            contactForm.reset();

        } catch (error) {

            console.error("Contact form error:", error);

            formStatus.textContent =
                error.message || "Unable to send message.";

            formStatus.style.color = "red";

        } finally {
            button.disabled = false;
        }

    });

});
